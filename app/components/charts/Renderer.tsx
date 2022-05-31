import { MutableRefObject, PropsWithChildren, useEffect, useRef } from 'react'

interface RendererProps {
  chartRenderer: (chartRef: MutableRefObject<null>) => unknown
}

const Renderer: React.FC<PropsWithChildren<RendererProps>> = ({ chartRenderer, children }) => {
  const chartRef = useRef(null)

  // render chart
  useEffect(() => {
    // if react is still rendering, wait
    if (!chartRef.current) return

    // call render function with ref
    chartRenderer(chartRef.current)
  })

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-4">
      <div ref={chartRef} />
      <div>{children}</div>
    </div>
  )
}

export default Renderer
