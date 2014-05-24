<a href="mozilla.github.io/metrics-graphics/"><img src="http://metrics.mozilla.com/metrics-graphics/images/logo.png?20140523b" hspace="0" vspace="0"></a>

Note: While we are currently using semantic versioning, you should consider V0.* to have commits that will break things if you are external to Mozilla. This library is in its pre-Cambrian period of wild ideas, and parts of the API will slowly but surely become solidified as we use this more and more internally.

A set of simple extensible graphs / primitives for various dashboards and monitors. Currently we support line charts, with multiple line support, with additional chart types in the works. Though originally envisioned for Mozilla Metrics dashboard projects, we are making this repository public for other use, knowing full well that we are far from having this project in good-enough shape.

The easiest set of examples is in main.js - this shows the examples that we currently support.

Take a look at the issues to see the milestones and other upcoming work on this repository. We plan on having fuller documentation in the next milestone, as well as a guide to how to contribute to the library in a way that makes us feel warm inside when we accept your pull request.

You can check out the demo page [here](https://metrics.mozilla.com/metrics-graphics/).

Here is one example, with comments annotating the arguments

```
moz_chart({
    title: "Fake Users", \\ this title gets added as a html header element
    description: "Here is a description", \\ this gets added as a rollover
    data: data, \\ this is an array of objects, such as [{value:100,date:...},...]
    width: 600,
    height: 250,
    target: '#fake_users1', \\ this is the html element the svg will be placed in
    x_accessor: 'date',  \\ this is the key that accesses the x value
    y_accessor: 'value', \\ this is the key that accesses the y value
})
```
