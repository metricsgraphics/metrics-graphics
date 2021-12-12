import Aggregated from '../charts/line/Aggregated'
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
    </div>
  )
}

export default Lines
