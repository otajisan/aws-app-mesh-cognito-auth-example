import {
  RemovalPolicy, Stack, StackProps, Tags,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Repository } from 'aws-cdk-lib/aws-ecr';

export class AppMeshStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const repositoryList = [
      'mtaji-test-aws-app-mesh-frontend',
      'mtaji-test-aws-app-mesh-backend',
    ];

    repositoryList.forEach((repoName) => {
      // ECR
      const repository = new Repository(this, `Repository-${repoName}`, {
        repositoryName: repoName,
        imageScanOnPush: true,
        // NOTE: if you want to delete this Repository, you should delete it manually
        removalPolicy: RemovalPolicy.RETAIN,
      });

      repository.addLifecycleRule({
        maxImageCount: 1,
      });
    });

    Tags.of(this).add('ServiceName', 'morningcode');
  }
}
