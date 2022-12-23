import { NextApiRequest, NextApiResponse } from 'next';
import { withSSRContext } from 'aws-amplify';
import { AuthorizedNextApiHandler } from '../types/authorized-next-api-handler';
import { CognitoUser } from 'amazon-cognito-identity-js';
import { AuthError } from '@aws-amplify/auth/lib/Errors';

export const SsrAuthorizer = (handler: AuthorizedNextApiHandler) => {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    console.log(
      JSON.stringify({
        component: handler.name,
        message: 'check auth in SSR',
        url: req.url,
        query: req.query,
        body: req.body,
      }),
    );
    const { Auth } = withSSRContext({ req: req });
    Auth.currentAuthenticatedUser({ bypassCache: false })
      .then((auth: CognitoUser | any) => {
        console.log(
          JSON.stringify({
            component: handler.name,
            message: 'success fetch authenticated user info',
            username: auth.username,
            url: req.url,
          }),
        );
        return handler(req, res, auth);
      })
      .catch((e: AuthError) => {
        console.error(
          JSON.stringify({
            component: handler.name,
            status: 401,
            message: 'Unauthorized',
            details: e,
          }),
        );

        res.status(401).json({
          status: 401,
          message: 'Unauthorized',
        });
      });
  };
};
