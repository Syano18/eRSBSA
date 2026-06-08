import '../styles/globals.css'
import Head from 'next/head'

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <link rel="icon" href="/City.png" />
        <title>eRSBSA</title>
      </Head>
      <Component {...pageProps} />
    </>
  )
}
