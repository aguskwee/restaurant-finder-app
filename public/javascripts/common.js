// read cookie
function findCookie(key) {
	let cookies = document.cookie.split(';');
	for(let cookie of cookies) {
		cookie = cookie.trim().split('=');
		if(cookie[0].trim() == key) return decodeURIComponent(cookie[1].trim());
	}

	return null;
}

function addNewMenu(isNewRestaurant) {
	$.get('/ws/get-new-menu-template')
		.always(function(resp) {
			if(!resp || (resp.statusCode && resp.statusCode != 200)) {
				return;
			}

			if(isNewRestaurant)
				$('#item-addnew').parent().before(Mustache.render(resp, {newRestaurant: 1}));
			else
				$('#item-addnew').parent().before(Mustache.render(resp, {}));

			$('input[name="item"]').on('change', function(el) {
				if(this.files && this.files[0]) {
					let reader = new FileReader();
					reader.onload = function(e) {
						$(el.target).parent().find('.item-img').empty().append('<img src="' + e.target.result + '" width="100%" height="100%" />');
					}
					reader.readAsDataURL(this.files[0]);
				}
			});
		});
}