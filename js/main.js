$(document).ready(function() {
    //sample chart 1
    d3.json('data/fake_users1.json', function(data) {

        var fake_baselines = [{value:160000000, label:'a baseline'}]

        moz_chart({
            title:"Fake Users",
            description: "This is a simple line chart. You can remove the area portion by adding area: false to the arguments list.",
            data: data,
            width: 600,
            height: 250,
            right: 20,
            baselines: fake_baselines,
            target: '#fake_users1',
            x_accessor: 'date',
            y_accessor: 'value',
            link: true
        })
    })
        
    //sample chart 2
    d3.json('data/fake_users2.json', function(data) {

        moz_chart({
            title:"More Fake Users",
            description: "This line chart contains multiple lines. We're still working out the style details.",
            data: data,
            width: 600,
            height: 250,
            right: 20,
            target: '#fake_users2',
            x_accessor: 'date',
            y_accessor: 'value',
            link: true
        })
    })

    //sample chart 3
    d3.json('data/some_percentage.json', function(data) {

        var markers = [{
            'date': new Date('2014-02-01'),
            'label': '1st Milestone'
        }, {
            'date': new Date('2014-03-15'),
            'label': '2nd Milestone'
        }, ]
            
        moz_chart({
            title:"Some Percentages",
            description: "Here is an example with the area turned off, and using the percentage format instead.",
            data: data,
            width: 600,
            height: 250,
            right: 20,
            area: false,
            markers: markers,
            format: 'percentage',
            target: 'div#percentage',
            x_accessor: 'date',
            y_accessor: 'value'
        })
    })
})