import { Link } from 'preact-router/match'
import Logo from './logo'
import ExternalLink from '../externalLink'

const Header = () => (
  <header class="bg-gray-200 px-4 py-2">
    <div class="flex justify-between">
      <nav class="flex items-center flex-grow">
        <Logo />
        <h1 class="mr-8">MetricsGraphics</h1>
        <Link activeClassName="link-active" href="/">Home</Link>
        <Link activeClassName="link-active" href="/profile">Lines</Link>
        <Link activeClassName="link-active" href="/profile/john">Axes</Link>
      </nav>
      <ExternalLink text="GitHub" link="https://github.com/jens-ox/metrics-graphics" />
    </div>
  </header>
)

export default Header
