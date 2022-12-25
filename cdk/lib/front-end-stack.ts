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
  AwsLogDriver, Cluster, ContainerImage, EcrImage, FargateTaskDefinition, Protocol,
} from 'aws-cdk-lib/aws-ecs';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { ManagedPolicy } from 'aws-cdk-lib/aws-iam';
import { ApplicationLoadBalancedFargateService } from 'aws-cdk-lib/aws-ecs-patterns';
import { DnsRecordType, Service } from 'aws-cdk-lib/aws-servicediscovery';
import { CloudMapNamespaceStack } from './cloud-map-namespace-stack';
import { AppMeshStack } from './app-mesh-stack';

export interface FrontEndStackProps extends StackProps {
    vpcName: string,
    cloudMapNamespaceStack: CloudMapNamespaceStack,
    appMeshStack: AppMeshStack
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

    // XRay
    // https://docs.aws.amazon.com/ja_jp/xray/latest/devguide/xray-daemon-ecs.html
    const xrayContainer = taskDefinition.addContainer('XRayContainer', {
      containerName: 'xray-daemon',
      image: ContainerImage.fromRegistry('amazon/aws-xray-daemon:3.x'),
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

    ecsSecurityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(3000), 'allow access to simple frontend service');

    // ECS - Fargate with ALB
    // const certificateArn = StringParameter.valueFromLookup(this, 'ACM_FRONTEND_CERTIFICATE_ARN');
    const fargateService = new ApplicationLoadBalancedFargateService(this, 'ECSService', {
      cluster: escCluster,
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

    cloudMapService.registerLoadBalancer('LB', fargateService.loadBalancer);

    Tags.of(this).add('ServiceName', 'morningcode');
  }
}
