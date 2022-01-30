// validate phone number
function isValidContact(contact) {
	const ptn = /^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/;
	return contact.match(ptn);
}

// validate all fields
function validateInputs() {
	let name = $('#newrestaurant-name').val().trim();
	let openHour = $('#newrestaurant-openhour').val().trim();
	let closeHour = $('#newrestaurant-closehour').val().trim();
	let contact = $('#newrestaurant-contact').val().trim();
	let address = $('#newrestaurant-addr').val().trim();
	let geoLocation = $('#newrestaurant-lat').val().trim() + ',' + $('#newrestaurant-lng').val().trim();

	if(!name) {
		$('#newrestaurant-btn').parent().find('p.error').text('Invalid restaurant name!').show();
		return false;
	}
	if(!openHour || openHour < 0 || openHour > 24) {
		$('#newrestaurant-btn').parent().find('p.error').text('Invalid restaurant opening hour!').show();
		return false;
	}
	if(!closeHour || closeHour < 0 || closeHour > 24) {
		$('#newrestaurant-btn').parent().find('p.error').text('Invalid restaurant closing hour!').show();
		return false;
	}
	if(+openHour > +closeHour) {
		$('#newrestaurant-btn').parent().find('p.error').text('Invalid restaurant opening and closing hour!').show();
		return;
	}
	if(!contact || !isValidContact(contact)) {
		$('#newrestaurant-btn').parent().find('p.error').text('Invalid restaurant contact number!').show();
		return false;
	}
	if(!address) {
		$('#newrestaurant-btn').parent().find('p.error').text('Invalid restaurant address!').show();
		return false;
	}
	if(!geoLocation) {
		let lat = geoLocation.split(',')[0];
		let lng = geoLocation.split(',')[1];
		if(isNaN(lat) || isNaN(lng)) {
			$('#newrestaurant-btn').parent().find('p.error').text('Invalid restaurant geo location value!').show();
			return false;
		}
	}

	return true;
}

function createNewRestaurant() {
	let isValid = validateInputs();
	if(!isValid) return;

	let email = findCookie(appCookie);
	let name = $('#newrestaurant-name').val().trim();
	let openHour = $('#newrestaurant-openhour').val().trim();
	let closeHour = $('#newrestaurant-closehour').val().trim();
	let contact = $('#newrestaurant-contact').val().trim();
	let address = $('#newrestaurant-addr').val().trim();
	let geoLocation = $('#newrestaurant-lat').val().trim() + ',' + $('#newrestaurant-lng').val().trim();
	let img = $('#newrestaurant-img').val().trim();

	// check on menus
	let tmp = $('#menuList > li > .card');
	isValid = true;

	let form = new FormData();

	let menus = [];
	tmp.each(function(idx, el) {
		let menuImg = $(el).find('input[name="item"]').get(0).files.length > 0 ?  $(el).find('input[name="item"]').get(0).files[0] : null;
		let menuName = $(el).find('.item-name').val().trim();
		let menuPrice = $(el).find('.item-price').val().trim();

		if(!menuName || !menuPrice) isValid = false;

		let menu = {name: menuName, price: menuPrice};
		if(menuImg) {
			form.append('menu-image' + idx, menuImg);
			menu['menu-img-id'] = idx;
		}

		menus.push(menu);
	});
	if(!isValid) {
		$('p.error').text('Menu is not valid!').show();
		return;
	}

	form.append('email', email);
	form.append('name', name);
	form.append('openHour', openHour);
	form.append('closeHour', closeHour);
	form.append('contact', contact);
	form.append('address', address);
	form.append('geoLocation', geoLocation);
	form.append('menus', JSON.stringify(menus));
	if($('#newrestaurant-file').get(0).files.length > 0) form.append('image', $('#newrestaurant-file').get(0).files[0]);

	// submit data
	$.ajax({
		url: '/ws/register-new-restaurant',
		type: 'POST',
		enctype: 'multipart/form-data',
		data: form,
		contentType: false,
		processData: false,
		cache: false,
		complete: function(resp) {
			if(!resp || (resp.status && resp.status != 200)) {
				$('p.error').eq(1).text('Error saving new restaurant!').show();
				return;
			}

			// go to restaurant page
			let restaurantId = resp.responseText;
			window.location = '/restaurant/' + restaurantId;
		}
	});
}

$(function(e) {
	// show image when user upload image file
	$('#newrestaurant-file').on('change', function() {
		if(this.files && this.files[0]) {
			let reader = new FileReader();
			reader.onload = function(e) {
				$('#newrestaurant-img').empty().append('<img src="' + e.target.result + '" width="100%" />');
			}
			reader.readAsDataURL(this.files[0]);
		}
	});

	// search for geolocation when user exits address field
	$('#newrestaurant-addr').on('blur', function(e) {
		let addr = $(e.target).val().trim();
		if(addr == '') {
			$('#newrestaurant-lat, #newrestaurant-lng').val('');
			return;
		}

		$.post('/ws/get-geolocation-from-address', {
			address: addr
		}).always(function(resp) {
			if(!resp || (resp.statusCode && resp.statusCode == 200)) return;

			let lat = resp['lat'], lng = resp['lng'];
			$('#newrestaurant-lat').val(lat);
			$('#newrestaurant-lng').val(lng);
		});
	});
});

