<li class='col-3'>
    <div class='card'>
        <img src='/images/menus/{{ menuId }}.png' onerror='this.src="/images/food-not-found.png"' height='257px' />
        <div class='body'>
            <h4>{{ menuName }}</h4>
            {{ #menuScore }}
            <div class='rating'>
                {{{ menuStars }}}
                <span class='score'>{{ menuScore }}</span>
            </div>
            {{ /menuScore }}
            <p class='price'>S${{ menuPrice }}</p>
            <button class='btn btn-outline-warning btn-sm' data-bs-toggle='popover' data-bs-placement='bottom' content-id='popover-menu-{{ menuId }}' title='Rate this menu'>Rate this menu</button>
            <div id='popover-menu-{{ menuId }}' hidden>
                <i class='far fa-star' onclick='clickStar(1, this)'></i>
                <i class='far fa-star' onclick='clickStar(2, this)'></i>
                <i class='far fa-star' onclick='clickStar(3, this)'></i>
                <i class='far fa-star' onclick='clickStar(4, this)'></i>
                <i class='far fa-star' onclick='clickStar(5, this)'></i>
                <p class='error'>Error submitting feedback!</p>
                <button class='btn btn-sm btn-outline-warning' onclick='submitRating(this, "{{ menuId }}")'>Submit</button>
            </div>
        </div>
    </div>
</li>