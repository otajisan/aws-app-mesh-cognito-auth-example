import { Stack, StackProps, Tags } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { IMesh, Mesh } from 'aws-cdk-lib/aws-appmesh';

export class AppMeshStack extends Stack {
  public readonly mesh: IMesh;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Service Mesh
    this.mesh = new Mesh(this, 'Mesh', {
      meshName: 'morningcode-app-mesh',
    });

    Tags.of(this).add('ServiceName', 'morningcode');
  }
}
