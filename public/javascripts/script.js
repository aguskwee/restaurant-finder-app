$(function() {
	// generate popular restaurants
	$.get('ws/get-popular-restaurants')
		.always(function(resp) {
			$('#popularList').empty();
			if(resp.statusCode && resp.statusCode != 200) $('#popularList').append('<h5>No popular restaurants can be retrieved at the moment!.</h5>');
			else {
				let template = resp.template;
				let data = resp.data;

				for(let d of data) $('#popularList').append(Mustache.render(template, d));
			}
	});
});