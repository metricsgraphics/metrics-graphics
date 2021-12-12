import Categories from '../charts/scatter/Categories'
import Complex from '../charts/scatter/Complex'
import Simple from '../charts/scatter/Simple'

const Scatter: React.FC = () => {
  return (
    <div>
      <Simple />
      <Categories />
      <Complex />
    </div>
  )
}

export default Scatter
