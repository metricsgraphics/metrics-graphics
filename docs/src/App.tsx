import { Link, Route, Routes } from 'react-router-dom'
import { setCDN } from 'shiki'
import Logo from './components/Logo'
import NavLink from './components/NavLink'
import Histogram from './views/Histogram'
import Home from './views/Home'
import Lines from './views/Lines'
import Scatter from './views/Scatter'

setCDN('https://unpkg.com/shiki/')

const App: React.FC = () => (
  <div className="bg-gray-100 w-full min-h-screen">
    {/* navbar */}
    <header>
      <div className="container mx-auto py-4 flex items-center">
        <Link to="/">
          <div className="flex items-center mr-6">
            <Logo />
            <h1 className="ml-2">MetricsGraphics</h1>
          </div>
        </Link>
        <NavLink to="/line">Lines</NavLink>
        <NavLink to="/scatter">Scatterplots</NavLink>
        <NavLink to="/histogram">Histograms</NavLink>
      </div>
    </header>

    {/* content */}
    <div className="container mx-auto pt-6 pb-12">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/line" element={<Lines />} />
        <Route path="/scatter" element={<Scatter />} />
        <Route path="/histogram" element={<Histogram />} />
      </Routes>
    </div>
  </div>
)

export default App
