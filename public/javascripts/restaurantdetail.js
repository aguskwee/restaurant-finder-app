function clickStar(idx, el) {
	let elms = $(el).parent().find('.fa-star');
	$(elms).attr('data-prefix', 'far');
	for(let i = 0; i < idx; i++) {
		$(elms).eq(i).attr('data-prefix', 'fas');
	}
}

function submitNewMenu(el) {
	let menuName = $(el).parent().find('input.item-name').val().trim();
	let menuPrice = $(el).parent().find('input.item-price').val().trim();

	if(!menuName || !menuPrice || isNaN(menuPrice)) {
		$(el).parent().find('p.error').text('Invalid input!').show();
		return;
	}

	let form = new FormData();
	form.append('name', menuName);
	form.append('price', menuPrice);
	form.append('restaurantId', $('#restaurantId').val().trim());
	let ins = $(el).parent().parent().find('input[name="item"]').eq(0);
	if($(ins).get(0).files.length > 0) form.append('menu-image', $(ins).get(0).files[0]);

	// submit data
	$.ajax({
		url: '/ws/submit-new-menu',
		type: 'POST',
		enctype: 'multipart/form-data',
		data: form,
		contentType: false,
		processData: false,
		cache: false,
		complete: function(resp) {
			if(!resp || (resp.status && resp.status != 200)) {
				$(el).parent().find('p.error').css('margin-bottom', '5px').text("Oops! Error saving menu!").show();
				return;
			}

			window.location.reload();
		}
	});
}

function submitRating(el, menuId) {
	let score = $(el).parent().find('.fa-star[data-prefix="fas"]').length;

	if(score == 0) return;

	// hide error message
	$(el).parent().find('p.error').hide();

	$.post('/ws/submit-rating', {
		restaurantId: $('#restaurantId').val(),
		menuId: menuId,
		rating: score
	}).always(function(resp) {
		if(!resp || (resp.statusCode && resp.statusCode != 200)) {
			$(el).parent().find('p.error').show();
		}
		else {
			$(el).parent().empty().append('<p>Thank your for your feedback.</p>');
			setTimeout(function() {
				if(menuId) $('#popover-menu-' + menuId).parent().find('button[data-bs-toggle').click().remove();
				else $('#popover-restaurant').parent().find('button[data-bs-toggle').click().remove();
			}, 1000);
		}
	});
}

$(function() {
	let restaurantId = $('#restaurantId').val().trim();
	$.get('/ws/get-restaurant-detail/' + restaurantId)
		.always(function(resp) {
			if(!resp || (resp.statusCode && resp.statusCode != 200)) {
				$('.container').empty().append('<div class="row"><div class="col-8 offset-2"><h5>Oops! This restaurant details cannot be retrieved at the moment!</h5></div></div>')
				return;
			}

			let details = resp['details'];
			let menuTemplate = resp['menuTemplate'];
			let detailTemplate = resp['detailTemplate'];
			let owner = decodeURIComponent(details['owner']);

			$('.detail-row').empty().append(Mustache.render(detailTemplate, details));
			let menus = details['menus'];
			if(!menus || menus.length == 0) {
				if(findCookie(appCookie) == owner) {
					// add button to add menu
					$('#menuList').append('<li class="col-3 vertical-align-top"><button id="item-addnew" class="btn btn-outline-dark" onclick="addNewMenu();">Add a new menu</button></li>')
				}
				else $('#menuList').empty().append('<h5>No available menu in this restaurant at the moment!</h5>');
			}
			else  {
				$('#menuList').empty();
				menus.forEach(function(menu) {$('#menuList').append(Mustache.render(menuTemplate, menu));});

				if(findCookie(appCookie) == owner) {
					// add button to add menu
					$('#menuList').append('<li class="col-3 vertical-align-top"><button id="item-addnew" class="btn btn-outline-dark" onclick="addNewMenu();">Add a new menu</button></li>')
				}
			}

			// enable popover for rating
			$('[data-bs-toggle="popover"]').each(function(idx, el) {
				new bootstrap.Popover(el, {
					sanitize: false,
					html: true,
					content: $('#' + $(el).attr('content-id')).html()
				});
			});
		})
});