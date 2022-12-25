import {
  Duration,
  RemovalPolicy, Stack, StackProps, Tags,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Repository } from 'aws-cdk-lib/aws-ecr';
import {
  Peer, Port, SecurityGroup, Vpc,
} from 'aws-cdk-lib/aws-ec2';
import {
  AppMeshProxyConfiguration,
  AwsLogDriver,
  Cluster,
  ContainerImage,
  EcrImage,
  FargateService,
  FargateTaskDefinition,
  Protocol,
} from 'aws-cdk-lib/aws-ecs';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { ManagedPolicy } from 'aws-cdk-lib/aws-iam';
import { DnsRecordType, Service } from 'aws-cdk-lib/aws-servicediscovery';
import {
  HealthCheck, RouteSpec,
  ServiceDiscovery,
  VirtualNode,
  VirtualNodeListener,
  VirtualRouter,
  VirtualRouterListener,
  VirtualService, VirtualServiceProvider,
} from 'aws-cdk-lib/aws-appmesh';
import { CloudMapNamespaceStack } from './cloud-map-namespace-stack';
import { AppMeshStack } from './app-mesh-stack';

export interface BackEndStackProps extends StackProps {
    vpcName: string,
    cloudMapNamespaceStack: CloudMapNamespaceStack,
    appMeshStack: AppMeshStack
}

export class BackEndStack extends Stack {
  constructor(scope: Construct, id: string, props: BackEndStackProps) {
    super(scope, id, props);

    // Vpc
    const vpc = Vpc.fromLookup(this, 'Vpc', {
      vpcName: props.vpcName,
    });

    // Application Names
    const appName = 'mtaji-test-app-mesh-be';

    // ECR
    const repository = Repository.fromRepositoryName(this, 'EcrRepository', appName);

    // ECS Cluster
    const escCluster = new Cluster(this, `EcsCluster-${appName}`, {
      clusterName: appName,
      vpc,
      containerInsights: true,
    });

    // Task Definition
    const taskDefinition = new FargateTaskDefinition(this, `TaskDefinition-${appName}`, {
      family: appName,
      memoryLimitMiB: 1024,
      cpu: 256,
      proxyConfiguration: new AppMeshProxyConfiguration({
        containerName: 'envoy',
        properties: {
          appPorts: [80],
          proxyEgressPort: 15001,
          proxyIngressPort: 15000,
          ignoredUID: 1337,
          egressIgnoredIPs: ['169.254.170.2', '169.254.169.254'],
        },
      }),
    });

    // Log configuration
    const awsLogDriver = new AwsLogDriver({
      logGroup: new LogGroup(this, 'LogGroup', {
        logGroupName: appName,
        retention: RetentionDays.ONE_WEEK,
        removalPolicy: RemovalPolicy.DESTROY,
      }),
      streamPrefix: appName,
    });

    // Application Container
    const containerImage = EcrImage.fromEcrRepository(repository, 'latest');
    const appContainer = {
      image: containerImage,
      memoryLimitMiB: 768,
      logging: awsLogDriver,
      environment: {
        DEPLOY_HASH: process.env.GIT_SHA1 as string,
        GENERATE_SOURCEMAP: 'false',
      },
    };
    const containerDefinition = taskDefinition.addContainer('Container', appContainer);
    containerDefinition.addPortMappings({
      hostPort: 9080,
      containerPort: 9080,
      protocol: Protocol.TCP,
    });
    containerDefinition.addPortMappings({
      hostPort: 39080,
      containerPort: 39080,
      protocol: Protocol.TCP,
    });

    // Envoy Sidecar
    const { mesh } = props.appMeshStack;
    const envoyContainer = taskDefinition.addContainer('EnvoyContainer', {
      containerName: 'envoy',
      // https://docs.aws.amazon.com/ja_jp/app-mesh/latest/userguide/envoy.html
      image: ContainerImage.fromRegistry('public.ecr.aws/appmesh/aws-appmesh-envoy:v1.24.0.0-prod'),
      essential: true,
      environment: {
        ENVOY_LOG_LEVEL: 'info',
        APPMESH_VIRTUAL_NODE_NAME: `mesh/${mesh.meshName}/virtualNode/${appName}`,
        AWS_REGION: Stack.of(this).region,
      },
      healthCheck: {
        command: [
          'CMD-SHELL',
          'curl -s http://localhost:9901/server_info | grep state | grep -q LIVE',
        ],
        startPeriod: Duration.seconds(10),
        interval: Duration.seconds(5),
        timeout: Duration.seconds(2),
        retries: 3,
      },
      memoryLimitMiB: 128,
      user: '1337',
      logging: new AwsLogDriver({
        streamPrefix: `${appName}-envoy`,
      }),
    });
    envoyContainer.taskDefinition.taskRole.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName('AWSAppMeshEnvoyAccess'),
    );
    containerDefinition.addContainerDependencies({
      container: envoyContainer,
    });

