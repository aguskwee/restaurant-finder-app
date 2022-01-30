$(function(e) {
	// get owner restaurants
	let owner = findCookie(appCookie);
	if(owner) owner = decodeURIComponent(owner);

	// get restaurant owned by the logged in owner
	$.post('/ws/get-owned-restaurants', {
		owner: owner
	}).always(function(resp) {
		$('#ownerRestaurants').empty();

		if(!resp || (resp && resp.statusCode && resp.statusCode != 200)) {
			$('#ownerRestaurants').append('<h5>No restaurants can be retrieved at the moment!</h5>');
			return;
		}
		let template = resp['template'];
		let data = resp['data'];
		if(data.length == 0) {
			$('#ownerRestaurants').append('<h5>You do not restaurants at the moment. Please add your first restaurant.</h5>');
			return;
		}
		data.forEach(function(d) {$('#ownerRestaurants').append(Mustache.render(template, d));});
	});
});