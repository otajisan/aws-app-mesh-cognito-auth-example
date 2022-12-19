import Head from 'next/head';
import { Typography } from '@mui/material';

export default function Home() {
  return (
    <>
      <Head>
        <title>Demo page</title>
        <meta name='description' content='Demo page' />
        <meta name='viewport' content='width=device-width, initial-scale=1' />
      </Head>
      <main>
        <div>
          <Typography component={'div'} variant={'h6'}>
            Welcome to Demo page!
          </Typography>
        </div>
      </main>
    </>
  );
}
