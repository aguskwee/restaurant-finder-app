<li class='col-3' title='Click to see more details' onclick='window.location="/restaurant/{{ restaurantId }}"'>
    <div class='card'>
        <img src='/images/restaurants/{{ restaurantId }}.png' onerror='this.src="/images/restaurant-not-found.png"' style="max-height:350px" />
        <div class='body'>
            <h4>{{ restaurantName }}</h4>
            {{ #restaurantScore }}
            <div class='rating'>
                {{{ restaurantStars }}}
                <span class='score'>{{ restaurantScore }}</span>
            </div>
            {{ /restaurantScore }}
        </div>
    </div>
</li>