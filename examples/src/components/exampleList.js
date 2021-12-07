import ExampleContainer from '../components/exampleContainer'

const ExampleList = ({ charts }) => (
  (<div className="container mx-auto mt-8">
    {charts.map(chart => (
      <ExampleContainer
        title={chart.title}
        description={chart.description}
        id={chart.id}
        legendId={chart.legendId}
        code={chart.code}
      />
    ))}
  </div>)
)

export default ExampleList
