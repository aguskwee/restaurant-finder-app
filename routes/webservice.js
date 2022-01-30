var express = require('express');
var router = express.Router();
var sqlite3 = require('sqlite3');
var https = require('https');
var fs = require('fs');
var config = require('../config');
var multer = require('multer');
var diskStorage = multer.diskStorage({
    destination: function(req, file, cb) {
        if(file.fieldname == 'image') {
            cb(null, './public/images/restaurants/');
        }
        else if(file.fieldname.startsWith('menu-image')) {
            cb(null, './public/images/menus/');
        }
    },
    filename: function(req, file, cb) {
        cb(null, file.fieldname + '_' + file.originalname + '_' + new Date().getTime());
    }
});
var uploadImages = multer({ storage: diskStorage });

// create folder for images, if necessary
if(!fs.existsSync('./public/images/restaurants')) fs.mkdir('./public/images/restaurants', function() {});
if(!fs.existsSync('./public/images/menus')) fs.mkdir('./public/images/menus', function() {});

// initialize db and connect to database
function initDB(callback) {
    // connect to database
    var conn = new sqlite3.Database(config.DBPATH, function(err) {
        if(err) {
            return callback(null);
        }

        console.log('Connected to restaurant-finder database.');
    });
    callback(conn);
}

// to compute a distance between 2 geolocation
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2-lat1);  // deg2rad below
    var dLon = deg2rad(lon2-lon1); 
    var a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2); 
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    var d = R * c; // Distance in km
    
    return d;
}

// to convert degree to radian
function deg2rad(deg) {
    return deg * (Math.PI/180);
}

// to generate stars for the given rating score
function generateStars(score) {
    const fullStarCount = Math.floor(score);
    let stars = [];
    for(let i = 0; i < fullStarCount; i++) stars.push('<i class="fas fa-star"></i>');
    if(score - fullStarCount >= 0.5) stars.push('<i class="fas fa-star-half"></i>');

    return stars.join('');
}

/* GET popular restaurants. */
router.get('/get-popular-restaurants', function(req, res, next) {
    // init db
    initDB(function(conn) {
        if(!conn) return res.send(null);
        let sql = 'select res.id, res.name, avg(rat.rating) rat_avg from restaurants res left join overall_ratings rat \
                on res.id = rat.restaurant_id group by res.id order by rat_avg desc limit 10';
        conn.all(sql, [], function(err, rows) {
            if(err) console.log(err.message);
            else {
                let popularRestaurants = [];
                rows.forEach(function(row) {
                    let restaurant = {restaurantId: row['id'], restaurantName: row['name']};
                    if(row['rat_avg'] != null) {
                        restaurant['restaurantScore'] = row['rat_avg'].toFixed(1);
                        stars = generateStars(row['rat_avg']);
                        restaurant['restaurantStars'] = stars;
                    }
                    
                    popularRestaurants.push(restaurant);
                });

                // get restaurant templates
                var template = fs.readFileSync(config.RESTAURANTTEMPLATE, 'utf8');

                res.send({template: template, data: popularRestaurants});
            }
        });

        conn.close();
    });
});

/* POST authenticate user */
router.post('/authenticate-user', function(req, res, next) {
    let username = req.body.email;
    let password = req.body.password;

    // init db
    initDB(function(conn) {
        if(!conn) return res.send(null);

        const SQL = 'select email, name, password from owners where email = ? and password = ?';
        conn.get(SQL, [username, password], function(err, row) {
            if(err) {
                conn.close();
                return res.send(null);
            }

            if(password != row['password']) return res.send(null);

            conn.close();

            // set cookies
            res.cookie(config.COOKIENAME, row['email'], {maxAge: 1 * 3600 * 1000});
            res.send('1');
        });
    });
});

/* POST register a new restaurant owner */
router.post('/register-new-owner', function(req, res, next) {
    let name = req.body.name;
    let email = req.body.email;
    let password = req.body.password;

    // init db
    initDB(function(conn) {
        if(!conn) return res.send(null);

        const SQL = 'insert into owners (name, email, password) values (?, ?, ?);';
        conn.run(SQL, [name, email, password], function(err) {
            conn.close();
            if(err && err['code'] == 'SQLITE_CONSTRAINT') return res.send('Oops! User exists in our database.');
            else if(err) return res.send(null);
            else return res.send('1');

        });
    });
});

