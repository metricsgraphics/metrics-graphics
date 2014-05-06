$(document).ready(function() {
    //sample chart 1
    d3.json('data/fake_users.json', function(data) {
        $('#fake_users').append('<h2>Unique fake users</h2>')
        moz_chart({
            data: data,
            width: 600,
            height: 250,
            right: 20,
            target: '#fake_users',
            x_accessor: 'date',
            y_accessor: 'value'
        })
    })
        
    //sample chart 2
    d3.json('data/some_percentage.json', function(data) {
        var markers = [{
            'date': new Date('2014-02-01'),
            'label': '1st Milestone'
        }, {
            'date': new Date('2014-03-15'),
            'label': '2nd Milestone'
        }, ]
            
        $('#percentage').append('<h2>Some percentage</h2>')
        moz_chart({
            data: data,
            width: 600,
            height: 250,
            right: 20,
            area: false,
            markers: markers,
            type: 'percentage',
            target: 'div#percentage',
            x_accessor: 'date',
            y_accessor: 'value'
        })
    })
})