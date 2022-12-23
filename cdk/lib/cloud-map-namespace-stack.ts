import { Stack, StackProps, Tags } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { IPrivateDnsNamespace, PrivateDnsNamespace } from 'aws-cdk-lib/aws-servicediscovery';
import { Vpc } from 'aws-cdk-lib/aws-ec2';

export interface CloudMapNamespaceStackProps extends StackProps {
    vpcName: string,
}

export class CloudMapNamespaceStack extends Stack {
  public readonly namespace: IPrivateDnsNamespace;

  constructor(scope: Construct, id: string, props: CloudMapNamespaceStackProps) {
    super(scope, id, props);

    // VPC
    const vpc = Vpc.fromLookup(this, 'Vpc', {
      vpcName: props.vpcName,
    });

    // CloudMap Namespace
    this.namespace = new PrivateDnsNamespace(this, 'Namespace', {
      name: 'morningcode.internal-jp',
      vpc,
    });

    Tags.of(this).add('ServiceName', 'morningcode');
  }
}
