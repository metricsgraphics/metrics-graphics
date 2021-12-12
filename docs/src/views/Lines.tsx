import Active from '../charts/line/Active'
import Aggregated from '../charts/line/Aggregated'
import Baseline from '../charts/line/Baseline'
import Broken from '../charts/line/Broken'
import Confidence from '../charts/line/Confidence'
import Multi from '../charts/line/Multi'
import Simple from '../charts/line/Simple'

const Lines: React.FC = () => {
  return (
    <div>
      <Simple />
      <Confidence />
      <Multi />
      <Aggregated />
      <Broken />
      <Active />
      <Baseline />
    </div>
  )
}

export default Lines
