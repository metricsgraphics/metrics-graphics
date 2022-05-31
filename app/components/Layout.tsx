import Head from 'next/head'
import { PropsWithChildren } from 'react'

interface LayoutProps {
  title: string
}

const Layout: React.FC<PropsWithChildren<LayoutProps>> = ({ title, children }) => (
  <>
    <Head>
      <title>{title}</title>
    </Head>
    {children}
  </>
)

export default Layout
