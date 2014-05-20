$(document).ready(function() {

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
            title: "Fake Users",
            description: "This is a simple line chart. You can remove the area portion by adding area: false to the arguments list.",
            data: data,
            width: torso.width,
            height: torso.height,
            right: torso.right,
            baselines: fake_baselines,
            target: '#fake_users1',
            x_accessor: 'date',
            y_accessor: 'value'
        })
        
        moz_chart({
            title: "Extended Ticks, Custom Rollover",
            description: "A wider chart with extended horizontal ticks enabled and a custom rollover text.",
            data: data,
            width: 960,
            area: false,
            xax_tick: 0,
            y_extended_ticks: true,
            rollover_callback: function(d, i) {
                //custom format the rollover text, show days
                var prefix = d3.formatPrefix(d.value);
                $('.active_datapoint')
                    .html('Day ' + (i+1) + ' &nbsp; '
                            + prefix.scale(d.value).toFixed(2) + prefix.symbol);
            },
            height: torso.height,
            right: torso.right,
            target: '#long',
            x_accessor: 'date',
            y_accessor: 'value'
        })
    })
        
    d3.json('data/fake_users2.json', function(data) {
        for(var i=0;i<data.length;i++) {
            data[i] = convert_dates(data[i]);
        };
        
        moz_chart({
            title:"More Fake Users",
            description: "This line chart contains multiple lines. We're still working out the style details.",
            data: data,
            width: torso.width,
            height: torso.height,
            right: torso.right,
            target: '#fake_users2',
            x_accessor: 'date',
            y_accessor: 'value'
        })
    });

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
        }, ]
            
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
        });
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
        });
    })
    
    d3.json('data/xnotdate.json', function(data) {
        moz_chart({
            left: 80,
            bottom: 50,
            title: "X-axis Not Time",
            description: "A chart where we're not plotting dates on the x-axis and where the axes include labels.",
            data: data,
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
        });
    });
    
    moz_chart({
        title: "Glorious Chart",
        chart_type: 'missing-data',
        description: "Here is an example of a chart whose data is currently missing.",
        width: torso.width,
        height: torso.height,
        right: torso.right,
        target: 'div#glorious_chart'
    });

    // lower section
    d3.json('data/brief-1.json', function(data) {
        data = convert_dates(data);
        
        moz_chart({
            title: "Linked Charts",
            description: "The two charts in this section are linked together. A rollover in one causes a rollover in the other. We are still working out how to make the exact same changes in each, but for now the rollovers merely trigger the rect.",
            data: data,
            width: trunk.width,
            linked: true,
            height: trunk.height,
            right: trunk.right,
            xax_count: 4,
            target: 'div#briefing-1',
            x_accessor: 'date',
            y_accessor: 'value'
        });
        
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
        });

    });
    
    d3.json('data/brief-2.json', function(data) {
        data = convert_dates(data);
        
        moz_chart({
            title: "area=false",
            description: "Small check to see that area: false works how we'd expect it.",
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
        });
        
        moz_chart({
            title: "small_text=true",
            description: "by adding small_text:true to the args list, we can force the use of smaller axis text regardless of the width or height",
            data: data,
            width: trunk.width,
            height: trunk.height,
            right: trunk.right,
            small_text: true,
            xax_count: 4,
            target: 'div#small2',
            x_accessor: 'date',
            y_accessor: 'value'
        });
    });
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
    });
    
    $('#light-css').click(function () {
        $('.missing')
            .css('background-image', 'url(images/missing-data.png)');
            
        $('.transparent-rollover-rect')
            .attr('fill', 'black');
    
        $('.pill').removeClass('active');
        $(this).toggleClass('active');
        
        $('#dark').attr({href : ''});
        return false;
    });
}

function convert_dates(data){
    data = data.map(function(d){
        var fff = d3.time.format('%Y-%m-%d');
        d['date'] = fff.parse(d['date']);
        return d;
    });
    
    return data;
}