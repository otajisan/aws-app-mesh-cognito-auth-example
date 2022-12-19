const Footer = (props: Props) => {
  return (
    <div>
      <footer className='bg-gray-900'>
        <p className='p-2 text-center text-xs text-white'>© 2022 {props.version}. Created by otajisan.</p>
      </footer>
    </div>
  );
};

type Props = {
  version: string;
};

export default Footer;
