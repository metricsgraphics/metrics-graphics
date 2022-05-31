interface ParameterTableProps {
  props: Array<{
    name: string
    type: string
    default?: string
    description: string
  }>
}

const ParameterTable: React.FC<ParameterTableProps> = ({ props }) => (
  <table>
    <thead>
      <tr>
        <th>Name</th>
        <th>Type</th>
        <th>Default</th>
        <th>Description</th>
      </tr>
    </thead>
    <tbody>
      {props.map((p) => (
        <tr key={p.name}>
          <td>{p.name}</td>
          <td>
            <code>{p.type}</code>
          </td>
          <td>{p.default ? <code>{p.default}</code> : '-'}</td>
          <td>{p.description}</td>
        </tr>
      ))}
    </tbody>
  </table>
)

export default ParameterTable
