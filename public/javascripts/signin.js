// validate fields
function checkFields() {
	let username = $('#signin-email').val().trim();
	let password = $('#signin-password').val().trim();

	if(!username || ! password) return false;
	return true;
}

$(function() {
	// check cookie, if it exists, go directly to profile page
	if(findCookie(appCookie) != null) window.location = '/profile';

	// add enter keyup event
	$('body').keyup(function(e) {
		if(e.keyCode == 13) $('#signin-btn').click();
	});

	$('#signin-btn').off('click').on('click', function(e) {
		let isValid = checkFields();

		if(!isValid) {
			$('p.error').text('Please fill all required fields!').show();
			return;
		}

		// convert password to md5
		let encryptedPassword = MD5($('#signin-password').val());

		$.post('/ws/authenticate-user', {
			email: $('#signin-email').val(),
			password: encryptedPassword
		}).always(function(resp) {
			if(!resp || (resp && resp.statusCode && resp.statusCode != 200)) {
				$('p.error').text('Invalid username/password!').show();
			}
			else if(resp == '1') window.location = '/profile';
		});
	});
});