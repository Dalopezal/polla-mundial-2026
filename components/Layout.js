import Head from 'next/head';
import Navbar from './Navbar';

export default function Layout({ children, title = 'Polla Mundialista', description = 'Predice los marcadores del Mundial y compite con tus amigos' }) {
  return (
    <>
      <Head>
        <title>{title} | Polla Mundialista</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={`${title} | Polla Mundialista`} />
        <meta property="og:description" content={description} />
        <meta name="robots" content="index, follow" />
      </Head>
      <Navbar />
      <main>{children}</main>
    </>
  );
}
