import getConfig from 'next/config';

const { publicRuntimeConfig } = getConfig();

const AwsConfigAuth = {
  region: publicRuntimeConfig.region,
  userPoolId: publicRuntimeConfig.userPoolId,
  userPoolWebClientId: publicRuntimeConfig.userPoolWebClientId,
  authenticationFlowType: 'USER_SRP_AUTH',
};

export default AwsConfigAuth;
