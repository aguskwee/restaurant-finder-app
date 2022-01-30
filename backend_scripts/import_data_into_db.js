// import the library
var sqlite3 = require('sqlite3').verbose();
var fs = require('fs');
var config = require('../config')

// database path
const DB_PATH = '../' + config.DBPATH;

function generate_ratings() {
    let ratings = [];
    while(ratings.length < 5){
        let r = Math.floor(Math.random() * 5) + 1;
        ratings.push(r);
    }

    return ratings;
}

function pick_menu() {
    const menus = ['Beef Kway Teow', 'Beef noodle soup', 'Mee pok','Banmian','Char kway teow','Crab been hoon','Fish soup bee hoon','Hokkien mee','Kwetiau goreng','Shredded chicken noodles','Vegetarian bee hoon','Mee rebus','Mee siam','Mee soto','Katong Laksa','Mee goreng','Satay bee hoon','Hainanese Curry Rice','Bak kut teh','Chai tow kway','Drunken prawn','Char siu','Duck rice','Har Cheong Gai','Sliced fish soup','Teochew Porridge','Ayam penyet','Nasi goreng','Satay','Soto ayam','Fish head curry','Black pepper crab','Chilli crab','Roti john','Ice kachang','Cendol','Bandung (drink)','Chin chow drink', 'Milo dinosaur', 'Teh tarik']
    let pickMenus = [];
    for(let i = 0; i < 10; i++) {
        let item = menus[Math.floor(Math.random() * menus.length)];
        if(pickMenus.indexOf(item) != -1) i--; // menu has been picked up previously
        else pickMenus.push([item, Math.round(3 + Math.random() * 7)]); // generate random price between 3 - 10
    }

    return pickMenus;
}

function insert_toy_dataset(email) {
    // open toy dataset and insert into database
    let content = fs.readFileSync('restaurants.geojson');
    content = JSON.parse(content);
    
    const FEATURES = content['features'];
    const SQL = 'insert into restaurants (name, address, geolocation, open_hour, close_hour, contact, owner) \
                values(?, ?, ?, ?, ?, ?, ?)';

    for(let feature of FEATURES) {
        let properties = feature['properties'];
        let lat = feature['geometry']['coordinates'][1];
        let lng = feature['geometry']['coordinates'][0];
        let name = properties['NAME'];
        let buildingName = properties['ADDRESSBUILDINGNAME'] ? properties['ADDRESSBUILDINGNAME'] : '';
        let blockNumber = properties['ADDRESSBLOCKHOUSENUMBER'] ? properties['ADDRESSBLOCKHOUSENUMBER'] : '';
        let streetName = properties['ADDRESSSTREETNAME'] ? properties['ADDRESSSTREETNAME'] : '';
        let unitNumber = properties['ADDRESSUNITNUMBER'] ? properties['ADDRESSUNITNUMBER'] : '';
        let postalCode = properties['ADDRESSPOSTALCODE'] ? properties['ADDRESSPOSTALCODE'] : '';
        let addr = '';
        if(buildingName != '') addr = buildingName + ' - ';
        if(blockNumber != '') addr += blockNumber + ' ';
        if(streetName != '') addr += streetName + ' ' ;
        if(unitNumber != '') addr += '#' + unitNumber;
        if(postalCode != '') addr += ', S' + postalCode;

        // to generate random operating timing and contact number
        let open_hour = Math.round(6 + Math.random() * 5);
        let close_hour = Math.round(15 + Math.random() * 7);
        let contact = Math.round(60000000 + Math.round() * 1999999); 
        conn.run(SQL, [name, addr, JSON.stringify([lat, lng]), open_hour, close_hour, contact, email], function(err) {
            if(err) console.log(err.message);

            let restaurantId = this.lastID;

            // randomly generate ratings
            let ratings = generate_ratings();
            ratings.forEach(function(rating) {
                let sql = 'insert into overall_ratings (restaurant_id, rating) values(?, ?);';
                conn.run(sql, [restaurantId, rating]);
            });

            // randomly pick 5 dishes
            let menus = pick_menu();

            // insert menus into db
            
            const MENU_SQL = 'insert into menus (restaurant_id, name, price) values (?, ?, ?);';
            for(let menu of menus) {
                conn.run(MENU_SQL, [restaurantId, menu[0], menu[1]], function(err) {
                    if(err) console.log(err.message);
                    else {
                        let menuId = this.lastID;
                        let ratings = generate_ratings();
                        ratings.forEach(function(rating) {
                            let sql = 'insert into menu_ratings (restaurant_id, menu_id, rating) values(?, ?, ?);';
                            conn.run(sql, [restaurantId, menuId, rating]);
                        });
                    }
                });
            }
        });
    }
}

