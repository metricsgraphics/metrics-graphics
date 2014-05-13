function convert_dates(data){
    data = _.map(data, function(d){
            d['date'] = new Date(d['date']);
            return d;
    });
    return data;
}

var torso = {};
torso.width=375;
torso.height=200;
torso.right=20;

var trunk = {};

trunk.width=320;
trunk.height=150;
trunk.left=35;
trunk.right=10;
trunk.xax_count=5;

$(document).ready(function() {
    assignEventListeners();
    
    //sample chart 1
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
            linked: true,
            baselines: fake_baselines,
            target: '#fake_users1',
            x_accessor: 'date',
            y_accessor: 'value'
        })
    })
        
    //sample chart 2
    d3.json('data/fake_users2.json', function(data) {
        var fff = d3.time.format('%Y-%m-%d');
        for(var i=0;i<data.length;i++) {
            data[i] = _.map(data[i], function(d) {
                d['date'] = fff.parse(d['date']);
                return d;
            });
        }
        
        moz_chart({
            title:"More Fake Users",
            description: "This line chart contains multiple lines. We're still working out the style details.",
            data: data,
            linked: true,
            width: torso.width,
            height: torso.height,
            right: torso.right,
            target: '#fake_users2',
            x_accessor: 'date',
            y_accessor: 'value'
        })
    })

    //sample chart 3
    d3.json('data/some_percentage.json', function(data) {
        var fff = d3.time.format('%Y-%m-%d');
        for(var i=0;i<data.length;i++) {
            data[i] = _.map(data[i], function(d) {
                d['date'] = fff.parse(d['date']);
                return d;
            });
        }
        
        var markers = [{
            'date': new Date('2014-02-01'),
            'label': '1st Milestone'
        }, {
            'date': new Date('2014-03-15'),
            'label': '2nd Milestone'
        }, ]
            
        moz_chart({
            title: "Some Percentages",
            description: "Here is an example with the area turned off, and using the percentage format instead.",
            data: data,
            width: torso.width,
            height: torso.height,
            right: torso.right,
            area: false,
            markers: markers,
            format: 'percentage',
            target: 'div#percentage',
            x_accessor: 'date',
            y_accessor: 'value'
        });
    })
    
    //sample chart 4           
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
            title: "This Section, pt. 1",
            description: "Another Graph.",
            data: data,
            width: trunk.width,
            height: trunk.height,
            right: trunk.right,
            xax_count: 4,
            target: 'div#briefing-1',
            x_accessor: 'date',
            y_accessor: 'value'
        });

    });
    d3.json('data/brief-2.json', function(data) {
        data = convert_dates(data);
        moz_chart({
            title: "Another Chart",
            description: "Yet Another Graph.",
            data: data,
            width: trunk.width,
            height: trunk.height,
            right: trunk.right,
            xax_count: 4,
            target: 'div#briefing-2',
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