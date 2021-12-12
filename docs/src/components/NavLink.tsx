import { Link, LinkProps, useMatch, useResolvedPath } from 'react-router-dom'
import classnames from 'classnames'

const NavLink: React.FC<LinkProps> = ({ children, to, ...props }) => {
  const resolved = useResolvedPath(to)
  const match = useMatch({ path: resolved.pathname, end: true })

  return (
    <Link to={to} {...props}>
      <div className={classnames('rounded-full px-4 py-1', match && 'bg-gray-200')}>{children}</div>
    </Link>
  )
}

export default NavLink
