#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AppMeshStack } from '../lib/app-mesh-stack';
import { FrontEndStack } from '../lib/front-end-stack';
import { CloudMapNamespaceStack } from '../lib/cloud-map-namespace-stack';
import { BackEndStack } from '../lib/back-end-stack';

const env = {
  account: process.env.CDK_DEPLOY_ACCOUNT,
  region: process.env.CDK_DEPLOY_REGION,
};

const vpcName = process.env.VPC_NAME!;

const app = new cdk.App();
const cloudMapNamespaceStack = new CloudMapNamespaceStack(app, 'CloudMapNamespaceStack', { env, vpcName });
new FrontEndStack(app, 'FrontEndStack', { env, vpcName, cloudMapNamespaceStack });
new BackEndStack(app, 'BackEndStack', { env, vpcName, cloudMapNamespaceStack });
new AppMeshStack(app, 'AppMeshStack', { env, vpcName });

app.synth();
