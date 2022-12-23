import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { CloudMapNamespaceStack } from '../lib/cloud-map-namespace-stack';

describe('correct resources are created', () => {
  const synthStack = () => {
    const app = new cdk.App();
    const env = {
      account: process.env.CDK_DEPLOY_ACCOUNT,
      region: process.env.CDK_DEPLOY_REGION,
    };
    const vpcName = 'my-vpc';
    return new CloudMapNamespaceStack(app, 'CloudMapNamespaceStack', {
      env,
      vpcName,
    });
  };

  test('Cloud Map namespace is created', () => {
    const template = Template.fromStack(synthStack());

    const expected = 'morningcode.internal-jp';
    template.hasResourceProperties('AWS::ServiceDiscovery::PrivateDnsNamespace', {
      Name: expected,
    });
  });
});
