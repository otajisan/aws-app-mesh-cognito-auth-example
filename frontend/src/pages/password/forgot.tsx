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

const ForgotPassword: NextPage = (props: PropsWithChildren<Props>) => {
  const auth = useAuth();
  const [username, setUsername] = useState('');
  const [isAuthFailed, setAuthFailed] = useState(false);

  const forgotPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const result = await auth.forgotPassword(username);
    if (result.success) {
      await Router.push('/password/forgot-submit');
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
          <Box component='form' onSubmit={forgotPassword} noValidate sx={{ mt: 1 }}>
            <TextField
              margin='normal'
              required
              fullWidth
              id='email'
              label='Email Address'
              name='email'
              autoComplete='email'
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <Button type='submit' fullWidth variant='outlined' sx={{ mt: 3, mb: 2 }}>
              Change password
            </Button>
            <Grid container>{isAuthFailed ? <Alert severity='error'>Failed to reset password...</Alert> : <></>}</Grid>
          </Box>
        </Box>
      </Container>
    </ThemeProvider>
  );
};

type Props = {};

export default ForgotPassword;
