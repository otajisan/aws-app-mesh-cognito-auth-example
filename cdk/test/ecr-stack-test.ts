import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { EcrStack } from '../lib/ecr-stack';

describe('correct resources are created', () => {
  const synthStack = () => {
    const app = new cdk.App();
    const env = {
      account: process.env.CDK_DEPLOY_ACCOUNT,
      region: process.env.CDK_DEPLOY_REGION,
    };
    return new EcrStack(app, 'EcrStack', { env });
  };

  test('ECR repositories are created', () => {
    const template = Template.fromStack(synthStack());

    const expectedRepositories = [
      'mtaji-test-app-mesh-be',
      'mtaji-test-app-mesh-fe',
    ];
    expectedRepositories.forEach((expected) => template.hasResourceProperties('AWS::ECR::Repository', {
      RepositoryName: expected,
    }));
  });
});
