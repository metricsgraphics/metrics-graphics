import { MutableRefObject, useEffect, useRef, useState } from 'react'
import { getHighlighter } from 'shiki'

interface ContainerProps {
  title: string
  description: string
  chartRenderer: (chartRef: MutableRefObject<null>) => unknown
  code: string
}

const Container: React.FC<ContainerProps> = ({ title, description, chartRenderer, code }) => {
  const chartRef = useRef(null)
  const [rendered, setRendered] = useState<string>()

  // render code
  useEffect(() => {
    getHighlighter({ theme: 'one-dark-pro', langs: ['js'] }).then((highlighter) =>
      setRendered(highlighter.codeToHtml(code, { lang: 'js' }))
    )
  })

  // render chart
  useEffect(() => {
    // if react is still rendering, wait
    if (!chartRef.current) return

    // call render function with ref
    chartRenderer(chartRef.current)
  })

  return (
    <div className="flex gap-16 mb-8">
      <div className="flex-1">
        <p className="text-lg font-bold">{title}</p>
        <p className="text-sm text-gray-600 mb-8">{description}</p>
        <div ref={chartRef} />
      </div>
      <div className="flex-1">
        {rendered && (
          <div
            className="rounded-lg overflow-hidden text-xs"
            dangerouslySetInnerHTML={{ __html: rendered }}
          />
        )}
      </div>
    </div>
  )
}

export default Container
