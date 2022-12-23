import Head from 'next/head';
import { Alert, Typography } from '@mui/material';
import { NextPage } from 'next';
import { PropsWithChildren } from 'react';
import useGreeting from '../hooks/use-greeting';
import Loading from '../components/loading';

const Greeting: NextPage = (props: PropsWithChildren<Props>) => {
  const { isLoading, isSuccess, isError, greetingMessage } = useGreeting();

  return (
    <>
      <Head>
        <title>Demo page</title>
        <meta name='description' content='Demo page' />
        <meta name='viewport' content='width=device-width, initial-scale=1' />
      </Head>
      <main>
        {isLoading ? (
          <Loading />
        ) : (
          <div>
            <Typography component={'div'} variant={'h6'}>
              Welcome to the demo page! {greetingMessage?.message}
            </Typography>
          </div>
        )}

        {isSuccess ? <Alert severity='success'>Succeeded to fetch greeting message from backend api!</Alert> : <></>}
        {isError ? <Alert severity='error'>Failed to fetch greeting message from backend api...</Alert> : <div></div>}
      </main>
    </>
  );
};

type Props = {};

export default Greeting;
