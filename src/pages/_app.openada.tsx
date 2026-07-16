import type { AppProps } from 'next/app'
import Head from 'next/head'
import '../sass/app.scss'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>OpenADA</title>
        <meta name="description" content="ADA accessibility and language quality checks as a web service." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Component {...pageProps} />
    </>
  )
}
