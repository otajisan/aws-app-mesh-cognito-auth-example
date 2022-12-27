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
  AwsLogDriver, Cluster, ContainerImage, EcrImage, FargateTaskDefinition, Protocol, UlimitName,
} from 'aws-cdk-lib/aws-ecs';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { ManagedPolicy } from 'aws-cdk-lib/aws-iam';
import { ApplicationLoadBalancedFargateService } from 'aws-cdk-lib/aws-ecs-patterns';
import { DnsRecordType, Service } from 'aws-cdk-lib/aws-servicediscovery';
import {
  AccessLog, Backend,
  HealthCheck,
  RouteSpec,
  ServiceDiscovery,
  VirtualNode,
  VirtualNodeListener,
  VirtualRouter,
  VirtualRouterListener, VirtualService, VirtualServiceProvider,
} from 'aws-cdk-lib/aws-appmesh';
import { CloudMapNamespaceStack } from './cloud-map-namespace-stack';
import { AppMeshStack } from './app-mesh-stack';
import { BackEndStack } from './back-end-stack';

export interface FrontEndStackProps extends StackProps {
  vpcName: string,
  cloudMapNamespaceStack: CloudMapNamespaceStack,
  appMeshStack: AppMeshStack,
  backEndStack: BackEndStack
}

export class FrontEndStack extends Stack {
  constructor(scope: Construct, id: string, props: FrontEndStackProps) {
    super(scope, id, props);

    // Vpc
    const vpc = Vpc.fromLookup(this, 'Vpc', {
      vpcName: props.vpcName,
    });

    // Application Names
    const appName = 'mtaji-test-app-mesh-fe';

    // ECR
    const repository = Repository.fromRepositoryName(this, 'EcrRepository', appName);

    // ECS Cluster
    const ecsCluster = new Cluster(this, `EcsCluster-${appName}`, {
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
          appPorts: [9080],
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
    const containerDefinition = taskDefinition.addContainer('Container', {
      image: containerImage,
      memoryLimitMiB: 768,
      logging: awsLogDriver,
      environment: {
        DEPLOY_HASH: process.env.GIT_SHA1 as string,
        GENERATE_SOURCEMAP: 'false',
      },
    });
    containerDefinition.addPortMappings({
      hostPort: 3000,
      containerPort: 3000,
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
        startPeriod: Duration.seconds(30),
        interval: Duration.seconds(5),
        timeout: Duration.seconds(2),
        retries: 5,
      },
      memoryLimitMiB: 128,
      user: '1337',
      logging: new AwsLogDriver({
        streamPrefix: `${appName}-envoy`,
      }),
    });
    // healthcheck endpoint
    envoyContainer.addPortMappings({
      hostPort: 9901,
      containerPort: 9901,
      protocol: Protocol.TCP,
    });
    envoyContainer.addUlimits({ name: UlimitName.NOFILE, hardLimit: 15000, softLimit: 15000 });

    envoyContainer.taskDefinition.taskRole.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName('AWSAppMeshEnvoyAccess'),
    );
    containerDefinition.addContainerDependencies({
      container: envoyContainer,
    });

    // XRay
    // https://docs.aws.amazon.com/ja_jp/xray/latest/devguide/xray-daemon-ecs.html
    // const xrayContainer = taskDefinition.addContainer('XRayContainer', {
    //   containerName: 'xray-daemon',
    //   image: ContainerImage.fromRegistry('amazon/aws-xray-daemon:3.x'),
    //   cpu: 32,
    //   memoryLimitMiB: 256,
    //   memoryReservationMiB: 256,
    //   portMappings: [
    //     { containerPort: 2000, protocol: Protocol.UDP },
    //   ],
    // });
    //
    // xrayContainer.taskDefinition.taskRole.addManagedPolicy(
    //   ManagedPolicy.fromAwsManagedPolicyName('AWSXRayDaemonWriteAccess'),
    // );

    // Security Group
    const ecsSecurityGroup = new SecurityGroup(this, 'EcsSg', {
      securityGroupName: `${appName}-sg`,
      allowAllOutbound: true,
      vpc,
    });

    ecsSecurityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(3000), 'allow access to simple frontend service');

    // ECS - Fargate with ALB
    // const certificateArn = StringParameter.valueFromLookup(this, 'ACM_FRONTEND_CERTIFICATE_ARN');
    const fargateService = new ApplicationLoadBalancedFargateService(this, 'ECSService', {
      cluster: ecsCluster,
      serviceName: appName,
      loadBalancerName: `${appName}-alb`,
      desiredCount: 1,
      taskDefinition,
      securityGroups: [ecsSecurityGroup],
      publicLoadBalancer: true,
      // redirectHTTP: true,
      // sslPolicy: SslPolicy.RECOMMENDED,
      // certificate: Certificate.fromCertificateArn(this, 'Cert', certificateArn),
    });

    fargateService.targetGroup.configureHealthCheck({
      path: '/api/healthz',
    });

    // Cloud Map
    const { namespace } = props.cloudMapNamespaceStack;

    const cloudMapService = new Service(this, 'Service', {
      name: 'fe',
      namespace,
      dnsRecordType: DnsRecordType.A_AAAA,
      dnsTtl: Duration.seconds(30),
      loadBalancer: true,
    });

    // cloudMapService.registerLoadBalancer('LB', fargateService.loadBalancer);

    // App Mesh
    const virtualNode = new VirtualNode(this, 'VirtualNode', {
      mesh,
      virtualNodeName: appName,
      serviceDiscovery: ServiceDiscovery.cloudMap(cloudMapService),
      accessLog: AccessLog.fromFilePath('/dev/stdout'),
      listeners: [
        VirtualNodeListener.tcp({
          port: 3000,
          healthCheck: HealthCheck.http({
            // NOTE: https://dev.to/jaecktec/aws-app-mesh-in-5-steps-1bmc
            // no forward slash??
            path: 'api/healthz',
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
      listeners: [VirtualRouterListener.http(3000)],
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
      virtualServiceName: `fe.${props.cloudMapNamespaceStack.namespace.namespaceName}`,
    });

    const backEndVService = props.backEndStack.virtualService;
    virtualNode.addBackend(Backend.virtualService(backEndVService));

    Tags.of(this).add('ServiceName', 'morningcode');
  }
}
