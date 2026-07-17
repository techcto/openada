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
        <link rel="icon" href="/openada-app-icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/openada-app-icon.svg" />
        <meta name="theme-color" content="#b8e7d9" />
      </Head>
      <Component {...pageProps} />
    </>
  )
}
