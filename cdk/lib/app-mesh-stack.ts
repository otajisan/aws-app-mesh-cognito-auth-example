import {
  RemovalPolicy, Stack, StackProps, Tags,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Repository } from 'aws-cdk-lib/aws-ecr';
import { IVpc, Vpc } from 'aws-cdk-lib/aws-ec2';
import {
  AwsLogDriver, Cluster, FargateService, FargateTaskDefinition,
} from 'aws-cdk-lib/aws-ecs';

export interface AppMeshStackProps extends StackProps {
    vpcName: string,
}

export class AppMeshStack extends Stack {
  constructor(scope: Construct, id: string, props: AppMeshStackProps) {
    super(scope, id, props);

    // Vpc
    const vpc = Vpc.fromLookup(this, 'Vpc', {
      vpcName: props.vpcName,
    });

    // Application Names
    const appNameFe = 'mtaji-test-aws-app-mesh-frontend';
    const appNameBe = 'mtaji-test-aws-app-mesh-backend';
    const appNames = [
      appNameFe,
      appNameBe,
    ];

    Tags.of(this).add('ServiceName', 'morningcode');
  }
}
