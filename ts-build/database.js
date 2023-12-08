"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataBase = void 0;
const crypto = __importStar(require("crypto"));
const mysql = __importStar(require("mysql2"));
function genHash(password) {
    var hash = crypto.createHash("sha256").update(password).digest("hex");
    return hash;
}
class DataBase {
    constructor() {
        this.database = mysql.createPool({
            user: "root",
            password: "password",
            database: "uber",
            connectionLimit: 10,
            multipleStatements: false, // beware of SQL injection if true
        });
        this.createTables();
    }
    createTables() {
        this.database.query(`CREATE TABLE IF NOT EXISTS users(
                UID INTEGER NOT NULL PRIMARY KEY AUTO_INCREMENT,
                account varchar(50) BINARY NOT NULL UNIQUE,
                password varchar(64) NOT NULL,
                name varchar(50) NOT NULL,
                identity char(1),
                wallet INT UNSIGNED ,
                latitude FLOAT(18,14),
                longitude FLOAT(18,14),
                phone char(10)
             );`); // 'c': client 's':shop owner
        this.database.query(`CREATE TABLE IF NOT EXISTS shops(
                SID INTEGER NOT NULL PRIMARY KEY AUTO_INCREMENT,
                UID INTEGER NOT NULL,
                shopname varchar(50) NOT NULL,
                category varchar(50),
                latitude FLOAT(8,5),
                longitude FLOAT(8,5),
                location geometry NOT NULL,
                phone char(10),
                CONSTRAINT shops_ibfk_1 FOREIGN KEY (UID) 
                REFERENCES users(UID) ON DELETE CASCADE
             );`);
        this.database.query(`CREATE TABLE IF NOT EXISTS products(
                PID INTEGER NOT NULL PRIMARY KEY AUTO_INCREMENT,
                SID INTEGER NOT NULL ,
                mealname varchar(50) NOT NULL,
                price INTEGER NOT NULL,
                quantity INTEGER NOT NULL,
                image varchar(60) NOT NULL
             );`);
        this.database.query(`CREATE TABLE IF NOT EXISTS tradeRecords(
                 RID INTEGER NOT NULL PRIMARY KEY AUTO_INCREMENT,
                 UID INTEGER NOT NULL,
                 action varchar(10) NOT NULL,
                 time varchar(40) NOT NULL,
                 trader char(20) NOT NULL,
                 amount_change INTEGER NOT NULL
              );`);
        // use NOW() in the insert query to represent current time!
        // "N": Not finished, "F": Finished, "C": cancel
        this.database.query(`CREATE TABLE IF NOT EXISTS orders(
                OID INTEGER NOT NULL PRIMARY KEY AUTO_INCREMENT,
                UID INTEGER  NOT NULL,
                SID INTEGER  NOT NULL,
                status char(1)  NOT NULL,
                distance INT  NOT NULL,
                subtotal INT NOT NULL NOT NULL,
                fee INT NOT NULL NOT NULL,
                foodType varchar(20)  NOT NULL,
                start varchar(40) NOT NULL,
                end varchar(40)
              );`);
        this.database.query(`CREATE TABLE IF NOT EXISTS includes(
                 OID INTEGER NOT NULL,
                 PID INTEGER NOT NULL,
                 price INTEGER NOT NULL,
                 amount INTEGER NOT NULL,
                 image varchar(60) NOT NULL,
                 mealname varchar(50) NOT NULL,
                 PRIMARY KEY(OID,PID)
              );`);
    }
    // log in 
    checkpassword(account, password) {
        return __awaiter(this, void 0, void 0, function* () {
            let [results, _] = yield this.database.promise().execute(`SELECT account, password, UID FROM users
              where account = ? and password = ?;`, [account, genHash(password)]);
            return results;
        });
    }
    // register 
    accountused(account) {
        return __awaiter(this, void 0, void 0, function* () {
            //check if account is used
            let [results, _] = yield this.database.promise().execute(`SELECT account FROM users
                where account = ? ;`, [account]);
            return results.length == 1;
        });
    }
    validuser(account, name, password, re_password, phone, latitude, longitude) {
        return __awaiter(this, void 0, void 0, function* () {
            let check = "";
            //name
            if (!name.length)
                check += "You need to enter your name\n";
            else {
                for (let x of name) {
                    let ascii = x.charCodeAt(0);
                    if (!((ascii > 64 && ascii < 91) || (ascii > 96 && ascii < 123))) {
                        check += "Invalid input for name\n";
                        break;
                    }
                }
            }
            //account
            if (!account.length)
                check += "You need to enter your account\n";
            else {
                if (yield this.accountused(account))
                    check += "Account used\n";
                for (let x of account) {
                    let ascii = x.charCodeAt(0);
                    if (!((ascii > 64 && ascii < 91) || (ascii > 96 && ascii < 123) || (ascii > 47 && ascii < 58))) {
                        check += "invalid input for account\n";
                        break;
                    }
                }
            }
            //password
            if (!password.length)
                check += "You need to enter your password\n";
            else {
                for (let x of account) {
                    let ascii = x.charCodeAt(0);
                    if (!((ascii > 64 && ascii < 91) || (ascii > 96 && ascii < 123) || (ascii > 47 && ascii < 58))) {
                        check += "Invalid input for password\n";
                        break;
                    }
                }
            }
            //phone
            if (!phone.length)
                check += "You need to enter your phone number\n";
            else if (phone.length != 10)
                check += "Invalid input for phone\n";
            else {
                for (let x of phone) {
                    let ascii = x.charCodeAt(0);
                    if (!(ascii > 47 && ascii < 58))
                        check += "Invalid input for phone\n";
                    break;
                }
            }
            //latitude
            if (!latitude.length)
                check += "latitude feild required\n";
            else if (isNaN(Number(latitude)) || Number(latitude) > 90 || Number(latitude) < -90)
                check += "invalid input for latitude\n";
            //longitude
            if (!longitude.length)
                check += "longitude feild required\n";
            else if (isNaN(Number(longitude)) || Number(longitude) > 180 || Number(longitude) < -180)
                check += "invalid input for longitude\n";
            //check password correct
            if (password != re_password)
                check += "re_password is not the same QAQ";
            return check;
        });
    }
    register(account, name, password, phone, latitude, longitude) {
        return __awaiter(this, void 0, void 0, function* () {
            this.database.promise().execute('INSERT into users values(0,?,?,?,?,?,?,?,?)', [account, genHash(password), name, 'c', 0, latitude, longitude, phone]);
        });
    }
    check_account_used(account) {
        return __awaiter(this, void 0, void 0, function* () {
            var result = (yield this.database.promise().execute(`SELECT * FROM users WHERE account = ?;`, [account]));
            return result[0];
        });
    }
    // shop 
    shopused(shopname) {
        return __awaiter(this, void 0, void 0, function* () {
            //check if shopname is used
            let [results, _] = yield this.database.promise().execute(`SELECT shopname FROM shops
                where shopname = ? ;`, [shopname]);
            return results.length == 1;
        });
    }
    validshop(account, shopname, category, latitude, longitude) {
        return __awaiter(this, void 0, void 0, function* () {
            let message = "";
            let [result, _] = yield this.getInfo(account);
            if (result.identity === "s")
                message += "you've reached your max shop register\n";
            // shopname
            if (!shopname.length)
                message += "shopname field required\n";
            else if (yield this.shopused(shopname))
                message += "this shopname has been used\n";
            //category 
            if (!category.length)
                message += "category feild required\n";
            //latitude
            if (!latitude.length)
                message += "latitude feild required\n";
            else if (isNaN(Number(latitude)) || Number(latitude) > 90 || Number(latitude) < -90)
                message += "invalid input for latitude\n";
            //longitude
            if (!longitude.length)
                message += "longitude feild required\n";
            else if (isNaN(Number(longitude)) || Number(longitude) > 180 || Number(longitude) < -180)
                message += "invalid input for longitude\n";
            console.log(message);
            return message;
        });
    }
    registershop(account, shopname, category, longitude, latitude) {
        return __awaiter(this, void 0, void 0, function* () {
            let [result, _] = yield this.getInfo(account);
            this.database.promise().execute(`INSERT into shops values(?,?,?,?,?,?,ST_GeomFromText(?),?);`, [0, result.UID, shopname, category, latitude, longitude,
                "POINT(" + longitude + " " + latitude + ")",
                result.phone]);
            this.database.promise().execute(`UPDATE users SET identity = "s" WHERE account =?;`, [account]);
        });
    }
    delete_product(account, mealname) {
        return __awaiter(this, void 0, void 0, function* () {
            let q = yield this.getShopInfo(account);
            yield this.database.promise().execute(`DELETE FROM products 
            WHERE mealname = ? AND SID = ?;`, [mealname, q[0].SID]);
        });
    }
    edit_product(account, mealname, price, quantity) {
        return __awaiter(this, void 0, void 0, function* () {
            let mes = "";
            let q = yield this.getShopInfo(account);
            if (!price.length)
                mes += "Please enter price\n";
            else if (isNaN(Number(price)) || Number(price) % 1)
                mes += "Invalid input for price\n";
            if (!quantity.length)
                mes += "Please enter quantity";
            else if (isNaN(Number(quantity)) || Number(quantity) % 1)
                mes += "Invalid input for quantity\n";
            if (mes == "") {
                yield this.database.promise().execute(`UPDATE products SET price=?, quantity=? WHERE SID =? and mealname=?;`, [price, quantity, q[0].SID, mealname]);
            }
            return mes;
        });
    }
    validProduct(mealname, price, quantity, image) {
        // mealname
        let mes = "";
        if (!mealname.length)
            mes += "mealname feild required\n";
        // image
        if (image === undefined)
            mes += "image feild required\n";
        // price
        if (!price.length)
            mes += "please enter price for product\n";
        else if ((Number(price) % 1 !== 0) || (Number(price) < 0))
            mes += "invalid input for price\n";
        // quantity
        if (!quantity.length)
            mes += "please enter quantity for product\n";
        else if ((Number(quantity) % 1 !== 0) || (Number(quantity) < 0))
            mes += "invalid input for quantity\n";
        return mes;
    }
    regProduct(account, mealname, price, quantity, image) {
        return __awaiter(this, void 0, void 0, function* () {
            let mes = "";
            let id = yield this.getInfo(account);
            if (id[0].identity === "c") {
                mes += "You are not a shop owner QAQ\n Register shop to continue";
                return mes;
            }
            let [q, _] = yield this.database.promise().execute(`SELECT PID 
              FROM shops NATURAL JOIN products,users 
              where shops.UID=users.UID and account = ? and mealname=?;`, [account, mealname]);
            if (q.length)
                mes += "Product name already used\n";
            mes += this.validProduct(mealname, price, quantity, image);
            if (mes === "") {
                let q = yield this.getShopInfo(account);
                yield this.database.promise().execute('INSERT into products values(0,?,?,?,?,?);', [q[0].SID, mealname, Number(price), Number(quantity), String(image)]);
            }
            return mes;
        });
    }
    getProduct(account) {
        return __awaiter(this, void 0, void 0, function* () {
            let [result, _] = yield this.database.promise().execute(`SELECT mealname, price, quantity, image 
              FROM shops NATURAL JOIN products,users 
              where shops.UID=users.UID and account = ? ;`, [account]);
            return result;
        });
    }
    getShopInfo(account) {
        return __awaiter(this, void 0, void 0, function* () {
            let [result, _] = yield this.database.promise().execute(`SELECT SID, shopname, category, shops.latitude, shops.longitude 
              FROM shops, users
              where shops.UID = users.UID and account = ? ;`, [account]);
            return result;
        });
    }
    check_name_used(name) {
        return __awaiter(this, void 0, void 0, function* () {
            var result = (yield this.database.promise().execute(`SELECT * FROM shops WHERE shopname = ?;`, [name]));
            return result[0];
        });
    }
    // home
    getInfo(account) {
        return __awaiter(this, void 0, void 0, function* () {
            let [result, _] = yield this.database.promise().execute(`SELECT UID, name, phone, identity, wallet, latitude, longitude 
            FROM users
            where account = ? ;`, [account]);
            return result;
        });
    }
    edit_location(account, latitude, longitude) {
        return __awaiter(this, void 0, void 0, function* () {
            let check = "";
            if (!latitude.length)
                check += "latitude feild required\n";
            else if (isNaN(Number(latitude)) ||
                Number(latitude) > 90 ||
                Number(latitude) < -90)
                check += "invalid input for latitude\n";
            if (!longitude.length)
                check += "longitude feild required\n";
            else if (isNaN(Number(longitude)) ||
                Number(longitude) > 180 ||
                Number(longitude) < -180)
                check += "invalid input for longitude\n";
            if (check != "")
                return check;
            check = "s";
            this.database.promise().execute(`UPDATE users 
            SET latitude = ?, longitude = ? 
            WHERE account = ?;`, [latitude, longitude, account]);
            return check;
        });
    }
    search_shop(account, name, distance, price_down, price_up, meal, category, name_sort, cat_sort, dis_sort) {
        return __awaiter(this, void 0, void 0, function* () {
            var check = "";
            var [user_info, _] = yield this.getInfo(account);
            var near = 40000, medium = 500000, far = 10000000;
            var my_name, my_dis_d, my_dis_u, my_p_d, my_p_u, my_meal, my_cat;
            if (name.length === 0)
                my_name = "";
            else
                my_name = name;
            if (name === undefined)
                my_name = "";
            else
                my_name = name;
            if (distance === "far") {
                my_dis_u = far;
                my_dis_d = medium;
            }
            else if (distance === "medium") {
                my_dis_u = medium;
                my_dis_d = near;
            }
            else {
                my_dis_u = near;
                my_dis_d = 0;
            }
            if (price_down.length === 0)
                my_p_d = 0;
            else if (isNaN(price_down))
                return "d";
            else
                my_p_d = price_down;
            if (price_up.length === 0)
                my_p_u = 1000000;
            else if (isNaN(price_up))
                return "u";
            else
                my_p_u = price_up;
            if (my_p_d > my_p_u) {
                var tem = my_p_d;
                my_p_d = my_p_u;
                my_p_u = tem;
            }
            if (meal.length === 0)
                my_meal = "";
            else
                my_meal = meal;
            if (category.length === 0)
                my_cat = "";
            else
                my_cat = category;
            var from_database = "", where_condi;
            if (price_down.length == 0
                && price_up.length == 0
                && meal.length == 0) {
                from_database = `FROM shops `;
                where_condi
                    = `WHERE shopname like ? 
                AND category like ? 
                AND ST_Distance_Sphere(POINT(?,?),location) BETWEEN ? AND ? `;
            }
            else {
                from_database
                    = `FROM (SELECT DISTINCT shops.SID 
                    FROM shops natural join products
                    WHERE products.price BETWEEN ` + my_p_d + ` AND ` + my_p_u +
                        `   AND products.mealname like ` + ("'%" + my_meal + "%'") + ` ) as se, shops `;
                where_condi
                    = `WHERE se.SID = shops.SID
                AND shopname like ? 
                AND category like ? 
                AND ST_Distance_Sphere(POINT(?,?), location) BETWEEN ? AND ? `;
            }
            var query = `SELECT shops.SID, shopname, category, ST_Distance_Sphere(POINT(?,?),location) AS distant ` + from_database + where_condi;
            if (name.length === 0) {
                if (category.length === 0) {
                    query += ` ORDER BY ST_Distance_Sphere(POINT(?,?),location)`;
                    if (dis_sort)
                        query += ` desc`;
                    query += `, shopname`;
                    if (name_sort)
                        query += ` desc`;
                    query += `,category `;
                    if (cat_sort)
                        query += ` desc`;
                    query += `;`;
                }
                else {
                    query += ` ORDER BY category`;
                    if (cat_sort)
                        query += ` desc`;
                    query += `,shopname`;
                    if (name_sort)
                        query += ` desc`;
                    query += `,ST_Distance_Sphere(POINT(?,?),location)`;
                    if (dis_sort)
                        query += ` desc`;
                    query += `;`;
                }
            }
            else {
                query += ` ORDER BY shopname`;
                if (name_sort)
                    query += ` desc`;
                query += `,category `;
                if (cat_sort)
                    query += ` desc`;
                query += `,ST_Distance_Sphere(POINT(?,?),location)`;
                if (dis_sort)
                    query += ` desc`;
                query += `;`;
            }
            var result = yield this.database.promise().execute(query, [user_info.longitude, user_info.latitude,
                "%" + my_name + "%", "%" + my_cat + "%",
                user_info.longitude, user_info.latitude, my_dis_d, my_dis_u,
                user_info.longitude, user_info.latitude
            ]);
            return result[0];
        });
    }
    load_product_info(SID) {
        return __awaiter(this, void 0, void 0, function* () {
            var result = yield this.database.promise().execute(`SELECT mealname, price, quantity, image 
            FROM products natural join shops
            WHERE shops.SID = ?;`, [SID]);
            return result[0];
        });
    }
    // home order
    search_product(SID) {
        return __awaiter(this, void 0, void 0, function* () {
            var result = (yield this.database.promise().execute(`SELECT * 
            FROM shops NATURAL JOIN products
            WHERE shops.SID = ? AND shops.SID = products.SID;`, [SID]));
            return result;
        });
    }
    Add_value(account, value) {
        return __awaiter(this, void 0, void 0, function* () {
            var user = (yield this.database.promise().execute(`SELECT UID, name FROM users WHERE account = ?;`, [account]));
            yield this.Add_tradeRecords(user[0][0].UID, "Recharge", user[0][0].name, value);
        });
    }
    build_order(SID, distance, subtotal, fee, account, foods) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(SID, distance, subtotal, fee, account, foods);
            var user = (yield this.database.promise().execute(`SELECT UID, name FROM users WHERE account = ?;`, [account]));
            var UID = user[0][0].UID;
            var user_name = user[0][0].name;
            var shop = (yield this.database.promise().execute(`SELECT shopname, category, UID FROM shops WHERE SID = ?;`, [SID]));
            var shop_name = shop[0][0].shopname;
            var foodType = shop[0][0].category;
            var shop_owner = shop[0][0].UID;
            var now_int = Date.now();
            var nowww = new Date(now_int).toUTCString();
            yield this.database.promise().execute(`INSERT into orders values(0, ?, ?, "N", ?, ?, ?, ?, ?, NULL);`, [UID, SID, distance, subtotal, fee, foodType, nowww]);
            var result = (yield this.database.promise().execute(`SELECT OID FROM orders WHERE SID = ? AND UID = ? order by start desc;`, [SID, UID]));
            var OID = result[0][0].OID;
            for (var i = 0; i < foods.length; i++) {
                var data = (yield this.database.promise().execute(`SELECT PID, image, mealname FROM products WHERE SID = ? AND mealname = ?;`, [SID, foods[i][0]]));
                var product = data[0][0];
                yield this.database.promise().execute(`INSERT into includes values(?, ?, ?, ?, ?, ?);`, [OID, product.PID, foods[i][2], foods[i][1], product.image, product.mealname]);
            }
            var Total = parseInt(subtotal) + parseInt(fee);
            yield this.Add_tradeRecords(UID, "Payment", shop_name, -Total);
            yield this.Add_tradeRecords(shop_owner, "Receive", user_name, Total);
            var wallet = (yield this.database.promise().execute(`SELECT wallet FROM users WHERE UID = ?;`, [UID]));
            return wallet[0][0].wallet;
        });
    }
    food_ordered(SID, foods) {
        return __awaiter(this, void 0, void 0, function* () {
            for (var i = 0; i < foods.length; i++) {
                yield this.database.promise().execute(`UPDATE products 
                SET quantity = quantity - ? 
                WHERE SID = ? AND mealname = ?;`, [foods[i][1], SID, foods[i][0]]);
            }
        });
    }
    Add_tradeRecords(UID, action, trader, value) {
        return __awaiter(this, void 0, void 0, function* () {
            var now_int = Date.now();
            var nowww = new Date(now_int).toUTCString();
            yield this.database.promise().execute(`INSERT into tradeRecords values(0, ?, ?, ?, ?, ?);`, [UID, action, nowww, trader, value]);
            yield this.database.promise().execute(`UPDATE users SET wallet = wallet + ? WHERE UID = ?;`, [parseInt(value), UID]);
        });
    }
    Search_MyOrder(filter, account) {
        return __awaiter(this, void 0, void 0, function* () {
            var UID = (yield this.database.promise().execute(`SELECT UID FROM users WHERE account = ?;`, [account]));
            UID = UID[0][0].UID;
            var my_orders;
            if (filter == "All") {
                my_orders = (yield this.database.promise().execute(`SELECT OID, orders.UID as UID, OID, status, subtotal, fee, end, shopname, start
                FROM orders, shops
                WHERE orders.UID = ?
                    AND orders.SID = shops.SID;`, [UID]));
            }
            else {
                my_orders = (yield this.database.promise().execute(`SELECT OID, orders.UID as UID, OID, status, subtotal, fee, end, shopname, start
                FROM orders, shops 
                WHERE orders.UID = ? 
                    AND status = ? 
                    AND orders.SID = shops.SID;`, [UID, filter[0]]));
            }
            return my_orders[0];
        });
    }
    Search_Order(OID) {
        return __awaiter(this, void 0, void 0, function* () {
            var my_orders = (yield this.database.promise().execute(`SELECT *
                FROM orders
                WHERE OID = ?;`, [OID]));
            return my_orders[0][0];
        });
    }
    Foods_in_order(OID) {
        return __awaiter(this, void 0, void 0, function* () {
            var foods = (yield this.database.promise().execute(`SELECT image, mealname, price, amount as quantity
            FROM orders, includes
            WHERE orders.OID = ? 
                AND orders.OID = includes.OID;`, [OID]));
            return foods[0];
        });
    }
    Check_order(OID) {
        return __awaiter(this, void 0, void 0, function* () {
            var result = (yield this.database.promise().execute(`SELECT status FROM orders WHERE OID = ?;`, [OID]));
            return result[0][0].status;
        });
    }
    Cancel_orders(OID) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.database.promise().execute(`UPDATE orders SET status = "C" WHERE OID = ?;`, [OID]);
            var shop = (yield this.database.promise().execute(`SELECT orders.SID as SID, orders.UID as user_UID, shops.UID as owner_UID, shopname
            FROM orders, shops
            WHERE OID = ?
                AND orders.SID = shops.SID;`, [OID]));
            shop = shop[0][0];
            var SID = shop.SID;
            var shop_owner = shop.owner_UID;
            var shopname = shop.shopname;
            var UID = shop.user_UID;
            var user = (yield this.database.promise().execute(`SELECT name FROM users WHERE UID = ?;`, [UID]));
            user = user[0][0].name;
            var order = (yield this.database.promise().execute(`SELECT subtotal, fee FROM orders WHERE OID = ?;`, [OID]));
            var subtotal = order[0][0].subtotal;
            var fee = order[0][0].fee;
            var total = parseInt(subtotal) + parseInt(fee);
            var foods = (yield this.database.promise().execute(`SELECT PID, amount
            FROM includes
            WHERE OID = ?;`, [OID]));
            foods = foods[0];
            for (var i = 0; i < foods.length; i++) {
                yield this.database.promise().execute(`UPDATE products 
                SET quantity = quantity + ?
                WHERE PID = ? AND SID = ?;`, [foods[i].amount, foods[i].PID, SID]);
            }
            yield this.Add_tradeRecords(UID, "Receive", shopname, total);
            yield this.Add_tradeRecords(shop_owner, "Payment", user, -total);
        });
    }
    get_user_wallet(OID) {
        return __awaiter(this, void 0, void 0, function* () {
            var UID = (yield this.database.promise().execute(`SELECT UID FROM orders WHERE OID = ?;`, [OID]));
            UID = UID[0][0].UID;
            var wallet = (yield this.database.promise().execute(`SELECT wallet FROM users WHERE UID = ?;`, [UID]));
            return wallet[0][0].wallet;
        });
    }
    // shop order
    shopFilter(status, UID) {
        return __awaiter(this, void 0, void 0, function* () {
            if (status == "a") {
                let [result, _] = yield this.database.promise().execute(`SELECT OID, status, start, end, shopname, subtotal, fee 
                FROM shops INNER JOIN orders on shops.SID = orders.SID
                WHERE shops.UID = ?`, [UID]);
                return result;
            }
            else {
                let [result, _] = yield this.database.promise().execute(`SELECT OID, status, start, end, shopname, subtotal, fee
                FROM shops INNER JOIN orders on shops.SID = orders.SID
                WHERE shops.UID = ? and status = ?`, [UID, status]);
                return result;
            }
        });
    }
    getOrderDetail(OID) {
        return __awaiter(this, void 0, void 0, function* () {
            // change cost to subtotal + delivery
            let [result, _] = yield this.database.promise().execute(`SELECT mealname, image, price, amount as quantity, status, subtotal,fee
            from includes, orders
            WHERE orders.OID=includes.OID and orders.OID = ?;`, [OID]);
            console.log(result);
            return result;
        });
    }
    checkOrderStatus(OID) {
        return __awaiter(this, void 0, void 0, function* () {
            let [result, _] = yield this.database.promise().execute(`SELECT status from orders WHERE OID = ?`, [OID]);
            return result[0].status;
        });
    }
    finishOrder(OID) {
        return __awaiter(this, void 0, void 0, function* () {
            let status = yield this.checkOrderStatus(OID);
            let mes = "";
            var now_int = Date.now();
            var nowww = new Date(now_int).toUTCString();
            if (status == "N") {
                yield this.database.promise().execute(`UPDATE orders SET status = ? , end=?
                WHERE OID =?`, ["F", nowww, OID]);
                mes += "Order #" + OID + " finished successfully :) \n";
            }
            else if (status == "C") {
                mes += "Order #" + OID + " has already been canceled QAQ\n";
            }
            else {
                mes += "Order #" + OID + " has already been finished ?\n";
            }
            return mes;
        });
    }
    cancelOrder(OID, UID) {
        return __awaiter(this, void 0, void 0, function* () {
            // check if status == not finished
            let status = yield this.checkOrderStatus(OID);
            if (status == "F")
                return "Order #" + OID + " has already been finished :D\n";
            else if (status == "C")
                return "Order #" + OID + " has already been canceled QAQ\n";
            else {
                let [q, _] = yield this.database.promise().execute(`SELECT subtotal, fee, UID FROM orders WHERE OID=?`, [OID]);
                let total = q[0].subtotal + q[0].fee;
                let info = yield this.database.promise().execute(`SELECT shopname, name 
                    from orders NATURAL JOIN users INNER JOIN shops ON shops.SID = orders.SID 
                    WHERE shops.UID=? and users.UID = ?; `, [UID, q[0].UID]);
                const conn = yield this.database.promise().getConnection();
                conn.beginTransaction();
                try {
                    //refund for customer
                    yield conn.execute('UPDATE users SET wallet=wallet+? WHERE UID =?', [total, UID]);
                    //refund for shop
                    yield conn.execute('UPDATE users SET wallet=wallet-? WHERE UID =?', [total, UID]);
                    //tradeRecord for customer
                    var now_int = Date.now();
                    var nowww = new Date(now_int).toUTCString();
                    yield conn.execute(`INSERT INTO tradeRecords values(0,?,"Received",?,?,?)`, [q[0].UID, nowww, info[0][0].shopname, total]);
                    //tradeRecord for shop
                    yield conn.execute(`INSERT INTO tradeRecords values(0,?,"Payment",?,?,?)`, [UID, nowww, info[0][0].name, -1 * total]);
                    //update orders
                    yield conn.execute(`UPDATE orders SET status = "C" WHERE OID = ?`, [OID]);
                    yield conn.commit();
                    return `Order #${OID} caceled successed:)\n`;
                }
                catch (err) {
                    conn.rollback();
                    console.log(err);
                    return `Order #${OID} caceled failed because you have no money QQ\n`;
                }
                finally {
                    conn.release();
                }
            }
        });
    }
    tradeFilter(UID, filter) {
        return __awaiter(this, void 0, void 0, function* () {
            if (filter == "a") {
                let [result, _] = yield this.database.promise().execute(`SELECT RID, action, time, trader, amount_change
                FROM tradeRecords WHERE UID = ?`, [UID]);
                return result;
            }
            else {
                let [result, _] = yield this.database.promise().execute(`SELECT RID, action, time, trader,amount_change
                FROM tradeRecords WHERE UID = ? and action=?`, [UID, filter]);
                return result;
            }
        });
    }
}
exports.DataBase = DataBase;
