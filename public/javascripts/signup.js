// validate user account fields
function checkFields() {
	let name = $('#signup-username').val().trim();
	let email = $('#signup-email').val().trim();
	let password = $('#signup-password').val().trim();
	let confirmPassword = $('#signup-confirm-password').val().trim();

	if(!name || ! email || !password || !confirmPassword) return 'Please fill all required fields!';
	if(confirmPassword != password) return 'Password does not matched!';

	const EMAIL_PTN = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
	if(!email.match(EMAIL_PTN)) return 'Invalid email address!';

	return null;
}

$(function() {
	// create account when user clicks Enter button
	$('body').keyup(function(e) {
		if(e.keyCode == 13) $('#signup-btn').click();
	});

	// submit info to create account
	$('#signup-btn').off('click').on('click', function(e) {
		let invalidMsg = checkFields();

		if(invalidMsg) {
			$('p.error').text(invalidMsg).show();
			return;
		}

		let encryptedPassword = MD5($('#signup-password').val().trim());
		$.post('/ws/register-new-owner', {
			name: $('#signup-username').val().trim(),
			email: $('#signup-email').val().trim(),
			password: encryptedPassword
		}).always(function(resp) {
			if(!resp || (resp && resp.statusCode && resp.statusCode != 200)) {
				$('p.error').text('Error occured when registering an account!').show();
				return;
			}
			else if(resp == '1') {
				$('p.error').text('The account has been registered! Please sign in.')
					.css('color', '#198754').show();

				setTimeout(function(e) { window.location = '/signin'; }, 2000);
			}
			else {
				// other error occured, most likely duplicate user
				$('p.error').text(resp).show();
				return;
			}
		})
	});
});