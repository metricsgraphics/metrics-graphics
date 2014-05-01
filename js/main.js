$(document).ready(function(){

d3.json('data/firefox_releases.json', function(versions){
	var fff = d3.time.format('%Y-%m-%d');
	app.versions = _.map(versions['releases'], function(d,i){
		d['date'] = fff.parse(d['date']);
		d['label'] = d['version'];
		if (parseFloat(d['version']) >= 23) d['end'] = fff.parse(d['end']);
		return d;
	})

	app.versions = _.filter(app.versions, function(d){
		return d['version'].length == 4 && parseFloat(d['version']) <= parseInt(app.current_version)+1 && parseFloat(d['version']) >= 27 ;
	});

	app.versions.reverse();

	var WIDTH = 400;
	var HEIGHT = 150;

	d3.json('data/fake_users.json', function(data){
		data = _.map(data, function(d){
			d['date'] = fff.parse(d['date']);
			return d;
		});
		$('div#fake_users').append('<h2 class="first">UNIQUE FAKE USERS</h2>')

		moz_chart({
			data: data, 
			width: 600,
			height: 250,
			right: 20,
			markers: app.versions,
			target:'div#fake_users',
			x_accessor:'date', 
			y_accessor:'value'});
		
	});
	d3.json('data/some_percentage.json', function(data){
		data = _.map(data, function(d){
			d['date'] = fff.parse(d['date']);
			return d;
		});
		var markers = [
			{'date': new Date('2014-02-01'), 'label': '1st Milestone'},
			{'date':new Date('2014-03-15'), 'label': '2nd Milestone'},
		]
		$('div#percentage').append('<h2 class="first">SOME PERCENTAGE</h2>')

		moz_chart({
			data: data, 
			width:600,
			height:250,
			right:20,
			area: false,
			markers: markers,
			type:'percentage',
			target:'div#percentage',
			x_accessor:'date', 
			y_accessor:'value'});
		
	});
})




})
