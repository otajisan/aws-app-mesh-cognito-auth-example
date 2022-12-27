# AWS App Mesh Example

## Deployment

```bash
npx cdk diff --profile=xxx "*Stack"
npx cdk deploy --profile=xxx "*Stack"
```

```bash
npx cdk diff --profile morning-code-dev EcrStack
npx cdk diff --profile morning-code-dev CloudMapNamespaceStack
npx cdk diff --profile morning-code-dev AppMeshStack
npx cdk diff --profile morning-code-dev IngressGatewayServiceStack
npx cdk diff --profile morning-code-dev BackEndStack
npx cdk diff --profile morning-code-dev FrontEndStack
```

## Tests

```bash
npm run test
```

## Refs
- https://dev.to/jaecktec/aws-app-mesh-in-5-steps-1bmc
   - https://github.com/jaecktec/aws-cdk-appmesh-example/blob/final/infrastructure/lib/infrastructure-stack.ts
- https://github.com/nathanpeck/greeter-app-mesh-cdk/blob/master/index.js
