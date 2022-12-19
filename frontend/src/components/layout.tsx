import { ReactNode } from 'react';
import Header from './header';
import Footer from './footer';

const Layout = ({ children }: Props) => {
  return (
    <div className='flex flex-col min-h-screen'>
      <Header />
      <main className='flex-grow'>{children}</main>
      <Footer version='0.0.1' />
    </div>
  );
};

type Props = {
  children?: ReactNode;
};

export default Layout;
