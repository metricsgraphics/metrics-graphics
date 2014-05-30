<a href="mozilla.github.io/metrics-graphics/"><img src="http://mozilla.github.io/metrics-graphics/images/logo.svg?20140528" hspace="0" vspace="0" width="400" height="63"></a>

_MetricsGraphics.js_ is a library optimized for visualizing and laying out time-series data. At just 16KB in size, it provides a simple way to produce common types of charts in a principled, consistent and responsive way. The library currently supports a wide variety of line charts, with additional chart types in the works. 

A sample set of examples may be found on [the examples page](http://metricsgraphicsjs.org). The example below demonstrates how easy it is to produce a chart. Our stateless charting function provides a robust layer of indirection, allowing one to more efficiently build, say, a dashboard of interactive charts, each of which may be pulling data from a different data source. For the complete list of options, please [take a look at the wiki](https://github.com/mozilla/metrics-graphics/wiki).

```
moz_chart({
    title: "Downloads",
    description: "This chart shows Firefox GA downloads for the past six months."
    data: downloads_data, \\ an array of objects, such as [{value:100,date:...},...]
    width: 600,
    height: 250,
    target: '#downloads', \\ the html element in which the chart is populated
    x_accessor: 'date',  \\ the key that accesses the x value
    y_accessor: 'value', \\ the key that accesses the y value
})
```

While we are currently using semantic versioning, you should consider V0.* to have commits that will break things if you are external to Mozilla. This library is in its pre-Cambrian period of wild ideas, and parts of the API will slowly but surely become solidified as we use this more and more internally.

Though originally envisioned for Mozilla Metrics dashboard projects, we are making this repository public for other to use, knowing full well that we are far from having this project in good-enough shape. Take a look at the issues to see the milestones and other upcoming work on this repository. We plan on having fuller documentation in the next milestone, as well as a guide to how to contribute to the library in a way that makes us feel warm inside when we accept your pull request.

_MetricsGraphics.js_ is shared under a <a href="http://www.mozilla.org/MPL/2.0/">Mozilla Public license</a>.

http://metricsgraphicsjs.org
