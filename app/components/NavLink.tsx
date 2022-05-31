import Link, { LinkProps } from 'next/link'
import { useRouter } from 'next/router'
import { PropsWithChildren } from 'react'
import cx from 'classnames'

const NavLink: React.FC<PropsWithChildren<LinkProps>> = ({ href, children, ...linkProps }) => {
  const router = useRouter()

  return (
    <Link href={href}>
      <a className={cx('rounded-full px-4 py-1', router.asPath === href && 'bg-gray-200')} {...linkProps}>
        {children}
      </a>
    </Link>
  )
}

export default NavLink
