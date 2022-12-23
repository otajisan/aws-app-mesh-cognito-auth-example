import {
  Duration,
  RemovalPolicy, Stack, StackProps, Tags,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Repository } from 'aws-cdk-lib/aws-ecr';
import {
  IVpc, Peer, Port, SecurityGroup, Vpc,
} from 'aws-cdk-lib/aws-ec2';
import {
  AwsLogDriver, Cluster, ContainerImage, EcrImage, FargateService, FargateTaskDefinition, Protocol,
} from 'aws-cdk-lib/aws-ecs';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { ManagedPolicy } from 'aws-cdk-lib/aws-iam';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';
import { SslPolicy } from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { ApplicationLoadBalancedFargateService } from 'aws-cdk-lib/aws-ecs-patterns';
import { DnsRecordType, Service } from 'aws-cdk-lib/aws-servicediscovery';
import { CloudMapNamespaceStack, CloudMapNamespaceStackProps } from './cloud-map-namespace-stack';

export interface BackEndStackProps extends StackProps {
    vpcName: string,
    cloudMapNamespaceStack: CloudMapNamespaceStack
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
    const repository = new Repository(this, `Repository-${appName}`, {
      repositoryName: appName,
      imageScanOnPush: true,
      removalPolicy: RemovalPolicy.DESTROY,
      lifecycleRules: [
        {
          maxImageCount: 1,
        },
      ],
    });

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
      hostPort: 9080,
      containerPort: 9080,
      protocol: Protocol.TCP,
    });
    containerDefinition.addPortMappings({
      hostPort: 39080,
      containerPort: 39080,
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

    Tags.of(this).add('ServiceName', 'morningcode');
  }
}
