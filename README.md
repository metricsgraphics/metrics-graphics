<a href="http://metricsgraphicsjs.org/"><img src="http://metricsgraphicsjs.org/images/logo.svg" hspace="0" vspace="0" width="400" height="63"></a>

_MetricsGraphics.js_ is a library optimized for visualizing and laying out time-series data. At under 50KB (minified), it provides a simple way to produce common types of graphics in a principled, consistent and responsive way. The library currently supports line charts, scatterplots and histograms as well as features like rug plots and basic linear regression.

A sample set of examples may be found on [the examples page](http://metricsgraphicsjs.org). The example below demonstrates how easy it is to produce a graphic. Our graphics function provides a robust layer of indirection, allowing one to more efficiently build, say, a dashboard of interactive graphics, each of which may be pulling data from a different data source. For the complete list of options, and for download instructions, [take a look at the sections below](https://github.com/mozilla/metrics-graphics/wiki).

```
data_graphic({
    title: 'Downloads',
    description: 'This graphics shows Firefox GA downloads for the past six months.',
    data: downloads_data, \\ an array of objects, such as [{value:100,date:...},...]
    width: 600,
    height: 250,
    target: '#downloads', \\ the html element that the graphic is inserted in
    x_accessor: 'date',  \\ the key that accesses the x value
    y_accessor: 'value' \\ the key that accesses the y value
})
```

The API is simple. All that's needed to create a graphic is to specify a few default parameters and then, if desired, override one or more of the [optional parameters on offer](https://github.com/mozilla/metrics-graphics/wiki/List-of-Options). We don't maintain state. To update a graphic, one would call data_graphic on the same target element.

The library is data-source agnostic. While it provides a number of convenience functions and options that allow for graphics to better handle things like missing observations, it doesn't care where the data comes from.

While we are currently using semantic versioning, you should consider v0.* to have commits that will break things if you are external to Mozilla. This library is in its pre-Cambrian period of wild ideas, and parts of the API will slowly but surely become solidified as we use this more and more internally.

Though originally envisioned for Mozilla Metrics dashboard projects, we are making this repository public for other to use, knowing full well that we are far from having this project in good-enough shape. Take a look at the issues to see the milestones and other upcoming work on this repository. We plan on having fuller documentation in the next milestone, as well as a guide to how to contribute to the library in a way that makes us feel warm inside when we accept your pull request.

<a href="http://metricsgraphicsjs.org">http://metricsgraphicsjs.org</a>

## Quick-start guide
1. Download the latest release from [here](https://github.com/mozilla/metrics-graphics/releases).
2. Follow the examples in [index.htm](https://github.com/mozilla/metrics-graphics/blob/master/index.htm) and [main.js](https://github.com/mozilla/metrics-graphics/blob/master/js/main.js) to see how graphics are laid out and built. The examples use json data from [/data](https://github.com/mozilla/metrics-graphics/blob/master/data), though you may easily pull data from elsewhere.

## Dependencies
The library depends on [D3](http://d3js.org) for binding data to DOM elements, [Bootstrap](http://getbootstrap.com/) to facilitate layout and [jQuery](http://jquery.com/), which we're currently using to facilitate DOM manipulations.

## How to contribute
We're grateful for anyone wishing to contribute to the library. Feel free to fork the project and submit your changes as Pull Requests. If both of us r+ the Pull Request, we'll merge it into the master branch.

Changes should be made to the files under ``src`` rather than to ``js/metrics-graphics.js``. Please use ``dev.htm`` to test changes locally. At least once a release, we regenerate the raw and minified versions of ``js/metricsgraphics.js``.

## Resources
* [Examples](http://metricsgraphicsjs.org/examples.htm)
* [Interactive demo](http://metricsgraphicsjs.org/interactive-demo.htm)
* [List of options](https://github.com/mozilla/metrics-graphics/wiki/List-of-Options)
* [Chart types](https://github.com/mozilla/metrics-graphics/wiki/Chart-Types)
* [Building a button layout](https://github.com/mozilla/metrics-graphics/wiki/Button-Layout)

## Release process
1. Copy over any changes made in ``dev.htm`` to ``examples.htm``
2. Run ``make.py``
3. Commit newly generated ``js/metricsgraphics.js`` and ``js/metricsgraphics.min.js`` files and ``examples.htm`` (if applicable) with a message such as, “v0.5 prepared files for release”
4. Deploy all files to metricsgraphicsjs.org

_Note: The js file will be regenerated between releases any time we add a new chart type._

## Download package
The download package includes everything that you see on [metricsgraphicsjs.org](http://metricsgraphicsjs.org). In order to use the library in your own project, the only files that you'll need are:

1. js/metricsgraphics.min.js
2. css/metricsgraphics.css
3. images
  * missing-data.png
  * missing-data-dark.png

Remember to load the set of third-party libraries that are there in the examples pages. If your project uses Bootstrap, make sure you load MetricsGraphics.js after it.

## License

The __MetricsGraphics.js__ code is shared under the terms of the [Mozilla Public License v2.0](http://www.mozilla.org/MPL/2.0/). See the `LICENSE` file at the root of the repository. The current logo is courtesy of [Font Awesome](http://fortawesome.github.io/Font-Awesome/).
