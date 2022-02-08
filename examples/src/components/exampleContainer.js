const ExampleContainer = ({ title, description, code, id, legendId }) => (
  <div className="container mx-auto mt-8">
    <div className="example-container">
      <div>
        <p>{title}</p>
        <small>{description}</small>
        <div id={id} />
        {legendId && (
          <p className="text-center" id={legendId} />
        )}
      </div>
      <div>
        <code><pre>{code}</pre></code>
      </div>
    </div>
  </div>
)

export default ExampleContainer
