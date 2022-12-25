import {
  RemovalPolicy, Stack, StackProps, Tags,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Repository } from 'aws-cdk-lib/aws-ecr';

export class EcrStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const repositoryList = [
      'mtaji-test-app-mesh-be',
      'mtaji-test-app-mesh-fe',
    ];

    repositoryList.forEach((repoName) => {
      // ECR
      const repository = new Repository(this, `Repository-${repoName}`, {
        repositoryName: repoName,
        imageScanOnPush: true,
        removalPolicy: RemovalPolicy.DESTROY,
      });

      repository.addLifecycleRule({
        maxImageCount: 1,
      });
    });

    Tags.of(this).add('ServiceName', 'morningcode');
  }
}
