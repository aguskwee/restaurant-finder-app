
// create slider for overall and menu rating filters
function generateSliders() {
	let firstOptions = {
		direction: 'horizontal',
		skin: 'green',
		type: 'interval',
		scale: true
	}, secondOptions = {
		min: 0,
		max: 5,
		step: 1,
		values: [0, 5]
	}
	$('#overall-slider').rangeSlider(firstOptions, secondOptions);
	$('#menu-slider').rangeSlider(firstOptions, secondOptions);

	$('#overall-slider').rangeSlider('onChange', function(e) {
		$('#overall-slider').attr('min', e.detail.values[0])
			.attr('max', e.detail.values[1]);
	});
	$('#menu-slider').rangeSlider('onChange', function(e) {
		$('#menu-slider').attr('min', e.detail.values[0])
			.attr('max', e.detail.values[1]);
	});
}

// do actual restaurant search
function doSearch() {
	// prepare the page for searching
	$('.container').empty().append('<div class="row"><div class="col-10 offset-1"></div></div>\
			<div class="row"><div class="col-10 offset-1"><ul class="itemList"></ul></div></div>')

	// get all parameters
	let searchType = $('#search-type').val();
	let searchQuery = $('#search-input').val().trim();
	if(searchQuery == '') return;

	let minOverallFilter = $('#overall-slider').attr('min');
	let maxOverallFilter = $('#overall-slider').attr('max');
	let minMenuFilter = $('#menu-slider').attr('min');
	let maxMenuFilter = $('#menu-slider').attr('max');

	// validate for geolocation format
	if(searchType == 'geoloc') {
		let loc = searchQuery.split(',');
		if(loc.length != 2) return;
		if(isNaN(loc[0]) || isNaN(loc[1])) return;
	}

	$.post('/ws/search', {
		type: searchType,
		query: searchQuery,
		minOverallFilter: minOverallFilter,
		maxOverallFilter: maxOverallFilter,
		minMenuFilter: minMenuFilter,
		maxMenuFilter: maxMenuFilter
	}).always(function(resp) {
		let template = resp['template'];
		let data = resp['data'];
		let totalData = resp['totalData'];

		if(!resp || (resp.statusCode && resp.statusCode != 200) || (data && data.length == 0)) {
			$('.container .row .col-10.offset-1').eq(0).empty().append('<h5 style="margin-top:3rem">Cannot found any restaurant based on your search criteria</h5>');
			$('.itemList').hide();
			return;
		}

		// for demo purpose, we only show top 50 results. In the future, we can use pagination for large result.
		if(totalData > 50) 
			$('.container .row .col-10.offset-1').eq(0).empty().append('<h4 style="margin-top:3rem">We found ' + totalData + ' restaurants based on your criteria</h4>\
				<h6>However for this demo, we only show ' + data.length + ' restaurants.</h6>');
		else 
			$('.container .row .col-10.offset-1').eq(0).empty().append('<h4 style="margin-top:3rem">We found ' + totalData + ' restaurants based on your criteria</h4>');
		$('.itemList').empty().show();
		data.forEach(function(d) {$('.itemList').append(Mustache.render(template, d))});
	});
}

$(function(e) {
	// due to bug in the rangeSLider library, slide only created when user open
	// filter tray for the first time.
	$('#filter-body').on('shown.bs.collapse', function(e) {
		if($('.slider--horizontal').length == 0) {
			generateSliders();
		}
	})

	// change placeholder text to guide users on how to insert query search
	$('#search-type').on('change', function(e) {
		let val = $(e.target).val();
		if(val == 'timings') $('#search-input').attr('placeholder', 'Enter timings (eg: 8 - 12, 15 - 20)...');
		else if(val == 'geoloc') $('#search-input').attr('placeholder', 'Enter geolocation (eg: 1.2912,103.121)...');
		else $('#search-input').attr('placeholder', 'Enter keywords...');
	})

	// do actual search when user clicks Enter button
	$('#search-input').on('keyup', function(e) {
		if(e.keyCode == 13) $('#search-btn').click();
	})
})