/* POST get restaurants owned by a given user */
router.post('/get-owned-restaurants', function(req, res, next) {
    let email = req.body.owner;
    if(!email) return res.send(null);

    // init db
    initDB(function(conn) {
        if(!conn) return res.send(null);

        // get owned restaurants
        const SQL = 'select res.id, res.name, avg(rat.rating) rat_avg from restaurants res left join overall_ratings rat \
                on res.id = rat.restaurant_id where res.owner = ? group by res.id order by rat_avg desc limit 25';
        conn.all(SQL, [encodeURIComponent(email)], function(err, rows) {
            if(err) return res.send(null);

            let ownedRestaurants = [];
            rows.forEach(function(row) {
                let restaurant = {restaurantId: row['id'], restaurantName: row['name']};
                if(row['rat_avg'] != null) {
                    restaurant['restaurantScore'] = row['rat_avg'].toFixed(1);
                    stars = generateStars(row['rat_avg']);
                    restaurant['restaurantStars'] = stars;
                }
                    
                ownedRestaurants.push(restaurant);
            });

            // get restaurant templates
            var template = fs.readFileSync(config.RESTAURANTTEMPLATE, 'utf8');

            res.send({template: template, data: ownedRestaurants});
        });
    });
});

/* GET restaurant detail given a restaurant id */
router.get('/get-restaurant-detail/:restaurantId', function(req, res, next) {
    let restaurantId = req.params.restaurantId;

    initDB(function(conn) {
        if(!conn) return res.send(null);

        let details = {};
        let sql = 'select res.id, res.name, res.owner, res.address, res.geolocation, res.open_hour, res.close_hour, res.contact, avg(rat.rating) avg_rate from \
            restaurants res left join overall_ratings rat on res.id = rat.restaurant_id where res.id = ? group by rat.restaurant_id order by avg_rate desc;'
        conn.get(sql, [restaurantId], function(err, row) {
            if(err) return res.send(null);

            let name = row['name']
            let address = row['address']
            let geoLocation = row['geolocation']
            let openHour = row['open_hour']
            let closeHour = row['close_hour']
            let contact = row['contact']
            let overallRating = row['avg_rate']
            let owner = row['owner']
            let restaurantId = row['id']

            if(restaurantId) details['id'] = restaurantId;
            if(name) details['name'] = name;
            if(address) details['address'] = address;
            if(geoLocation) details['geoLocation'] = JSON.parse(geoLocation).join(',');
            if(openHour) details['openHour'] = openHour;
            if(closeHour) details['closeHour'] = closeHour;
            if(contact) details['contact'] = contact;
            if(overallRating) {
                details['overallScore'] = overallRating.toFixed(1);
                let stars = generateStars(overallRating);
                details['stars'] = stars;
            }
            if(owner) details['owner'] = owner;

            // get menus
            sql = 'select m.id, m.name, m.price, avg(r.rating) avg_rate from menus m left join menu_ratings r \
                on m.id = r.menu_id where m.restaurant_id = ? group by m.id order by avg_rate desc;'
            conn.all(sql, [restaurantId], function(err, rows) {
                if(err) return res.send(null);

                let menus = [];
                rows.forEach(function(row) {
                    let menuId = row['id'];
                    let menuName = row['name'];
                    let menuPrice = row['price'];
                    let menuScore = row['avg_rate'];

                    let menu = {menuId: menuId, menuName: menuName, menuPrice: menuPrice};
                    if(menuScore) {
                        menu['menuScore'] = menuScore.toFixed(1);
                        let stars = generateStars(menuScore);
                        menu['menuStars'] = stars;
                    }
                    menus.push(menu);
                });
                if(menus.length > 0) details['menus'] = menus;

                conn.close();

                let template = fs.readFileSync(config.MENUITEMTEMPLATE, 'utf8');
                let detailTemplate = fs.readFileSync(config.RESTAURANTDETAILTEMPLATE, 'utf8');

                res.send({menuTemplate: template, detailTemplate: detailTemplate, details: details});

            });
        })
    });
});

/* POST submit restaurant or menu rating */
router.post('/submit-rating', function(req, res, next) {
    let restaurantId = req.body.restaurantId;
    let menuId = req.body.menuId;
    let rating = req.body.rating;

    if(!restaurantId && !menuId && !rating) return res.send(null);

    initDB(function(conn) {
        if(!conn) return res.send(null);

        let sql = null;
        let params =  null;
        if(restaurantId && menuId && rating) {
            // menu rating
            sql = 'insert into menu_ratings (restaurant_id, menu_id, rating) values(?, ?, ?);'
            params = [restaurantId, menuId, rating];
        }
        else if(restaurantId && !menuId && rating) {
            // overall rating
            sql = 'insert into overall_ratings (restaurant_id, rating) values(?, ?);'
            params = [restaurantId, rating];
        }
        else return res.send(null);

        conn.run(sql, params, function(err) {
            if(err) return res.send(null);
            res.send('1');
        })
    });
});

