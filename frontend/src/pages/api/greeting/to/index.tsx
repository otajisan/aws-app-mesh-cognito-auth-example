import { AuthorizedNextApiHandler } from '../../../../types/authorized-next-api-handler';
import ApiClient from '../../../../lib/api-client';
import { SsrAuthorizer } from '../../../../lib/ssr-authorizer';
import { CognitoUserSession } from 'amazon-cognito-identity-js';

const GreetingHandler: AuthorizedNextApiHandler = async (req, res, auth: CognitoUserSession | any) => {
  const name = getUserNameFromAuth(auth);

  const path = `/greeting/to/${name}`;
  const headers = {
    'content-type': 'application/json',
  };
  await ApiClient.get(path, {
    headers: headers,
  }).then((response) => res.status(response.status).json(response.data));
};

const getUserNameFromAuth = (auth: any) => {
  const session = auth.signInUserSession;
  const { payload } = session.getIdToken();
  // NOTE:
  // {
  //   sub: 'xxx-xxx-xxx-xxx-xxx',
  //       'cognito:groups': [
  //   'foo-group',
  //   'bar-group',
  // ],
  //     email_verified: true,
  //     iss: 'https://cognito-idp.ap-northeast-1.amazonaws.com/ap-northeast-1_xxxxxxxxx',
  //     'cognito:username': 'otajisan',
  //     origin_jti: 'xxx-xxx-xxx-xxx-xxx',
  //     'cognito:roles': [ 'arn:aws:iam::xxx:role/dev' ],
  //     aud: 'xxxxxxxxxxxxxxxxxxxxxxxxxx',
  //     event_id: 'xxx-xxx-xxx-xxx-xxx',
  //     token_use: 'id',
  //     auth_time: 1671764693,
  //     exp: 1671768293,
  //     iat: 1671764693,
  //     jti: 'xxx-xxx-xxx-xxx-xxx',
  //     email: 'otajisan@example.com'
  // }

  return payload['cognito:username'];
};

export default SsrAuthorizer(GreetingHandler);
