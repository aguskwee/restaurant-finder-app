<li class='col-3 vertical-align-top'>
    <div class='card'>
        <div class='item-img cursor-pointer justify-content-center align-items-center' onclick='$(this).parent().find("input[name=\"item\"]").click()'>
            <i class='fas fa-plus fa-2x'></i>
            <p>Add menu image</p>
        </div>
        <input type='file' name='item' accept='image/png, image/gif, image/jpeg' hidden />
        <div class='body'>
            <input class='item-name form-control' type='text' placeholder='Menu name' />
            <br>
            <div class='input-group'>
                <span class='input-group-text'>S$</span>
                <input class='item-price form-control' type='text' placeholder='Menu price' />
            </div>
            <br>
            <p class='error'></p>
            {{^newRestaurant}}
            <button class='btn btn-outline-dark' onclick="submitNewMenu(this);">Submit</button>
            {{/newRestaurant}}
            <button class='btn btn-outline-danger float-end' onclick='$(this).parents("li").remove()'>Delete</button>
        </div>
    </div>
</li>