/* POST geolocation from address */
router.post('/get-geolocation-from-address', function(req, res, next) {
    let addr = encodeURI(req.body.address);

    const request = https.request({
        hostname: config.GEOLOCATIONHOSTNAME,
        path: config.GEOLOCATIONPATH + addr,
        method: 'GET'
    }, function(resp) {
        resp.on('data', function(d) {
            let results = JSON.parse(d.toString('utf8'))['results'];
            if(!results || results.length == 0) return res.send(null);

            // get first result only
            let lat = results[0]['LATITUDE'], lng = results[0]['LONGITUDE'];
            if(!lat || !lng) return res.send(null);
            res.send({'lat': lat, 'lng': lng});
        });
    });

    request.on('error', function(err) {
        res.send(null);
    })

    request.end();
});

/* POST register a new restaurant */
router.post('/register-new-restaurant', uploadImages.any(), function(req, res, next) {
    let email = req.body.email,
        name = req.body.name,
        openHour = req.body.openHour,
        closeHour = req.body.closeHour,
        contact = req.body.contact,
        address = req.body.address,
        geoLocation = req.body.geoLocation,
        menus = req.body.menus;
        if(menus) {
            try {
                menus = JSON.parse(menus);
            }catch(e) {
                menus = null;
            }
        }

    if(geoLocation) geoLocation = JSON.stringify(geoLocation.split(','));

    initDB(function(conn) {
        if(!conn) return res.send(null);

        let sql = 'insert into restaurants (name, address, geolocation, open_hour, close_hour, contact, owner) values(?, ?, ?, ?, ?, ?, ?)';
        conn.run(sql, [name, address, geoLocation, openHour, closeHour, contact, email], function(err) {
            if(err) return res.send(null);

            // get image path
            let imagePaths = {};
            // change image name
            if(req.files) req.files.forEach(function(f) {imagePaths[f.fieldname] = {'path': f.path, 'destination': f.destination}});

            // if there is a menu, save it
            let restaurantId = this.lastID;
            if(imagePaths['image']) fs.renameSync(imagePaths['image']['path'], imagePaths['image']['destination'] + restaurantId + '.png');
            sql = 'insert into menus (restaurant_id, name, price) values(?, ?, ?)';
            if(menus && menus.length > 0) {
                conn.serialize(function() {
                    menus.forEach(function(menu) {
                        conn.run(sql, [restaurantId, menu['name'], menu['price']], function(err) {
                            if(err) console.log(err);

                            let path = imagePaths['menu-image' + menu['menu-img-id']];
                            if(path) fs.renameSync(path['path'], path['destination'] + this.lastID + '.png');
                        });
                    });
                });
            }

            res.send(restaurantId.toString());
        });
    });
});

/* GET add new menu template */
router.get('/get-new-menu-template', function(req, res, next) {
    let template = fs.readFileSync(config.ADDMENUITEMTEMPLATE, 'utf8')
    res.send(template);
});

/* POST add a new menu */
router.post('/submit-new-menu', uploadImages.single('menu-image'), function(req, res, next) {
    let name = req.body.name,
        price = req.body.price,
        restaurantId = req.body.restaurantId;

    initDB(function(conn) {
        if(!conn) return res.send(null);

        let sql = 'insert into menus (restaurant_id, name, price) values(?, ?, ?);'
        conn.run(sql, [restaurantId, name, price], function(err) {
            if(err) return res.send(null);

            let menuId = this.lastID;
            // change image
            if(req.file && req.file.path) fs.renameSync(req.file.path, req.file.destination + menuId + '.png');

            res.send('1');
        });
    })
});

