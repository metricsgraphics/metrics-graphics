import '../styles/globals.css'
import 'metrics-graphics/dist/mg.css'
import type { AppProps } from 'next/app'
import Link from 'next/link'
import NavLink from '../components/NavLink'
import Logo from '../components/Logo'

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <div>
      <header>
        <div className="container mx-auto py-4 flex items-center gap-6">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <Logo />
              <h1 className="text-lg font-bold">MetricsGraphics</h1>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <NavLink href="/line">Lines</NavLink>
            <NavLink href="/scatter">Scatterplots</NavLink>
            <NavLink href="/histogram">Histograms</NavLink>
            <NavLink href="/mg-api">API</NavLink>
          </div>
        </div>
      </header>
      <div className="container mx-auto py-12">
        <div className="prose max-w-none">
          <Component {...pageProps} />
        </div>
      </div>
    </div>
  )
}

export default MyApp
