<a href="http://metricsgraphicsjs.org/"><img src="http://metricsgraphicsjs.org/images/logo.svg" hspace="0" vspace="0" width="400" height="63"></a>

![BundlePhobia](https://badgen.net/bundlephobia/minzip/mg2)

*MetricsGraphics* is a library built for visualizing and laying out time-series data. At around 15kB (gzipped), it provides a simple way to produce common types of graphics in a principled and consistent way. The library currently supports line charts, scatterplots and histograms, as well as features like rug plots.

## Example

All you need to do is add an entry node to your document:

```html
<div id="chart"></div>
```

Then, use the id to mount the chart:

```js
import LineChart from 'mg2'

new LineChart({
  data, // some array of data objects
  width: 600,
  height: 200,
  target: '#chart',
  area: true,
  xAccessor: 'date',
  yAccessor: 'value'
})
```

That's it!

## Documentation

The documentation will be linked here.