/* POST search restaurants based on the given criteria */
router.post('/search', function(req, res, next) {
    let type = req.body.type;
    let query = req.body.query;
    let minOverallFilter = req.body.minOverallFilter;
    let maxOverallFilter = req.body.maxOverallFilter;
    let minMenuFilter = req.body.minMenuFilter;
    let maxMenuFilter = req.body.maxMenuFilter;

    let sql = ''
    let params = [];
    switch(type) {
        case 'name':
            sql = 'select res.id, res.name, avg(rat.rating) as overall_rate from restaurants res \
                left join overall_ratings rat on res.id = rat.restaurant_id where res.name like ? \
                group by res.id order by overall_rate desc;';
            params = ['%' + query + '%'];
            break;

        case 'address':
            sql = 'select res.id, res.name, avg(rat.rating) as overall_rate from restaurants res \
                left join overall_ratings rat on res.id = rat.restaurant_id where res.address like ? \
                group by res.id order by overall_rate desc;';
            params = ['%' + query + '%'];
            break;

        case 'geoloc':
            sql = 'select res.id, res.name, res.geolocation, avg(rat.rating) as overall_rate from restaurants res \
                left join overall_ratings rat on res.id = rat.restaurant_id group by res.id order by \
                overall_rate desc;';
            params = [];
            break;

        case 'timings':
            // split timing to open and close hour
            hours = query.split('-')
            if(hours.length == 2 && !isNaN(hours[0]) && !isNaN(hours[1]) && +hours[0] >= 0 && +hours[1] < 24 && +hours[0] < +hours[1]) {
                sql = 'select res.id, res.name, avg(rat.rating) as overall_rate from restaurants res \
                    left join overall_ratings rat on res.id = rat.restaurant_id where res.open_hour >= ? and res.close_hour <= ? \
                    group by res.id order by overall_rate desc;';
                params = [+hours[0], +hours[1]];
            }
            break;

        case 'food':
            sql = 'select res.id, res.name, avg(rat.rating) as overall_rate from restaurants res left join \
                menus menu on res.id = menu.restaurant_id left join overall_ratings rat on res.id = rat.restaurant_id \
                where menu.name like ? group by res.id order by overall_rate desc;';
            params = ['%' + query + '%']
            break;

        default:
            return res.send(null);
    }

    if(sql == '') return res.send(null); // invalid query

    initDB(function(conn) {
        if(!conn) return res.send(null);

        conn.all(sql, params, function(err, rows) {
            if(err) res.send(null);

            restaurants = [];
            rows.forEach(function(row) {
                let id = row['id'];
                let name = row['name'];
                let overallRating = row['overall_rate'] ? row['overall_rate'] : 0;
                let restaurant = {restaurantId: id, restaurantName: name};

                // filter restaurant based on overall ratings
                if(overallRating < minOverallFilter || overallRating > maxOverallFilter) return;

                if(overallRating > 0) {
                    let stars = generateStars(overallRating);
                    restaurant['restaurantScore'] = overallRating;
                    restaurant['restaurantStars'] = stars;
                }

                if(type == 'geoloc') {
                    let geoLocation = row['geolocation'];
                    restaurant['restaurantGeoLocation'] = geoLocation;
                }

                restaurants.push(restaurant);
            });

            // filtered out restaurant based on distnace for geocode type query
            if(type == 'geoloc') {
                let lat = +query.split(',')[0];
                let lon = +query.split(',')[1];

                proximityRestaurants = [];
                restaurants.forEach(function(restaurant) {
                    if(restaurant['restaurantGeoLocation'] == null) return;

                    try {
                        let geoloc = JSON.parse(restaurant['restaurantGeoLocation']);

                        let d = getDistanceFromLatLonInKm(lat, lon, geoloc[0], geoloc[1]);
                        if(d <= config.GEOLOCATIONDISTANCE) proximityRestaurants.push(restaurant);
                    }catch(e) {}
                });

                // replace original restaurants array
                restaurants = proximityRestaurants.slice(0);
            }

            // another round of sql query to get menus rating based on the restaurants
            sql = 'select res.id, avg(rat.rating) as menu_rate from restaurants res left join menu_ratings rat on res.id = rat.restaurant_id \
                group by res.id';
            conn.all(sql, [], function(err, rows) {
                if(err) return res.send(null);

                restaurantMapping = {};
                restaurants.forEach(function(restaurant) {
                    restaurantMapping[restaurant['restaurantId']] = restaurant;
                });

                filteredRestaurants = [];
                rows.forEach(function(row) {
                    let restaurantId = row['id'];
                    let rating = row['menu_rate'] ? +row['menu_rate'] : 0;
                    if(rating < minMenuFilter || rating > maxMenuFilter) return;

                    // if this restaurant exists in the restaurantMapping; then, add to filteredRestaurant
                    // as this means that this restaurant match all filtering criteria
                    if(restaurantMapping[restaurantId] != null) filteredRestaurants.push(restaurantMapping[restaurantId]);
                });

                // sorted based on the overall rating
                filteredRestaurants.sort(function(a, b) {return b['restaurantScore'] - a['restaurantScore']});
                let totalData = filteredRestaurants.length;

                // for this demo purpose, we only show 50 results
                filteredRestaurants = filteredRestaurants.slice(0, 50);

                let template = fs.readFileSync(config.RESTAURANTTEMPLATE, 'utf8');
                res.send({template: template, data: filteredRestaurants, totalData: totalData});
            });
        });
    });
});

module.exports = router;