    // XRay
    // https://docs.aws.amazon.com/ja_jp/xray/latest/devguide/xray-daemon-ecs.html
    const xrayContainer = taskDefinition.addContainer('XRayContainer', {
      containerName: 'xray-daemon',
      image: ContainerImage.fromRegistry('public.ecr.aws/xray/aws-xray-daemon:3.x'),
      cpu: 32,
      memoryLimitMiB: 256,
      memoryReservationMiB: 256,
      portMappings: [
        { containerPort: 2000, protocol: Protocol.UDP },
      ],
    });

    xrayContainer.taskDefinition.taskRole.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName('AWSXRayDaemonWriteAccess'),
    );

    // Security Group
    const ecsSecurityGroup = new SecurityGroup(this, 'EcsSg', {
      securityGroupName: `${appName}-sg`,
      allowAllOutbound: true,
      vpc,
    });

    ecsSecurityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(9080), 'allow access to Backend API');
    ecsSecurityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(39080), 'allow health check to Backend API');

    // ECS - Fargate with ALB
    const fargateService = new FargateService(this, 'ECSService', {
      cluster: escCluster,
      serviceName: appName,
      desiredCount: 1,
      taskDefinition,
      securityGroups: [ecsSecurityGroup],
    });

    // Cloud Map
    const { namespace } = props.cloudMapNamespaceStack;

    const cloudMapService = new Service(this, 'Service', {
      name: 'be',
      namespace,
      dnsRecordType: DnsRecordType.A_AAAA,
      dnsTtl: Duration.seconds(30),
      loadBalancer: true,
    });

    fargateService.associateCloudMapService({
      service: cloudMapService,
    });

    // App Mesh
    const virtualNode = new VirtualNode(this, 'VirtualNode', {
      mesh,
      virtualNodeName: appName,
      serviceDiscovery: ServiceDiscovery.cloudMap(cloudMapService),
      listeners: [
        VirtualNodeListener.tcp({
          port: 9080,
          healthCheck: HealthCheck.tcp({
            healthyThreshold: 2,
            interval: Duration.seconds(5),
            timeout: Duration.seconds(2),
            unhealthyThreshold: 2,
          }),
        }),

      ],
    });

    const virtualRouter = new VirtualRouter(this, 'VirtualRouter', {
      mesh,
      virtualRouterName: `${appName}-router`,
      listeners: [VirtualRouterListener.http(9080)],
    });

    virtualRouter.addRoute('Route', {
      routeName: `${appName}-route`,
      routeSpec: RouteSpec.http({
        weightedTargets: [{
          virtualNode,
          weight: 1,
        }],
      }),
    });

    const virtualService = new VirtualService(this, 'VirtualService', {
      virtualServiceProvider: VirtualServiceProvider.virtualRouter(virtualRouter),
      virtualServiceName: `be.${props.cloudMapNamespaceStack.namespace.namespaceName}`,
    });

    Tags.of(this).add('ServiceName', 'morningcode');
  }
}
