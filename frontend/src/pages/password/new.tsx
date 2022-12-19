import { NextPage } from 'next';
import Router from 'next/router';
import React, { PropsWithChildren, useState } from 'react';
import '@aws-amplify/ui-react/styles.css';
import { useAuth } from '../../hooks/use-auth';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Alert } from '@mui/material';

/**
 * New password page
 *
 * @see https://github.com/mui/material-ui/blob/v5.6.2/docs/data/material/getting-started/templates/sign-in/SignIn.tsx
 *
 * @param props
 * @constructor
 */
const NewPassword: NextPage = (props: PropsWithChildren<Props>) => {
  const auth = useAuth();
  const [username, setUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isAuthFailed, setAuthFailed] = useState(false);

  const completeNewPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const result = await auth.completeNewPassword(newPassword);
    if (result.success) {
      await Router.push('/');
    } else {
      setAuthFailed(true);
    }
  };

  const theme = createTheme();

  return (
    <ThemeProvider theme={theme}>
      <Container component='main' maxWidth='xs'>
        <CssBaseline />
        <Box
          sx={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
            <LockOutlinedIcon />
          </Avatar>
          <Typography component='h1' variant='h5'>
            Hi, Please change your password.
          </Typography>
          <Box component='form' onSubmit={completeNewPassword} noValidate sx={{ mt: 1 }}>
            <TextField
              margin='normal'
              required
              fullWidth
              name='new-password'
              label='New Password'
              type='password'
              id='new-password'
              autoComplete='new-password'
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <Button type='submit' fullWidth variant='outlined' sx={{ mt: 3, mb: 2 }}>
              Change password
            </Button>
            <Grid container>{isAuthFailed ? <Alert severity='error'>Authentication failed...</Alert> : <></>}</Grid>
          </Box>
        </Box>
      </Container>
    </ThemeProvider>
  );
};

type Props = {};

export default NewPassword;
