import {
  Duration, RemovalPolicy, Stack, StackProps,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { VirtualGateway, VirtualGatewayListener } from 'aws-cdk-lib/aws-appmesh';
import { SecurityGroup, Vpc } from 'aws-cdk-lib/aws-ec2';
import {
  AwsLogDriver, Cluster, ContainerImage, FargateTaskDefinition, UlimitName,
} from 'aws-cdk-lib/aws-ecs';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { ApplicationLoadBalancedFargateService } from 'aws-cdk-lib/aws-ecs-patterns';
import { Protocol } from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { ManagedPolicy } from 'aws-cdk-lib/aws-iam';
import { AppMeshStack } from './app-mesh-stack';

export interface IngressGatewayServiceStackProps extends StackProps {
  vpcName: string,
  appMeshStack: AppMeshStack
}

export class IngressGatewayServiceStack extends Stack {
  constructor(scope: Construct, id: string, props: IngressGatewayServiceStackProps) {
    super(scope, id, props);

    // Vpc
    const vpc = Vpc.fromLookup(this, 'Vpc', {
      vpcName: props.vpcName,
    });

    const { mesh } = props.appMeshStack;

    const port = 8080;

    const gateway = new VirtualGateway(this, 'VirtualGateway', {
      mesh,
      listeners: [VirtualGatewayListener.http({ port })],
    });

    // Application Names
    const appName = 'mtaji-test-app-mesh-ingress-envoy';

    // ECS Cluster
    const ecsCluster = new Cluster(this, `EcsCluster-${appName}`, {
      clusterName: appName,
      vpc,
      containerInsights: true,
    });

    const taskDefinition = new FargateTaskDefinition(this, `TaskDefinition-${appName}`, {
      family: appName,
      memoryLimitMiB: 512,
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

    const containerDefinition = taskDefinition.addContainer('Container', {
      containerName: appName,
      image: ContainerImage.fromRegistry('public.ecr.aws/appmesh/aws-appmesh-envoy:v1.24.0.0-prod'),
      logging: awsLogDriver,
      portMappings: [
        { containerPort: port },
        { containerPort: 9901 }, // health check port
      ],
      healthCheck: {
        // health check from Documentation
        command: ['CMD-SHELL', 'curl -s http://localhost:9901/server_info | grep state | grep -q LIVE || exit 1'],
        interval: Duration.seconds(5),
        timeout: Duration.seconds(2),
        startPeriod: Duration.seconds(10),
        retries: 3,
      },
      environment: {
        ENVOY_LOG_LEVEL: 'info',
        APPMESH_VIRTUAL_NODE_NAME: `mesh/${mesh.meshName}/virtualNode/${appName}`,
        AWS_REGION: Stack.of(this).region,
      },
      memoryLimitMiB: 320,
      cpu: 208,
      user: '1337',
    });

    containerDefinition.addUlimits({
      name: UlimitName.NOFILE, hardLimit: 1024000, softLimit: 1024000,
    });

    containerDefinition.taskDefinition.taskRole.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName('AWSAppMeshEnvoyAccess'),
    );

    containerDefinition.taskDefinition.taskRole.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy'),
    );

    // Security Group
    const ecsSecurityGroup = new SecurityGroup(this, 'EcsSg', {
      securityGroupName: `${appName}-sg`,
      vpc: ecsCluster.vpc,
    });

    // ECS - Fargate
    const fargateService = new ApplicationLoadBalancedFargateService(this, 'ECSService', {
      cluster: ecsCluster,
      serviceName: appName,
      loadBalancerName: 'envoy-ingress-gateway-alb',
      desiredCount: 1,
      taskDefinition,
      securityGroups: [ecsSecurityGroup],
      publicLoadBalancer: true,
    });

    fargateService.targetGroup.configureHealthCheck({
      protocol: Protocol.HTTP,
      interval: Duration.seconds(10),
      port: '9901',
      path: '/server_info',
    });
  }
}
