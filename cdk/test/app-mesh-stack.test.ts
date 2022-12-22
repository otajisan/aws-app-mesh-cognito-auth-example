import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { AppMeshStack } from '../lib/app-mesh-stack';

describe('correct resources are created', () => {
  const synthStack = () => {
    const app = new cdk.App();
    return new AppMeshStack(app, 'AppMeshStack', {
      env: {
        account: process.env.CDK_DEPLOY_ACCOUNT,
        region: process.env.CDK_DEPLOY_REGION,
      },
    });
  };

  test('ECR repository is created', () => {
    const template = Template.fromStack(synthStack());

    const expectedRepositories = [
      'mtaji-test-aws-app-mesh-frontend',
      'mtaji-test-aws-app-mesh-backend',
    ];

    expectedRepositories.forEach((repoName) => {
      template.hasResourceProperties('AWS::ECR::Repository', {
        RepositoryName: repoName,
      });
    });
  });
});
