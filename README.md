<a href="http://metricsgraphicsjs.org/"><img src="http://metricsgraphicsjs.org/images/logo.svg" hspace="0" vspace="0" width="400" height="63"></a>

_MetricsGraphics.js_ is a library optimized for visualizing and laying out time-series data. At under 60KB (minified), it provides a simple way to produce common types of graphics in a principled and consistent way. The library currently supports line charts, scatterplots, histograms, bar charts and data tables, as well as features like rug plots and basic linear regression.

A sample set of examples may be found on [the examples page](http://metricsgraphicsjs.org). The example below demonstrates how easy it is to produce a graphic. Our graphics function provides a robust layer of indirection, allowing one to more efficiently build, say, a dashboard of interactive graphics, each of which may be pulling data from a different data source. For the complete list of options, and for download instructions, [take a look at the sections below](https://github.com/mozilla/metrics-graphics/wiki).

```
MG.data_graphic({
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

The API is simple. All that's needed to create a graphic is to specify a few default parameters and then, if desired, override one or more of the [optional parameters on offer](https://github.com/mozilla/metrics-graphics/wiki/List-of-Options). We don't maintain state. In order to update a graphic, one would call _MG.data_graphic_ on the same target element.

The library is data-source agnostic. While it provides a number of convenience functions and options that allow for graphics to better handle things like missing observations, it doesn't care where the data comes from.

Though originally envisioned for Mozilla Metrics dashboard projects, we are making this repository public for other to use, knowing full well that we are far from having this project in good-enough shape. Take a look at the issues to see the milestones and other upcoming work on this repository. We are currently using semantic versioning.

<a href="http://metricsgraphicsjs.org">http://metricsgraphicsjs.org</a>

## Important changes in v2.0
1. The library is now namespaced. ``data_graphic`` is now ``MG.data_graphic`` and ``convert_dates`` is now ``MG.convert.date``. A new function called ``MG.convert.number`` is now available.
2. The ``rollover_callback`` option has been renamed ``mouseover`` and expanded in order to make it more consistent with other libraries. We now have three callback functions available: [mouseover](https://github.com/mozilla/metrics-graphics/wiki/Graphic#mouseover), [mouseout](https://github.com/mozilla/metrics-graphics/wiki/Graphic#mouseout) and [mousemove](https://github.com/mozilla/metrics-graphics/wiki/Graphic#mousemove).
3. CSS rules have been prefixed and in some cases updated for consistency. ``active_datapoint`` for instance is now ``mg-active-datapoint``.

## Quick-start guide
1. Download the [latest release](https://github.com/mozilla/metrics-graphics/releases).
2. Follow the examples [here](https://github.com/mozilla/metrics-graphics/blob/master/examples/index.htm) and [here](https://github.com/mozilla/metrics-graphics/blob/master/examples/js/main.js) to see how graphics are laid out and built. The examples use json data from [examples/data](https://github.com/mozilla/metrics-graphics/blob/master/examples/data), though you may easily pull data from elsewhere.

## Dependencies
The library depends on [D3](http://d3js.org) and [jQuery](http://jquery.com/).

## Contributing
If you would like to help extend MetricsGraphics.js or fix bugs, please [fork the library](https://github.com/mozilla/metrics-graphics) and install [Node.js](http://nodejs.org). Then, from the project's root directory install [gulp](http://gulpjs.com):

    install gulp

Then, install the library's dependencies:

    npm install

To build the library from source, type:

    gulp build:js

To run tests, type:

    gulp test

## Resources
* [Examples](http://metricsgraphicsjs.org/examples.htm)
* [Interactive demo](http://metricsgraphicsjs.org/interactive-demo.htm)
* [List of options](https://github.com/mozilla/metrics-graphics/wiki/List-of-Options)
* [Chart types](https://github.com/mozilla/metrics-graphics/wiki/Chart-Types)
* [Building a button layout](https://github.com/mozilla/metrics-graphics/wiki/Button-Layout)

## Download package
The download package includes everything that you see on [metricsgraphicsjs.org](http://metricsgraphicsjs.org). In order to use the library in your own project, the only files that you'll need are the ones under ``dist``. Remember to load the set of third-party libraries that are there in the examples pages. If your project uses Bootstrap, make sure you load MetricsGraphics.js after it.

## Frequently asked question
__What does MetricsGraphics.js do that library x doesn't do?__

If library x works for you, you should keep using it. We're not aiming to be competitive with libraries that already exist. We're aiming to make a library that meets our needs. We also happen to think that the world _needs_ a principled data presentation library, and that many of our needs are the same as other folks'.

## License

The __MetricsGraphics.js__ code is shared under the terms of the [Mozilla Public License v2.0](http://www.mozilla.org/MPL/2.0/). See the `LICENSE` file at the root of the repository. The current logo is courtesy of [Font Awesome](http://fortawesome.github.io/Font-Awesome/).
