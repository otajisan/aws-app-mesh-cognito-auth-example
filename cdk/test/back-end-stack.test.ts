import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { FrontEndStack } from '../lib/front-end-stack';
import { CloudMapNamespaceStack } from '../lib/cloud-map-namespace-stack';
import { BackEndStack } from '../lib/back-end-stack';

describe('correct resources are created', () => {
  const synthStack = () => {
    const app = new cdk.App();
    const env = {
      account: process.env.CDK_DEPLOY_ACCOUNT,
      region: process.env.CDK_DEPLOY_REGION,
    };
    const vpcName = 'my-vpc';
    return new BackEndStack(app, 'BackEndStack', {
      env,
      vpcName,
      cloudMapNamespaceStack: new CloudMapNamespaceStack(app, 'CloudMapNamespaceStack', {
        env,
        vpcName,
      }),
    });
  };

  test('ECR repository is created', () => {
    const template = Template.fromStack(synthStack());

    const expected = 'mtaji-test-app-mesh-be';
    template.hasResourceProperties('AWS::ECR::Repository', {
      RepositoryName: expected,
    });
  });

  test('ECS Cluster is created', () => {
    const template = Template.fromStack(synthStack());

    const expected = 'mtaji-test-app-mesh-be';
    template.hasResourceProperties('AWS::ECS::Cluster', {
      ClusterName: expected,
    });
  });

  test('Task Definition is created', () => {
    const template = Template.fromStack(synthStack());

    const expected = 'mtaji-test-app-mesh-be';
    template.hasResourceProperties('AWS::ECS::TaskDefinition', {
      Family: expected,
    });
  });

  test('Fargate Service is created', () => {
    const template = Template.fromStack(synthStack());

    const expected = 'mtaji-test-app-mesh-be';
    template.hasResourceProperties('AWS::ECS::Service', {
      ServiceName: expected,
    });
  });

  test('ServiceDiscovery name is created', () => {
    const template = Template.fromStack(synthStack());

    const expected = 'be';
    template.hasResourceProperties('AWS::ServiceDiscovery::Service', {
      Name: expected,
    });
  });

  test('Security groups are created', () => {
    const template = Template.fromStack(synthStack());

    const expected = ['mtaji-test-app-mesh-be-sg'];
    expected.forEach((securityGroupName) => template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupName: securityGroupName,
    }));
  });

  test('CloudWatch log group is created', () => {
    const template = Template.fromStack(synthStack());

    const expected = 'mtaji-test-app-mesh-be';
    template.hasResourceProperties('AWS::Logs::LogGroup', {
      LogGroupName: expected,
    });
  });
});
