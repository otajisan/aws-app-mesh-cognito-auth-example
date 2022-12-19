import '../../styles/globals.css';
import type { AppProps } from 'next/app';
import { ProvideAuth } from '../hooks/use-auth';
import Layout from '../components/layout';

const App = ({ Component, pageProps }: AppProps) => {
  return (
    <ProvideAuth>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </ProvideAuth>
  );
};

export default App;
