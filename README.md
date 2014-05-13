metrics-graphics
================

A set of simple extensible graphs / primitives for various dashboards and monitors. Currently we support line charts, with multiple line support, with additional chart types in the works. Though originally envisioned for Mozilla Metrics dashboard projects, we are making this repository public for other use, knowing full well that we are far from having this project in good-enough shape.

The easiest set of examples is in main.js - this shows the examples that we currently support.

Take a look at the issues to see the milestones and other upcoming work on this repository. We plan on having fuller documentation in the next milestone, as well as a guide to how to contribute to the library in a way that makes us feel warm inside when we accept your pull request.

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