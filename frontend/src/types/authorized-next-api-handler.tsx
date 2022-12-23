import { NextApiRequest, NextApiResponse } from 'next';
import { CognitoUserSession } from 'amazon-cognito-identity-js';

export type AuthorizedNextApiHandler<T = any> = (
  req: NextApiRequest,
  res: NextApiResponse<T>,
  auth: CognitoUserSession,
) => void | Promise<void>;
