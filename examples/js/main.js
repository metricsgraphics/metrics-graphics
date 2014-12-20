$(document).ready(function() {
    'use strict';
    //json data that we intend to update later on via on-screen controls
    var split_by_data;

    var torso = {};
    torso.width = 375;
    torso.height = 200;
    torso.right = 20;

    var trunk = {};
    trunk.width = 320;
    trunk.height = 150;
    trunk.left = 35;
    trunk.right = 10;
    trunk.xax_count = 5;

    var small = {};
    small.width = 240;
    small.height = 140;
    small.left = 20;
    small.right = 20;
    small.top = 20;
    small.xax_count = 5;

    assignEventListeners();

    //few observations
    d3.json('data/missing-y.json', function(data) {
        data = MG.convert.date(data, 'date');
        //add a line chart that has a few observations
        MG.data_graphic({
            title: "Few Observations",
            description: "We sometimes have only a few observations. By setting <i>missing_is_zero: true</i>, missing values for a time-series will be interpreted as zeros. In this example, we've overridden the rollover callback to show 'no date' for missing observations and have set the <i>min_x</i> and <i>max_x</i> options in order to expand the date range.",
            data: data,
            interpolate: 'basic',
            missing_is_zero: true,
            width: torso.width,
            height: torso.height,
            right: torso.right,
            min_x: new Date('2014-01-01'),
            max_x: new Date('2014-06-01'),
            target: '#missing-y',
            x_accessor: 'date',
            y_accessor: 'value',
            mouseover: function(d, i) {
                var df = d3.time.format('%b %d, %Y');
                var date = df(d['date']);
                var y_val = (d.value == 0) ? 'no data' : d.value;

                $('#missing-y svg .mg-active-datapoint')
                    .text(date +  '   ' + y_val);
            }
        })
    });

    d3.json('data/small-range.json', function(data) {
        data = MG.convert.date(data, 'date');

        //small range
        MG.data_graphic({
            title: "Small Range of Integers",
            description: "When we have a data object of integers and a small range of values, the auto-generated set of y-axis ticks are filtered so that we don't include fractional values.",
            data: data,
            interpolate: 'basic',
            width: torso.width,
            height: torso.height,
            right: torso.right,
            target: '#small-range',
            x_accessor: 'date',
            y_accessor: 'value'
        })
    });

    d3.json('data/fake_users1.json', function(data) {
        data = MG.convert.date(data, 'date');

        var fake_baselines = [{value:160000000, label:'a baseline'}]

        //add a line chart
        MG.data_graphic({
            title: "Line Chart",
            description: "This is a simple line chart. You can remove the area portion by adding <i>area: false</i> to the arguments list.",
            data: data,
            width: torso.width,
            height: torso.height,
            right: torso.right,
            baselines: fake_baselines,
            target: '#fake_users1',
            x_accessor: 'date',
            y_accessor: 'value'
        })

        MG.data_graphic({
            title: "No X Axis",
            description: "Here is an example hiding the x axis.",
            data: data,
            decimals: 0,
            width: trunk.width,
            height: trunk.height,
            right: trunk.right,
            xax_count: 4,
            y_rug: true,
            target: '#hidden1',
            x_accessor: 'date',
            y_accessor: 'value',
            area: false,
            x_axis: false,
            small_text: true
        })

        var markers = [{
            'date': new Date('2014-03-17T00:00:00.000Z'),
            'label': 'Look, a spike!'
        }];

        //add a chart with annotations
        MG.data_graphic({
            title: "Annotations",
            description: "By setting the graphic's target a class name of main-area-solid, markers don't extend down to the bottom of the graphic, which better draws attention to, say, spikes.",
            data: data,
            width: torso.width,
            height: torso.height,
            right: torso.right,
            markers: markers,
            target: '#spike',
            x_accessor: 'date',
            y_accessor: 'value'
        });

        MG.data_graphic({
            title: "Another Least Squares Example",
            description: "Least squares effortlessly works with dates or times on axes.",
            data: data,
            chart_type: 'point',
            width: trunk.width,
            height: trunk.height*1.5,
            left: 60,
            right: trunk.right,
            least_squares: true,
            target: '#sls-time-series',
            x_accessor: 'date',
            y_accessor: 'value'
        });
    })

    d3.json('data/fake_users2.json', function(data) {
        for(var i=0;i<data.length;i++) {
            data[i] = MG.convert.date(data[i], 'date');
        }

        //add a multi-line chart
        MG.data_graphic({
            title:"Multi-Line Chart",
            description: "This line chart contains multiple lines.",
            data: data,
            width: torso.width,
            height: torso.height,
            right: torso.right,
            target: '#fake_users2',
            x_accessor: 'date',
            y_accessor: 'value'
        })

        //add a wide multi-line chart
        MG.data_graphic({
            title:"Multi-Line Chart Wide",
            description: "This line chart contains multiple lines and has extended ticks enabled.",
            area: false,
            legend: ['Line 1','Line 2','Line 3'],
            legend_target: '.legend',
            data: data,
            width: torso.width*2,
            height: torso.height,
            right: trunk.right,
            show_years: false,
            xax_tick: 0,
            y_extended_ticks: true,
            target: '#fake_users3',
            x_accessor: 'date',
            y_accessor: 'value'
        })

        //linked multi-line charts
        MG.data_graphic({
            title:"Multi-Line Linked",
            description: "Demoing linked multi-line charts.",
            data: data,
            width: torso.width,
            height: torso.height,
            right: torso.right,
            target: '#linked_multi1',
            linked: true,
            x_accessor: 'date',
            y_accessor: 'value'
        });

        // missing data in one of a multi-line chart.
        var all_the_data = MG.clone(data[0]);
        for (var i = 1; i < data.length; i ++){
            for (var j=0; j < data[i].length; j++){
                if (i==2 && all_the_data[j]['date'] < new Date('2014-02-01')){
                    // pass
                } else if (i==1 && all_the_data[j]['date'] > new Date('2014-03-22')) {
                    // pass
                } else {
                    all_the_data[j]['value'+(i+1)] = data[i][j].value;

                }
            }
        }
        MG.data_graphic({
            title:"Handling Different Sized Lines in a Single Array",
            description: "How do you handle data with multiple implied time series lengths?",
            data: all_the_data,
            width: torso.width*2,
            height: torso.height,
            right: torso.right,
            target: '#missing1',
            linked: true,
            y_extended_ticks: true,
            x_accessor: 'date',
            y_accessor: ['value', 'value2', 'value3']
        });
    })

    d3.json('data/fake_users3.json', function(data) {
        for(var i=0;i<data.length;i++) {
            data[i] = MG.convert.date(data[i], 'date');
        }

        //linked multi-line charts
        MG.data_graphic({
            title:"Multi-Line Linked 2",
            description: "Demoing linked multi-line charts.",
            data: data,
            width: torso.width,
            height: torso.height,
            right: torso.right,
            target: '#linked_multi2',
            linked: true,
            x_accessor: 'date',
            y_accessor: 'value'
        })
    })

    d3.json('data/confidence_band.json', function(data) {
        data = MG.convert.date(data, 'date');
        MG.data_graphic({
            title: "Confidence Band",
            description: "This is an example of a graphic with a confidence band and extended x-axis ticks enabled.",
            data: data,
            format: 'percentage',
            width: torso.width*2,
            height: torso.height,
            right: trunk.right,
            target: '#confidence_band',
            show_years: false,
            show_confidence_band: ['l', 'u'],
            x_extended_ticks: true,
            min_y: 0,
            max_y: 1,
            x_accessor: 'date',
            y_accessor: 'value'
        })
    })

    d3.json('data/log.json', function(data){
        data = [data];
        for(var i=0;i<data.length;i++) {
            data[i] = MG.convert.date(data[i], 'date');
        };

        //add a chart that has a log scale
        MG.data_graphic({
            title: "Log Scale",
            description: "This is a simple line chart. You can remove the area portion by adding <i>area: false</i> to the arguments list.",
            data: data,
            y_scale_type:'log',
            width: torso.width*2,
            height: torso.height,
            right: torso.right,
            target: '#log1',
            x_accessor: 'date',
            y_accessor: 'value'
        })
    })

    d3.json('data/some_percentage.json', function(data) {
        for(var i=0;i<data.length;i++) {
            data[i] = MG.convert.date(data[i], 'date');
        }

        var markers = [{
            'date': new Date('2014-02-01T00:00:00.000Z'),
            'label': '1st Milestone'
        }, {
            'date': new Date('2014-03-15T00:00:00.000Z'),
            'label': '2nd Milestone'
        }]

        MG.data_graphic({
            title: "Some Percentages",
            description: "Here is an example that shows percentages.",
            data: data,
            width: torso.width,
            height: torso.height,
            right: torso.right,
            markers: markers,
            format: 'percentage',
            target: '#percentage',
            x_accessor: 'date',
            y_accessor: 'value'
        })

        MG.data_graphic({
            title: "Changing Precision 2",
            description: "Here we set <i>decimals: 0</i> for percentages.",
            data: data,
            decimals: 0,
            format: 'Percentage',
            width: trunk.width,
            height: trunk.height,
            right: trunk.right,
            xax_count: 4,
            target: '#precision2',
            x_accessor: 'date',
            y_accessor: 'value'
        })

        MG.data_graphic({
            title: "... Or No Rollover Text",
            description: "By setting <i>show_rollover_text: false</i>, you can hide the default rollover text from even appearing. This, coupled with the custom callback, gives a lot of interesting options for controlling rollovers.",
            data: data,
            decimals: 0,
            show_rollover_text: false,
            format: 'Percentage',
            width: trunk.width,
            height: trunk.height,
            right: trunk.right,
            xax_count: 4,
            target: '#no-rollover-text',
            x_accessor: 'date',
            y_accessor: 'value'
        })
    })

    d3.json('data/some_currency.json', function(data) {
        data = MG.convert.date(data, 'date');
        MG.data_graphic({
            title: "Some Currency",
            description: "Here is an example that uses custom units for currency.",
            data: data,
            width: torso.width,
            height: torso.height,
            right: torso.right,
            target: '#currency',
            x_accessor: 'date',
            yax_units: '$',
            y_accessor: 'value'
        })
    })

    d3.json('data/xnotdate.json', function(data) {
        MG.data_graphic({
            left: 80,
            bottom: 50,
            title: "X-Axis Not Time, Animated",
            description: "A graphic where we're not plotting dates on the x-axis and where the axes include labels and the line animates on load.",
            data: data,
            animate_on_load: true,
            area: false,
            width: torso.width,
            height: torso.height,
            right: trunk.right,
            target: '#xnotdate',
            x_accessor: 'males',
            y_accessor: 'females',
            x_label: 'males',
            y_label: 'females',
        })
    })

    MG.data_graphic({
        title: "Glorious Graphic",
        error: 'This data is blocked by Lorem Ipsum. Get your stuff together, Ipsum.',
        chart_type: 'missing-data',
        missing_text: 'This is an example of a missing chart',
        description: "This is an example of a graphic whose data is currently missing. We've also set the <i>error</i> option, which appends an error icon to the title and logs an error to the browser's console.",
        target: '#glorious_chart',
        width: torso.width,
        height: torso.height
    })

    // lower section
    d3.json('data/brief-1.json', function(data) {
        data = MG.convert.date(data, 'date');

        MG.data_graphic({
            title: "Linked Graphic",
            description: "The two graphics in this section are linked together. A rollover in one causes a rollover in the other.",
            data: data,
            width: trunk.width,
            linked: true,
            height: trunk.height,
            right: trunk.right,
            xax_count: 4,
            target: '#briefing-1',
            x_accessor: 'date',
            y_accessor: 'value'
        })

        MG.data_graphic({
            title: "Small Text Inferred By Size",
            description: "If <i>args.width - args.left - args.right</i> is smaller than <i>args.small_width_threshold</i> (and the flip for the height) then the text size automatically scales to be slightly smaller.",
            data: data,
            width: small.width,
            height: small.height,
            right: small.right,
            top: small.top,
            xax_count: 4,
            target: '#small1',
            x_accessor: 'date',
            y_accessor: 'value'
        });

        MG.data_graphic({
            title: "No Y Axis",
            description: "Here is an example hiding the y axis.",
            data: data,
            decimals: 0,
            width: trunk.width,
            height: trunk.height,
            right: trunk.right,
            xax_count: 4,
            target: '#hidden2',
            x_accessor: 'date',
            area: false,
            y_accessor: 'value',
            small_text: true,
            y_axis: false
        })
    })

    d3.json('data/split_by.json', function(data) {
        data = MG.convert.date(data, 'date');

        split_by_data = MG.data_graphic({
            title: "Downloads by Channel",
            description: "The graphic is gracefully updated depending on the selected channel.",
            data: data,
            width: torso.width*2,
            height: trunk.height,
            right: trunk.right,
            xax_count: 4,
            target: '#split_by',
            x_accessor: 'date',
            y_accessor: 'release'
        })

        MG.data_graphic({
            title: "Beta Downloads",
            description: "The graphic is gracefully updated depending on the chosen time period.",
            data: data,
            width: torso.width*2,
            height: trunk.height,
            right: trunk.right,
            show_years: false,
            xax_count: 4,
            target: '#modify_time_period',
            x_accessor: 'date',
            y_accessor: 'beta'
        })
    })

    d3.json('data/brief-2.json', function(data) {
        data = MG.convert.date(data, 'date');

        MG.data_graphic({
            title: "Other Linked Graphic",
            description: "Roll over and watch as the graphic to the left triggers.",
            data: data,
            area: false,
            linked: true,
            width: trunk.width,
            height: trunk.height,
            right: trunk.right,
            xax_count: 4,
            target: '#briefing-2',
            x_accessor: 'date',
            y_accessor: 'value'
        })

        MG.data_graphic({
            title: "Small Text",
            description: "By adding small_text:true to the args list, we can force the use of smaller axis text regardless of the width or height",
            data: data,
            width: trunk.width,
            height: trunk.height,
            right: trunk.right,
            small_text: true,
            xax_count: 4,
            target: '#small2',
            x_accessor: 'date',
            y_accessor: 'value'
        })
    })

    d3.json('data/float.json', function(data) {
        data = MG.convert.date(data, 'date');

        MG.data_graphic({
            title: "Changing Precision 1",
            description: "Here we set <i>decimals: 3</i> to get three decimals in the rollover for percentages.",
            data: data,
            decimals: 3,
            width: trunk.width,
            height: trunk.height,
            right: trunk.right,
            xax_count: 4,
            target: '#precision1',
            x_accessor: 'date',
            y_accessor: 'value'
        })

        MG.data_graphic({
            title: "Custom Rollover Text",
            description: "Here is an example of changing the rollover text. You could in theory actually update any DOM element with the data from that rollover - a title, for instance.",
            data: data,
            width: trunk.width,
            height: trunk.height,
            right: trunk.right,
            xax_count: 4,
            mouseover: function(d, i) {
                //custom format the rollover text, show days
                var prefix = d3.formatPrefix(d.value);
                $('#custom-rollover svg .mg-active-datapoint')
                    .text('Day ' + (i+1) + '   '
                         + prefix.scale(d.value).toFixed(2) + prefix.symbol);
            },
            target: '#custom-rollover',
            x_accessor: 'date',
            y_accessor: 'value'
        })
    })

    d3.json('data/neg1.json', function(data) {
        data = MG.convert.date(data, 'date');

        MG.data_graphic({
            title: "Negative Values 1",
            description: "Currently defaults to having no area by default.",
            data: data,
            width: trunk.width,
            height: trunk.height,
            right: trunk.right,
            target: '#neg1',
            x_accessor: 'date',
            y_accessor: 'value'
        });

        var data2 = MG.clone(data).map(function(d) {
            d.value = d.value + 550;
            return d;
        });

        MG.data_graphic({
            title: "Y-Axis Not Zero",
            description: "We should have an option for letting the y-axis be some natural value other than 0, set by the data rather than the user.",
            data: data2,
            width: trunk.width,
            height: trunk.height,
            right: trunk.right,
            min_y_from_data: true,
            yax_units: '$',
            target: '#y-axis-not-zero',
            x_accessor: 'date',
            y_accessor: 'value'
        })
    })

    d3.json('data/neg2.json', function(data) {
        MG.data_graphic({
            title: "Negative Values 2",
            description: "Check for same with two numbers instead of date.",
            data: data,
            width: trunk.width,
            height: trunk.height,
            right: trunk.right,
            xax_format: function(f) {
                var pf = d3.formatPrefix(f);
                return pf.scale(f) + pf.symbol;
            },
            target: '#neg2',
            x_accessor: 'subject',
            y_accessor: 'measure'
        })
    })

    //add histograms
    //generate a Bates distribution of 10 random variables
    var values = d3.range(10000).map(d3.random.bates(10));

    MG.data_graphic({
        title: "Histogram 1",
        description: "Raw data values being fed in. Here, we specify the number of bins to be 50 and have bar margins set to 0.",
        data: values,
        chart_type: 'histogram',
        width: trunk.width,
        height: trunk.height,
        right: trunk.right,
        bins: 50,
        bar_margin: 0,
        target: '#histogram1',
        y_extended_ticks: true,
        mouseover: function(d, i) {
            $('#histogram1 svg .mg-active-datapoint')
                .text('Value: ' + d3.round(d.x,2) +  '   Count: ' + d.y);
        }
    })

    d3.csv('data/ufo_dates.csv', function(ufos){
        var data = ufos.map(function(d){
            return parseInt(d['value'])/30;
        });
        data.sort();
        var p75 = data[Math.floor(data.length*3/4)];
        MG.data_graphic({
            title: "Difference in UFO Sighting and Reporting Dates (in months)",
            description: "Semi-real data about the reported differences between the supposed sighting of a UFO, and the date it was reported. I inflated the low values and inflated the high ones to make the histogram a little more pleasing for the demo. The data set comes from some random UFO sightings csv I had on my computer.",
            data: data,
            markers:[{'label':'75% of reports come <' + d3.round(p75/12) +' years after the initial sighting', 'value':p75}],
            chart_type: 'histogram',
            width: trunk.width*2,
            height: trunk.height*1.5,
            right: trunk.right,
            bar_margin: 0,
            bins:150,
            target: '#ufos',
            y_extended_ticks: true,
            mouseover: function(d, i) {
                var string;
                if (d.x < 12) {
                    string = d3.round(d.x,2) + ' Months';
                } else {
                    string = d3.round(d.x,2) + ' Months';
                }
                $('#ufos svg .mg-active-datapoint')
                    .text(string +   '       Volume: ' + d.y);
            }
        })
    })

    var second = d3.range(10000).map(function(d){return Math.random()*10});
    second = d3.layout.histogram()(second)
        .map(function(d){
            return {'count': d.y, 'value':d.x};
    });

    MG.data_graphic({
        title: "Histogram 2",
        description: "Already binned data being fed in.",
        data: second,
        binned: true,
        chart_type: 'histogram',
        width: trunk.width,
        height: trunk.height,
        right: trunk.right,
        target: '#histogram2',
        y_extended_ticks: true,
        x_accessor:'value',
        y_accessor:'count',
        mouseover: function(d, i) {
            $('#histogram2 svg .mg-active-datapoint')
                .text('Value: ' + d3.round(d.x,2) +  '   Count: ' + d.y);
        }
    })

    var third = d3.range(1000).map(d3.random.bates(10));
    third = third.map(function(d,i){ return {'val1': d, 'val2': i} });

    MG.data_graphic({
        title: "Histogram 3",
        description: "Unbinned, but in same format as other line chart data.",
        data: third,
        chart_type: 'histogram',
        width: trunk.width,
        height: trunk.height,
        right: trunk.right,
        target: '#histogram3',
        y_extended_ticks: true,
        x_accessor:'val1',
        mouseover: function(d, i) {
            $('#histogram3 svg .mg-active-datapoint')
                .text('Value: ' + d3.round(d.x,2) +  '   Count: ' + d.y);
        }
    })

    // check for negative values, for sanity.
    var fourth = d3.range(1000).map(d3.random.bates(10));
    fourth = fourth.map(function(d,i){return d-.5});

    MG.data_graphic({
        title: "Histogram 4",
        description: "Sanity-checking negative data.",
        data: fourth,
        chart_type: 'histogram',
        width: trunk.width,
        height: trunk.height,
        right: trunk.right,
        target: '#histogram4',
        y_extended_ticks: true,
        x_accessor:'val1',
        mouseover: function(d, i) {
            $('#histogram4 svg .mg-active-datapoint')
                .text('Value: ' + d3.round(d.x,2) +  '   Count: ' + d.y);
        }
    })

    var bar_data = [
        {'label': 'first', 'value':4, 'baseline':4.2, 'prediction': 2},
        {'label': 'second', 'value':2.1, 'baseline':3.1, 'prediction': 3},
        {'label': 'third', 'value':6.3, 'baseline':6.3, 'prediction': 4},
        {'label': 'fourth', 'value':5.7, 'baseline':3.2, 'prediction': 5},
        {'label': 'fifth', 'value':5, 'baseline':4.2, 'prediction': 3},
        {'label': 'sixth', 'value':4.2, 'baseline':10.2, 'prediction': 3},
        {'label': 'yet another', 'value':4.2, 'baseline':10.2, 'prediction': 3},
        {'label': 'and again', 'value':4.2, 'baseline':10.2, 'prediction': 3},
        {'label': 'and sss', 'value':4.2, 'baseline':10.2, 'prediction': 3}
    ]

    MG.data_graphic({
        title:'Bar Prototype',
        description:'work in progress',
        data: bar_data,
        x_accessor: 'value',
        y_accessor: 'label',
        baseline_accessor:'baseline',
        predictor_accessor:'prediction',
        chart_type: 'bar',
        width:trunk.width,
        right:trunk.right,
        target: '#bar1',
        x_axis: false
    })

    MG.data_graphic({
        title:'No Axis',
        description:'work in progress',
        data: bar_data,
        chart_type: 'bar',
        x_accessor: 'value',
        y_accessor: 'label',
        width:trunk.width,
        height:trunk.height,
        right:trunk.right,
        target: '#bar2',
    })

    d3.json('data/points1.json', function(data) {
        MG.data_graphic({
            title: "Simple Scatterplot",
            description: "This is an example of a simple scatterplot, in which we have enabled rug plots on the y-axis by setting the <i>y_rug</i> option to true.",
            data: data,
            chart_type: 'point',
            width: trunk.width,
            height: trunk.height*1.5,
            right: trunk.right,
            target: '#scatter-simple',
            xax_format: function(f) {
                var pf = d3.formatPrefix(f);
                return pf.scale(f) + pf.symbol;
            },
            x_accessor: 'x',
            y_accessor: 'y',
            y_rug: true
        });

        MG.data_graphic({
            title: "Automatic Category Coloring",
            description: "By setting <i>color_type</i> to 'category' you can color the points according to another discrete value.",
            data: data,
            chart_type: 'point',
            width: trunk.width,
            height: trunk.height*1.5,
            right: trunk.right,
            target: '#categorical1',
            xax_format: function(f) {
                var pf = d3.formatPrefix(f);
                return pf.scale(f) + pf.symbol;
            },
            x_accessor: 'x',
            y_accessor: 'y',
            color_accessor:'v',
            color_type:'category',
            y_rug: true
        });

        MG.data_graphic({
            title: "Custom Category Color Mapping",
            description: "You can specify the color domain and the corresponding color range to get custom mapping of categories to colors.",
            data: data,
            chart_type: 'point',
            width: trunk.width,
            height: trunk.height*1.5,
            right: trunk.right,
            target: '#categorical2',
            xax_format: function(f) {
                var pf = d3.formatPrefix(f);
                return pf.scale(f) + pf.symbol;
            },
            x_accessor: 'x',
            y_accessor: 'y',
            color_accessor:'v',
            color_domain:['cat_0', 'cat_1', 'other'],
            color_range:['blue', 'gray', 'black'],
            color_type:'category',
            x_rug: true
        });

        MG.data_graphic({
            title: "Simple Line of Best Fit",
            description: "For any scatterplot, set <i>least_squares</i> to true to add.",
            data: data,
            least_squares: true,
            chart_type: 'point',
            width: trunk.width,
            height: trunk.height*1.5,
            right: trunk.right,
            target: '#scatter-line-best-fit',
            xax_format: function(f) {
                var pf = d3.formatPrefix(f);
                return pf.scale(f) + pf.symbol;
            },
            x_accessor: 'x',
            y_accessor: 'y'
        });
    })

    //
    var bdata = [
        {a:'apples', b:'quartz'},
        {a:'bananas', b:'pyrite'},
        {a:'durian', b:'obsidian'}
    ]
    var resolution_features = ['weekly', 'monthly']

    var buttons = MG.button_layout('div#buttons')
        .data(bdata)
        .manual_button('Time Scale', resolution_features, function(){console.log('switched time scales.')})
        .button('a', 'Fruit')
        .button('b', 'Rock')
        .callback(function(){
            console.log('made it');
            return false;
        })
        .display();

    // data tables
    var table_data = [
        { 'year': 1852, 'value1': 10.2, 'value2': 1030004.43423,'share': .12, 'total': 34003400, 'temp': 43, 'geo': 'United Kingdom', 'description': "Having a way of describing a row can be useful." },
        { 'year': 1901, 'value1': 10.1, 'value2': 54003.223, 'share': .11, 'total': 4302100, 'temp': 55, 'geo': 'United States', 'description': "More made-up numbers." },
        { 'year': 1732, 'value1': 4.3, 'value2': 1004.91422,   'share': .14, 'total': 4300240, 'temp': 42, 'geo': 'France', 'description': "We didn't specify a title for this column." },
        { 'year': 1945, 'value1': 2.9, 'value2': 2430.121,  'share': .23, 'total': 24000000, 'temp': 54, 'geo': 'Brazil', 'description': "Brazil, Brazil." },
        { 'year': 1910, 'value1': 1.0, 'value2': 5432.3,  'share': .19, 'total': 130000, 'temp': 52, 'geo': 'India', 'description': "Last description in the whole thing." }
    ]

    var table1 = MG.data_table({
            data: table_data,
            title: 'A Data Table',
            description: 'A table has many of the same properties as any other data graphic.'
        })
        .target('#table1')
        .title({
            accessor: 'geo',
            secondary_accessor:'year',
            label: 'Country',
            description: 'These are arbitrary countries with arbitrary years underneath.'
        })
        .number({ accessor: 'value1', label: 'Size', value_formatter: function(d){ return d + ' yrds' }})
        .number({ accessor: 'value2', label: 'Score', round: 2,  font_weight: 'bold' })
        .number({ accessor: 'temp', label: 'Temp.', format: 'temperature', width: 100, color: 'gray' })
        .number({
            accessor: 'total',
            label: 'Volume',
            format: 'count', currency: '$',
            width: 100,
            font_weight: function(d){ return d < 5000000 ? 'bold' : 'normal' },
            color: function(d){ return d < 5000000 ? '#f70101' : 'auto' }
        })
        .number({ accessor: 'share', label: 'Share', format: 'percentage', width: 100 })
        .text({ accessor: 'description', width: 240, font_style: 'italic' })
        .display();


    //add this scatterplot and color the groups based on the theme
    addScatterplotSizeAndColor('light');

    function addScatterplotSizeAndColor(theme) {
        var color_range = (theme == 'light')
                ? null
                : ['white','yellow'];

        //call data_graphic again since we need to use a different color_range for the dark theme
        d3.json('data/points1.json', function(data) {
            MG.data_graphic({
                title: "Scatterplot with Size and Color",
                description: "Scatterplots have <i>x_accessor</i>, <i>y_accessor</i>, <i>size_accessor</i>, and <i>color_accessor</i>. For the last two you can also provide domain and range functions, to make it easy to change the color ranges. Colors default to red and blue, but can be overridden by passing an array of colors to <i>color_range</i>, as we've done in this example for the dark theme.",
                data: data,
                chart_type: 'point',
                width: trunk.width,
                height: trunk.height*1.5,
                right: trunk.right,
                target: '#scatter-size-and-color',
                xax_format: function(f) {
                    var pf = d3.formatPrefix(f);
                    return pf.scale(f) + pf.symbol;
                },
                x_accessor: 'x',
                y_accessor: 'y',
                color_accessor:'z',
                color_range: color_range,
                size_accessor:'w',
                x_rug: true,
                y_rug: true
            });
        });
    }

    function assignEventListeners() {
        $('#dark-css').click(function () {
            $('.missing')
                .css('background-image', 'url(images/missing-data-dark.png)');

            $('.wip')
                .css('background-color', '#3b3b3b');

            $('.trunk-section')
                .css('border-top-color', '#5e5e5e');

            $('.pill').removeClass('active');
            $(this).toggleClass('active');
            $('#dark').attr({href : 'css/metricsgraphics-demo-dark.css'});

            //add this scatterplot and color the groups based on the theme
            addScatterplotSizeAndColor('dark');

            return false;
        })

        $('#light-css').click(function () {
            $('.missing')
                .css('background-image', 'url(images/missing-data.png)');

            $('.wip')
                .css('background-color', '#f1f1f1');

            $('.trunk-section')
                .css('border-top-color', '#ccc');

            $('.pill').removeClass('active');
            $(this).toggleClass('active');
            $('#dark').attr({href : ''});
            $('#dark-layout').attr({href : ''});

            //add this scatterplot and color the groups based on the theme
            addScatterplotSizeAndColor('light');

            return false;
        })

        $('.split-by-controls button').click(function() {
            var new_y_accessor = $(this).data('y_accessor');

            //change button state
            $(this).addClass('active')
                .siblings()
                .removeClass('active');

            //update data
            MG.data_graphic({
                data: split_by_data,
                width: torso.width*2,
                height: trunk.height,
                right: trunk.right,
                xax_count: 4,
                target: '#split_by',
                x_accessor: 'date',
                y_accessor: new_y_accessor
            })
        })

        $('.modify-time-period-controls button').click(function() {
            var past_n_days = $(this).data('time_period');
            var data = modify_time_period(split_by_data, past_n_days);

            //change button state
            $(this).addClass('active')
                .siblings()
                .removeClass('active');

            //update data
            MG.data_graphic({
                data: data,
                width: torso.width*2,
                height: trunk.height,
                right: trunk.right,
                show_years: false,
                transition_on_update: false,
                xax_count: 4,
                target: '#modify_time_period',
                x_accessor: 'date',
                y_accessor: 'beta'
            })
        })
    }

    //replace all SVG images with inline SVG
    //http://stackoverflow.com/questions/11978995/how-to-change-color-of-svg
    //-image-using-css-jquery-svg-image-replacement
    $('img.svg').each(function() {
        var $img = jQuery(this);
        var imgID = $img.attr('id');
        var imgClass = $img.attr('class');
        var imgURL = $img.attr('src');

        $.get(imgURL, function(data) {
            // Get the SVG tag, ignore the rest
            var $svg = jQuery(data).find('svg');

            // Add replaced image's ID to the new SVG
            if(typeof imgID !== 'undefined') {
                $svg = $svg.attr('id', imgID);
            }
            // Add replaced image's classes to the new SVG
            if(typeof imgClass !== 'undefined') {
                $svg = $svg.attr('class', imgClass+' replaced-svg');
            }

            // Remove any invalid XML tags as per http://validator.w3.org
            $svg = $svg.removeAttr('xmlns:a');

            // Replace image with new SVG
            $img.replaceWith($svg);

        }, 'xml');
    })

    function modify_time_period(data, past_n_days) {
        //splice time period
        var data_spliced = MG.clone(data);
        if(past_n_days != '') {
            for(var i=0; i<data_spliced.length; i++) {
                var from = data_spliced[i].length - past_n_days;
                data_spliced[i].splice(0,from);
            }
        }

        return data_spliced;
    }
})
