const percent = new Intl.NumberFormat(undefined, {
  style: 'percent',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})

const compact = new Intl.NumberFormat(undefined, {
  notation: 'compact'
})

export const formatDate = (date: Date) => date.toISOString().substring(0, 10)

export const formatPercent = (number: number) => percent.format(number)

export const formatCompact = (number: number) => compact.format(number)
