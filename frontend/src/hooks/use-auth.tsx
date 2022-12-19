import { Amplify, Auth } from 'aws-amplify';
import AwsConfigAuth from '../aws/auth';
import React, { createContext, PropsWithChildren, ReactElement, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';

Amplify.configure({ Auth: AwsConfigAuth, ssr: true });

interface UseAuth {
  isLoading: boolean;
  isAuthenticated: boolean;
  isSignedIn: boolean;
  username: string;
  groups: string[];
  email: string;
  currentUser: () => Promise<Result>;
  signIn: (username: string, password: string) => Promise<Result>;
  signOut: () => Promise<Result>;
  completeNewPassword: (newPassword: string) => Promise<Result>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<Result>;
  forgotPassword: (username: string) => Promise<Result>;
  forgotPasswordSubmit: (username: string, verificationCode: string, newPassword: string) => Promise<Result>;
  updateUserAttributes: (attr: UserAttributes) => Promise<Result>;
  verifyCurrentUserAttributeSubmit: (verificationCode: string) => Promise<Result>;
  verifyCurrentUserAttribute: () => Promise<Result>;
}

interface Result {
  success: boolean;
  message: string;
}

const authContext = createContext({} as UseAuth);

type Props = {
  children?: ReactElement;
};

export const ProvideAuth: React.FC<PropsWithChildren<Props>> = (props) => {
  const auth = useProvideAuth();
  return <authContext.Provider value={auth}> {props.children} </authContext.Provider>;
};

export const useAuth = () => {
  return useContext(authContext);
};

const useProvideAuth = (): UseAuth => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [groups, setGroups] = useState<string[]>([]);
  const [signedUpUser, setSignedUpUser] = useState(null);
  const [isSignedIn, setIsSignedIn] = useState(false);

  const router = useRouter();

  useEffect(() => {
    Auth.currentAuthenticatedUser({ bypassCache: false })
      .then((result) => {
        setUsername(result.username);
        setEmail(result.attributes.email);
        setEmailVerified(result.attributes.email_verified);
        setIsAuthenticated(true);
        setIsSignedIn(true);

        const session = result.signInUserSession;
        const { payload } = session.getIdToken();
        const cognitoGroups = payload['cognito:groups'];
        setGroups(cognitoGroups);
        setIsLoading(false);
      })
      .catch(() => {
        setUsername('');
        setGroups([]);
        setEmail('');
        setEmailVerified(false);
        setIsAuthenticated(false);
        setIsSignedIn(false);
        setSignedUpUser(null);
        setIsLoading(false);
      });
  }, []);

  const signIn = async (username: string, password: string) => {
    return await Auth.signIn(username, password)
      .then((result) => {
        setUsername(result.username);
        setSignedUpUser(result);
        setIsSignedIn(true);
        const challengeName = result.challengeName;
        if (challengeName === 'NEW_PASSWORD_REQUIRED') {
          router.push('password/new');
          return { success: false, message: 'new password required.' };
        } else {
          setEmail(result.attributes.email);
          setEmailVerified(result.attributes.email_verified);
          setIsAuthenticated(true);

          // NOTE: null if initial sign in
          if (result.signInUserSession !== null) {
            const session = result.signInUserSession;
            const { payload } = session.getIdToken();
            if (payload && payload['cognito:groups']) {
              const cognitoGroups = payload['cognito:groups'];
              setGroups(cognitoGroups);
            }
          }
        }
        return { success: true, message: '' };
      })
      .catch((e) => {
        if (e.code === 'NotAuthorizedException' && e.message === 'password has expired.') {
          return {
            success: false,
            message: 'password has expired.',
          };
        }
        if (e.code === 'PasswordResetRequiredException') {
          router.push('password/forgot').then();
          return {
            success: false,
            message: 'please change your password',
          };
        }
        return {
          success: false,
          message: 'sign in failed.',
        };
      });
  };

  const signOut = async () => {
    return await Auth.signOut()
      .then((result) => {
        setUsername('');
        setGroups([]);
        setEmail('');
        setEmailVerified(false);
        setIsAuthenticated(false);
        setIsSignedIn(false);
        setSignedUpUser(null);
        return { success: true, message: '' };
      })
      .catch((e) => {
        return {
          success: false,
          message: 'sign out failed.',
        };
      });
  };

  const completeNewPassword = async (newPassword: string) => {
    return Auth.completeNewPassword(signedUpUser, newPassword)
      .then(() => signOut())
      .catch((e) => {
        if (e.code === 'InvalidPasswordException') {
          return {
            success: false,
            message:
              'Password must be at least 8 characters long and contain uppercase, lowercase, and special characters.',
          };
        }
        return {
          success: false,
          message: 'failed to set new password.',
        };
      });
  };

  const changePassword = async (oldPassword: string, newPassword: string) => {
    try {
      const user = await Auth.currentAuthenticatedUser();
      return Auth.changePassword(user, oldPassword, newPassword)
        .then((result) => {
          setIsAuthenticated(true);
          return { success: true, message: '' };
        })
        .catch((e) => {
          if (e.code === 'InvalidPasswordException') {
            return {
              success: false,
              message:
                'Password must be at least 8 characters long and contain uppercase, lowercase, and special characters.',
            };
          }
          if (e.code === 'LimitExceededException') {
            return {
              success: false,
              message: 'reached the limit. please retry after a while.',
            };
          }
          return {
            success: false,
            message: 'failed to change password...',
          };
        });
    } catch (e) {
      return {
        success: false,
        message: 'failed to change password...',
      };
    }
  };

  const forgotPassword = async (username: string) => {
    return await Auth.forgotPassword(username)
      .then((result) => {
        return { success: true, message: '' };
      })
      .catch((e) => {
        if (e.code === 'LimitExceededException') {
          return {
            success: false,
            message: 'reached the limit. please retry after a while.',
          };
        }
        return {
          success: false,
          message: 'failed to reset password.',
        };
      });
  };

  const forgotPasswordSubmit = async (username: string, verificationCode: string, newPassword: string) => {
    return await Auth.forgotPasswordSubmit(username, verificationCode, newPassword)
      .then((result) => {
        return { success: true, message: '' };
      })
      .catch((e) => {
        if (e.code === 'CodeMismatchException') {
          return {
            success: false,
            message: 'verification code expired.',
          };
        }
        if (e.code === 'LimitExceededException') {
          return {
            success: false,
            message: 'reached the limit. please retry after a while.',
          };
        }
        return {
          success: false,
          message: 'failed to reset password.',
        };
      });
  };

  const updateUserAttributes = async (attr: UserAttributes) => {
    try {
      const user = await Auth.currentAuthenticatedUser();
      return await Auth.updateUserAttributes(user, attr)
        .then((result) => {
          if (attr.email !== null && typeof attr.email !== undefined && attr.email !== '') {
            setEmail(attr.email!);
          }
          return { success: true, message: '' };
        })
        .catch((e) => {
          return {
            success: false,
            message: 'failed to update user attribute.',
          };
        });
    } catch (e) {
      return {
        success: false,
        message: 'not authorized.',
      };
    }
  };

  const verifyCurrentUserAttributeSubmit = async (verificationCode: string) => {
    return await Auth.verifyCurrentUserAttributeSubmit('email', verificationCode)
      .then((result) => {
        return { success: true, message: '' };
      })
      .catch((e) => {
        if (e.code === 'ExpiredCodeException') {
          return {
            success: false,
            message: 'your verification code is expired. please re-send verification code.',
          };
        } else if (e.code === 'CodeMismatchException') {
          return {
            success: false,
            message: 'your verification code is mismatched. please check.',
          };
        }
        return {
          success: false,
          message: 'failed to verify email...',
        };
      });
  };

  const verifyCurrentUserAttribute = async () => {
    return await Auth.verifyCurrentUserAttribute('email')
      .then((result) => {
        return { success: true, message: '' };
      })
      .catch((e) => {
        return {
          success: false,
          message: 'failed to re-send verification code.',
        };
      });
  };

  const currentUser = async () => {
    return await Auth.currentUserInfo();
  };

  return {
    isLoading,
    isAuthenticated,
    isSignedIn: isSignedIn,
    username,
    groups,
    email,
    currentUser,
    signIn,
    signOut,
    completeNewPassword,
    changePassword,
    forgotPassword,
    forgotPasswordSubmit,
    updateUserAttributes,
    verifyCurrentUserAttributeSubmit,
    verifyCurrentUserAttribute,
  };
};

export type UserAttributes = {
  email?: string;
};
