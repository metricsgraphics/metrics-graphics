'use strict';

$(document).ready(function() {
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

    d3.json('data/fake_users1.json', function(data) {
        var fff = d3.time.format('%Y-%m-%d');
        for(var i=0;i<data.length;i++) {
            var d = data[i];
            d['date'] = fff.parse(d['date']);
        }

        var fake_baselines = [{value:160000000, label:'a baseline'}]

        moz_chart({
            title: "Line Chart",
            description: "This is a simple line chart. You can remove the area portion by adding area: false to the arguments list.",
            data: data,
            width: torso.width,
            height: torso.height,
            right: torso.right,
            baselines: fake_baselines,
            target: '#fake_users1',
            x_accessor: 'date',
            y_accessor: 'value'
        });
        
        var markers = [{
            'date': new Date('2014-03-17'),
            'label': 'Look, a spike!'
        }];
        
        moz_chart({
            title: "Annotations",
            description: "By setting the chart's target a class name of main-area-solid, markers don't extend down to the bottom of the chart, which better draws attention to, say, spikes.",
            data: data,
            width: torso.width,
            height: torso.height,
            right: torso.right,
            markers: markers,
            target: '#spike',
            x_accessor: 'date',
            y_accessor: 'value'
        })
    })

    d3.json('data/fake_users2.json', function(data) {
        for(var i=0;i<data.length;i++) {
            data[i] = convert_dates(data[i]);
        }

        moz_chart({
            title:"Multi-line Chart",
            description: "This line chart contains multiple lines. We're still working out the style details.",
            data: data,
            width: torso.width,
            height: torso.height,
            right: torso.right,
            target: '#fake_users2',
            x_accessor: 'date',
            y_accessor: 'value'
        })

        moz_chart({
            title:"Multi-line Chart Wide",
            description: "This line chart contains multiple lines and has extended ticks enabled.",
            area: false,
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
        moz_chart({
            title:"Multi-line Linked",
            description: "Demoing linked multi-line charts.",
            data: data,
            width: torso.width,
            height: torso.height,
            right: torso.right,
            target: '#linked_multi1',
            linked: true,
            x_accessor: 'date',
            y_accessor: 'value'
        })
    })
    
    
    d3.json('data/fake_users3.json', function(data) {  
        for(var i=0;i<data.length;i++) {
            data[i] = convert_dates(data[i]);
        }
 
        //linked multi-line charts
        moz_chart({
            title:"Multi-line Linked 2",
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
        data = convert_dates(data);
        moz_chart({
            title: "Confidence Band",
            description: "This is an example of a chart with a confidence band and extended x-axis ticks enabled.",
            data: data,
            format: 'percentage',
            width: torso.width*2,
            height: torso.height,
            right: trunk.right,
            target: 'div#confidence_band',
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
            data[i] = convert_dates(data[i]);
        };
        moz_chart({
            title: "Log Scale",
            description: "This is a simple line chart. You can remove the area portion by adding area: false to the arguments list.",
            data: data,
            y_scale_type:'log',
            width: torso.width*2,
            height: torso.height,
            right: torso.right,
            target: '#log1',
            x_accessor: 'date',
            y_accessor: 'value'
        });
    })

    d3.json('data/some_percentage.json', function(data) {
        for(var i=0;i<data.length;i++) {
            data[i] = convert_dates(data[i]);
        };

        var markers = [{
            'date': new Date('2014-02-01'),
            'label': '1st Milestone'
        }, {
            'date': new Date('2014-03-15'),
            'label': '2nd Milestone'
        }]
            
        moz_chart({
            title: "Some Percentages",
            description: "Here is an example that shows percentages.",
            data: data,
            width: torso.width,
            height: torso.height,
            right: torso.right,
            markers: markers,
            format: 'percentage',
            target: 'div#percentage',
            x_accessor: 'date',
            y_accessor: 'value'
        })

        moz_chart({
            title: "Changing Precision 2",
            description: "Here we set decimals: 0 for percentages.",
            data: data,
            decimals: 0,
            format: 'Percentage',
            width: trunk.width,
            height: trunk.height,
            right: trunk.right,
            xax_count: 4,
            target: 'div#precision2',
            x_accessor: 'date',
            y_accessor: 'value'
        })

        moz_chart({
            title: "... Or No Rollover Text",
            description: "By setting show_rollover_text: false, you can hide the default rollover text from even appearing. This coupled with the custom callback gives a lot of interesting options for controlling rollovers.",
            data: data,
            decimals: 0,
            show_rollover_text: false,
            format: 'Percentage',
            width: trunk.width,
            height: trunk.height,
            right: trunk.right,
            xax_count: 4,
            target: 'div#no-rollover-text',
            x_accessor: 'date',
            y_accessor: 'value'
        })
    })

    d3.json('data/some_currency.json', function(data) {
        data = convert_dates(data);
        moz_chart({
            title: "Some Currency",
            description: "Here is an example that uses custom units for currency.",
            data: data,
            width: torso.width,
            height: torso.height,
            right: torso.right,
            target: 'div#currency',
            x_accessor: 'date',
            yax_units: '$',
            y_accessor: 'value'
        })
    })

    d3.json('data/xnotdate.json', function(data) {
        moz_chart({
            left: 80,
            bottom: 50,
            title: "X-axis Not Time, Animated",
            description: "A chart where we're not plotting dates on the x-axis and where the axes include labels and the line animates on load.",
            data: data,
            animate_on_load: true,
            area: false,
            width: torso.width,
            height: torso.height,
            right: trunk.right,
            target: 'div#xnotdate',
            xax_format: function(f) {
                var pf = d3.formatPrefix(f);
                return pf.scale(f) + pf.symbol;
            },
            x_accessor: 'males',
            y_accessor: 'females',
            x_label: 'males',
            y_label: 'females',
        })
    })

    moz_chart({
        title: "Glorious Chart",
        chart_type: 'missing-data',
        description: "This is an example of a chart whose data is currently missing.",
        width: torso.width,
        height: torso.height,
        right: torso.right,
        target: 'div#glorious_chart'
    })

    // lower section
    d3.json('data/brief-1.json', function(data) {
        data = convert_dates(data);
        
        moz_chart({
            title: "Linked Charts",
            description: "The two charts in this section are linked together. A rollover in one causes a rollover in the other.",
            data: data,
            width: trunk.width,
            linked: true,
            height: trunk.height,
            right: trunk.right,
            xax_count: 4,
            target: 'div#briefing-1',
            x_accessor: 'date',
            y_accessor: 'value'
        })

        moz_chart({
            title: "Small Text Inferred By Size",
            description: "If the args.width - args.left - args.right is smaller than the args.small_width_threshold (and the flip for the height) then the text size automatically scales to be slightly smaller.",
            data: data,
            width: small.width,
            height: small.height,
            right: small.right,
            top: small.top,
            xax_count: 4,
            target: 'div#small1',
            x_accessor: 'date',
            y_accessor: 'value'
        })
    })

    d3.json('data/split_by.json', function(data) {
        data = convert_dates(data);
        
        split_by_data = moz_chart({
            title: "Downloads by Channel",
            description: "The chart is gracefully updated depending on the selected channel.",
            data: data,
            width: torso.width*2,
            height: trunk.height,
            right: trunk.right,
            xax_count: 4,
            target: 'div#split_by',
            x_accessor: 'date',
            y_accessor: 'release'
        })

        moz_chart({
            title: "Beta Downloads",
            description: "The chart is gracefully updated depending on the chosen time period.",
            data: data,
            width: torso.width*2,
            height: trunk.height,
            right: trunk.right,
            show_years: false,
            xax_count: 4,
            target: 'div#modify_time_period',
            x_accessor: 'date',
            y_accessor: 'beta'
        })
    })

    d3.json('data/brief-2.json', function(data) {
        data = convert_dates(data);
        
        moz_chart({
            title: "Other Linked Chart",
            description: "Roll over and watch as the chart to the left triggers.",
            data: data,
            area: false,
            linked: true,
            width: trunk.width,
            height: trunk.height,
            right: trunk.right,
            xax_count: 4,
            target: 'div#briefing-2',
            x_accessor: 'date',
            y_accessor: 'value'
        })
        
        moz_chart({
            title: "Small Text",
            description: "By adding small_text:true to the args list, we can force the use of smaller axis text regardless of the width or height",
            data: data,
            width: trunk.width,
            height: trunk.height,
            right: trunk.right,
            small_text: true,
            xax_count: 4,
            target: 'div#small2',
            x_accessor: 'date',
            y_accessor: 'value'
        })
    })

    d3.json('data/float.json', function(data) {
        data = convert_dates(data);

        moz_chart({
            title: "Changing Precision 1",
            description: "Here we set decimals: 3 to get 3 decimals in the rollover for percentages.",
            data: data,
            decimals: 3,
            width: trunk.width,
            height: trunk.height,
            right: trunk.right,
            xax_count: 4,
            target: 'div#precision1',
            x_accessor: 'date',
            y_accessor: 'value'
        })

        moz_chart({
            title: "Custom Rollover Text",
            description: "Here is an example of changing the rollover text. You could in theory actually update any DOM element with the data from that rollover - a title, for instance.",
            data: data,
            width: trunk.width,
            height: trunk.height,
            right: trunk.right,
            xax_count: 4,
            rollover_callback: function(d, i) {
                //custom format the rollover text, show days
                var prefix = d3.formatPrefix(d.value);
                $('div#custom-rollover svg .active_datapoint')
                    .html('Day ' + (i+1) + ' &nbsp; '
                         + prefix.scale(d.value).toFixed(2) + prefix.symbol);
            },
            target: 'div#custom-rollover',
            x_accessor: 'date',
            y_accessor: 'value'
        })
    })

    d3.json('data/neg1.json', function(data) {
        data = convert_dates(data);

        moz_chart({
            title: "Negative Values 1",
            description: "Currently defaults to having no area by default.",
            data: data,
            width: trunk.width,
            height: trunk.height,
            right: trunk.right,
            target: 'div#neg1',
            x_accessor: 'date',
            y_accessor: 'value'
        })
    })

    d3.json('data/neg2.json', function(data) {
        moz_chart({
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
            target: 'div#neg2',
            x_accessor: 'subject',
            y_accessor: 'measure'
        })
    })

    d3.json('data/points1.json', function(data) {
        moz_chart({
            title: "Scatterplot",
            description: "A first example of a scatterplot.",
            data: data,
            chart_type: 'point',
            width: trunk.width*2,
            height: trunk.height*2,
            right: trunk.right,
            target: 'div#scatter1',
            xax_format: function(f) {
                var pf = d3.formatPrefix(f);
                return pf.scale(f) + pf.symbol;
            },
            x_accessor: 'x',
            y_accessor: 'y'
        })
    })
    

    function assignEventListeners() {
        $('#dark-css').click(function () {
            $('.missing')
                .css('background-image', 'url(images/missing-data-dark.png)');
                
            $('.transparent-rollover-rect')
                .attr('fill', 'white');
        
            $('.pill').removeClass('active');
            $(this).toggleClass('active');
            
            $('#dark').attr({href : 'css/metrics-graphics-darkness.css'});
            
            return false;
        })

        $('#light-css').click(function () {
            $('.missing')
                .css('background-image', 'url(images/missing-data.png)');
                
            $('.transparent-rollover-rect')
                .attr('fill', 'black');
        
            $('.pill').removeClass('active');
            $(this).toggleClass('active');
            
            $('#dark').attr({href : ''});
            return false;
        })

        $('.split-by-controls button').click(function() {
            var new_y_accessor = $(this).data('y_accessor');

            //change button state
            $(this).addClass('active')
                .siblings()
                .removeClass('active');

            //update data    
            moz_chart({
                data: split_by_data,
                width: torso.width*2,
                height: trunk.height,
                right: trunk.right,
                xax_count: 4,
                target: 'div#split_by',
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
            moz_chart({
                data: data,
                width: torso.width*2,
                height: trunk.height,
                right: trunk.right,
                show_years: false,
                transition_on_update: false,
                xax_count: 4,
                target: 'div#modify_time_period',
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
})
