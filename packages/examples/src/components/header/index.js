import { Link } from 'preact-router/match'
import Logo from './logo'
import ExternalLink from '../externalLink'

const Header = () => (
  <header class="bg-gray-200 px-4 py-2">
    <div class="flex justify-between">
      <nav class="flex items-center flex-grow">
        <Link class="flex items-center" href="/">
          <Logo />
          <h1 class="pl-4 pr-8">MetricsGraphics</h1>
        </Link>
        <Link activeClassName="link-active" href="/">Home</Link>
        <Link activeClassName="link-active" href="/lines">Lines</Link>
        <Link activeClassName="link-active" href="/scatter">Scatterplots</Link>
        <Link activeClassName="link-active" href="/histogram">Histograms</Link>
      </nav>
      <ExternalLink text="GitHub" link="https://github.com/metricsgraphics/metrics-graphics" />
    </div>
  </header>
)

export default Header
