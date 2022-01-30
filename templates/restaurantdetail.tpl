<div class='col-3 offset-1'>
    <img id='restaurant-img' src='/images/restaurants/{{ id }}.png' onerror='this.src="/images/restaurant-not-found.png"' width='100%' />
</div>
<div class='col-7 ps-4'>
    <input type='hidden' value='{{ id }}' />
    <h4>{{ name }}</h4>
    {{ #overallScore }}
    <div class='star-div'>
        {{{ stars }}}
        <span>{{ overallScore }}</span>
        <button class='btn btn-sm btn-outline-warning' data-bs-toggle='popover' data-bs-placement='bottom' content-id='popover-restaurant' title='Rate this restaurant'>Rate this restaurant</button>
        <div id='popover-restaurant' hidden>
            <i class='far fa-star' onclick='clickStar(1, this)'></i>
            <i class='far fa-star' onclick='clickStar(2, this)'></i>
            <i class='far fa-star' onclick='clickStar(3, this)'></i>
            <i class='far fa-star' onclick='clickStar(4, this)'></i>
            <i class='far fa-star' onclick='clickStar(5, this)'></i>
            <p class='error'>Error submitting feedback!</p>
            <button class='btn btn-sm btn-outline-warning' onclick='submitRating(this)'>Submit</button>
        </div>
    </div>
    {{ /overallScore }}
    {{ ^overallScore }}
    <div class='star-div'>
        <button class='btn btn-sm btn-outline-warning' data-bs-toggle='popover' data-bs-placement='bottom' content-id='popover-restaurant' title='Rate this restaurant' style="margin-left: 0">Be the first to rate this restaurant</button>
        <div id='popover-restaurant' hidden>
            <i class='far fa-star' onclick='clickStar(1, this)'></i>
            <i class='far fa-star' onclick='clickStar(2, this)'></i>
            <i class='far fa-star' onclick='clickStar(3, this)'></i>
            <i class='far fa-star' onclick='clickStar(4, this)'></i>
            <i class='far fa-star' onclick='clickStar(5, this)'></i>
            <p class='error'>Error submitting feedback!</p>
            <button class='btn btn-sm btn-outline-warning' onclick='submitRating(this)'>Submit</button>
        </div>
    </div>
    {{ /overallScore }}
    {{ #openHour }}
    <p>
        <i class='fas fa-clock margin-right'></i>
        {{ openHour }}

        {{ #closeHour }}
        - {{ closeHour }}
        {{ /closeHour }}
    </p>
    {{ /openHour }}
    {{ #contact }}
    <p>
        <i class='fas fa-phone margin-right'></i>
        {{ contact }}
    </p>
    {{ /contact }}
    {{ #address }}
    <p>
        <i class='fas fa-map-marker-alt margin-right-extra'></i>
        {{ address }}
    </p>
    {{ /address }}
    {{ #geoLocation }}
    <a href='https://google.com.sg/maps/place/{{ geoLocation }}' target='_blank'>Show restaurant on map</a>
    {{ /geoLocation }}
</div>