// check database existance
if(fs.existsSync(DB_PATH)) {
    console.log('Database exists. Please delete the db or change the DB_PATH!');
    //return;
}

// connect to database
var conn = new sqlite3.Database(DB_PATH, function(err) {
    if(err) {
        console.log(err.message);
        return;
    }

    console.log('Connected to restaurant-finder database.');
});

// create necessary tables
// 1. restaurant owners table
sql = 'create table owners (\
        email text primary key, \
        name text not null, \
        password text not null, \
        created_at timestamp default current_timestamp);';
conn.run(sql, function(err) {
    if(err) {
        console.log(err.message);
        return;
    }
    console.log('owners table is created!');

    // 2. restaurants table
    sql = 'create table restaurants ( \
            id integer primary key autoincrement, \
            name text not null, \
            address text not null, \
            open_hour integer, \
            close_hour integer, \
            contact text, \
            geolocation text not null, \
            owner text not null, \
            created_at timestamp default current_timestamp, \
            constraint fk_owners \
            foreign key (owner) \
            references owners(email));';
    conn.run(sql, function(err) {
        if(err) {
            console.log(err.message);
            return;
        }
        console.log('restaurants table is created!');

        // 3. menus table
        sql = 'create table menus ( \
                id integer primary key autoincrement, \
                restaurant_id integer not null, \
                name text not null, \
                price real, \
                created_at timestamp default current_timestamp, \
                constraint fk_restaurant \
                foreign key (restaurant_id) \
                references restaurants(id));';
        conn.run(sql, function(err) {
            if(err) {
                console.log(err.message);
                return;
            }
            console.log('menus table is created!');

            // 4. overall ratings table
            sql = 'create table overall_ratings (\
                    id integer primary key autoincrement, \
                    restaurant_id integer not null, \
                    rating integer not null, \
                    created_at timestamp default current_timestamp, \
                    constraint fk_overall_rating_restaurants \
                    foreign key (restaurant_id) \
                    references restaurants(id));';
            conn.run(sql, function(err) {
                if(err) {
                    console.log(err.message);
                    return;
                }
                console.log('overall_ratings table is created!');

                // 5. menu ratings table
                sql = 'create table menu_ratings (\
                        id integer primary key autoincrement, \
                        restaurant_id integer not null, \
                        menu_id integer not null, \
                        rating integer not null, \
                        created_at timestamp default current_timestamp, \
                        constraint fk_menu_rating_restaurant \
                        foreign key (restaurant_id) \
                        references restaurants(restaurant_id), \
                        constraint fk_menu_rating_menu \
                        foreign key (menu_id) \
                        references menus(id));';
                conn.run(sql, function(err) {
                    if(err) {
                        console.log(err.message);
                        return;
                    }
                    console.log('menu_ratings table is created!');

                    // insert admin owner
                    sql = 'insert into owners (name, email, password) values ("Agus Kwee", "atkwee@gmail.com", "c93ccd78b2076528346216b3b2f701e6")';
                    conn.run(sql, function(err) {
                        if(err) {
                            console.log('Error inserting admin user into table!');
                            return;
                        }
                        // insert data into db
                        insert_toy_dataset("atkwee@gmail.com");
                    });
                });
            });
        });
    });
});

// close connection
conn.close();
