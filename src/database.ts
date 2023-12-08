import * as crypto from "crypto";
import { errorMonitor } from "events";
import * as mysql from "mysql2";

function genHash(password: string): string {
    var hash = crypto.createHash("sha256").update(password).digest("hex");
    return hash;
}

export class DataBase {

    database: mysql.Pool;
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

    private createTables(): void {
        this.database.query(
            `CREATE TABLE IF NOT EXISTS users(
                UID INTEGER NOT NULL PRIMARY KEY AUTO_INCREMENT,
                account varchar(50) BINARY NOT NULL UNIQUE,
                password varchar(64) NOT NULL,
                name varchar(50) NOT NULL,
                identity char(1),
                wallet INT UNSIGNED ,
                latitude FLOAT(18,14),
                longitude FLOAT(18,14),
                phone char(10)
             );`
        ); // 'c': client 's':shop owner

        this.database.query(
            `CREATE TABLE IF NOT EXISTS shops(
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
             );`
        );

        this.database.query(
            `CREATE TABLE IF NOT EXISTS products(
                PID INTEGER NOT NULL PRIMARY KEY AUTO_INCREMENT,
                SID INTEGER NOT NULL ,
                mealname varchar(50) NOT NULL,
                price INTEGER NOT NULL,
                quantity INTEGER NOT NULL,
                image varchar(60) NOT NULL
             );`
        );

        this.database.query(
            `CREATE TABLE IF NOT EXISTS tradeRecords(
                 RID INTEGER NOT NULL PRIMARY KEY AUTO_INCREMENT,
                 UID INTEGER NOT NULL,
                 action varchar(10) NOT NULL,
                 time varchar(40) NOT NULL,
                 trader char(20) NOT NULL,
                 amount_change INTEGER NOT NULL
              );`
        );

        // use NOW() in the insert query to represent current time!
        // "N": Not finished, "F": Finished, "C": cancel
        this.database.query(
            `CREATE TABLE IF NOT EXISTS orders(
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
              );`
        );

        this.database.query(
            `CREATE TABLE IF NOT EXISTS includes(
                 OID INTEGER NOT NULL,
                 PID INTEGER NOT NULL,
                 price INTEGER NOT NULL,
                 amount INTEGER NOT NULL,
                 image varchar(60) NOT NULL,
                 mealname varchar(50) NOT NULL,
                 PRIMARY KEY(OID,PID)
              );`
        );
    }

    // log in 
    public async checkpassword(account: string, password: string) {
        let [results, _] = await this.database.promise().execute(
            `SELECT account, password, UID FROM users
              where account = ? and password = ?;`,
            [account, genHash(password)]
        );
        return results as any;
    }

    // register 
    public async accountused(account: string) {

        //check if account is used
        let [results, _] = await this.database.promise().execute(
            `SELECT account FROM users
                where account = ? ;`, [account]
        );
        return (results as any).length == 1;

    }

    public async validuser(account: string, name: string, password: string,
        re_password: string, phone: string, latitude: string, longitude: string) {

        let check = "";
        //name
        if (!name.length) check += "You need to enter your name\n";
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
        if (!account.length) check += "You need to enter your account\n";
        else {
            if (await this.accountused(account)) check += "Account used\n";
            for (let x of account) {
                let ascii = x.charCodeAt(0);
                if (!((ascii > 64 && ascii < 91) || (ascii > 96 && ascii < 123) || (ascii > 47 && ascii < 58))) {
                    check += "invalid input for account\n";
                    break;
                }
            }
        }
        //password
        if (!password.length) check += "You need to enter your password\n";
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
        if (!phone.length) check += "You need to enter your phone number\n";
        else if (phone.length != 10) check += "Invalid input for phone\n";
        else {
            for (let x of phone) {
                let ascii = x.charCodeAt(0);
                if (!(ascii > 47 && ascii < 58)) check += "Invalid input for phone\n";
                break;
            }
        }

        //latitude
        if (!latitude.length) check += "latitude feild required\n";
        else if (isNaN(Number(latitude)) || Number(latitude) > 90 || Number(latitude) < -90) check += "invalid input for latitude\n";

        //longitude
        if (!longitude.length) check += "longitude feild required\n";
        else if (isNaN(Number(longitude)) || Number(longitude) > 180 || Number(longitude) < -180) check += "invalid input for longitude\n";



        //check password correct
        if (password != re_password) check += "re_password is not the same QAQ";

        return check;
    }

    public async register(account: string, name: string, password: string,
        phone: string, latitude: number, longitude: number): Promise<void> {
        this.database.promise().execute(
            'INSERT into users values(0,?,?,?,?,?,?,?,?)',
            [account, genHash(password), name, 'c', 0, latitude, longitude, phone]);
    }

    public async check_account_used(account: any) {
        var result = (await this.database.promise().execute(
            `SELECT * FROM users WHERE account = ?;`, [account]
        )) as any;
        return result[0];
    }


    // shop 
    public async shopused(shopname: string) {

        //check if shopname is used
        let [results, _] = await this.database.promise().execute(
            `SELECT shopname FROM shops
                where shopname = ? ;`, [shopname]
        );
        return (results as any).length == 1;

    }

    public async validshop(account: any, shopname: string, category: string, latitude: string, longitude: string): Promise<string> {

        let message = "";
        let [result, _] = await this.getInfo(account);
        if (result.identity === "s") message += "you've reached your max shop register\n";
        // shopname
        if (!shopname.length) message += "shopname field required\n";
        else if (await this.shopused(shopname)) message += "this shopname has been used\n";

        //category 
        if (!category.length) message += "category feild required\n";

        //latitude
        if (!latitude.length) message += "latitude feild required\n";
        else if (isNaN(Number(latitude)) || Number(latitude) > 90 || Number(latitude) < -90) message += "invalid input for latitude\n";

        //longitude
        if (!longitude.length) message += "longitude feild required\n";
        else if (isNaN(Number(longitude)) || Number(longitude) > 180 || Number(longitude) < -180) message += "invalid input for longitude\n";

        return message;

    }

    public async registershop(account: any, shopname: string, category: string, longitude: string, latitude: string): Promise<void> {


        let [result, _] = await this.getInfo(account);
        this.database.promise().execute(
            `INSERT into shops values(?,?,?,?,?,?,ST_GeomFromText(?),?);`,
            [0, result.UID, shopname, category, latitude, longitude,
                "POINT(" + longitude + " " + latitude + ")",
                result.phone]);
        this.database.promise().execute(
            `UPDATE users SET identity = "s" WHERE account =?;`, [account]
        );
    }

    // should add somthing (alert message)
    public async delete_product(account: any, mealname: string): Promise<void> {

        let q = await this.getShopInfo(account);
        await this.database.promise().execute(
            `DELETE FROM products 
            WHERE mealname = ? AND SID = ?;`, [mealname, q[0].SID]
        )
    }

    public async edit_product(account: any, mealname: string, price: string, quantity: string): Promise<string> {

        let mes = "";
        let q = await this.getShopInfo(account);
        if (!price.length) mes += "Please enter price\n";
        else if (isNaN(Number(price)) || Number(price) % 1) mes += "Invalid input for price\n";

        if (!quantity.length) mes += "Please enter quantity";
        else if (isNaN(Number(quantity)) || Number(quantity) % 1) mes += "Invalid input for quantity\n";

        if (mes == "") {
            await this.database.promise().execute(
                `UPDATE products SET price=?, quantity=? WHERE SID =? and mealname=?;`,
                [price, quantity, q[0].SID, mealname]
            )
        }

        return mes;
    }

    public validProduct(mealname: string, price: string, quantity: string, image: string | undefined): string {
        // mealname
        let mes = "";
        if (!mealname.length) mes += "mealname feild required\n";
        // image
        if (image === undefined) mes += "image feild required\n";
        // price
        if (!price.length) mes += "please enter price for product\n";
        else if ((Number(price) % 1 !== 0) || (Number(price) < 0)) mes += "invalid input for price\n";
        // quantity
        if (!quantity.length) mes += "please enter quantity for product\n";
        else if ((Number(quantity) % 1 !== 0) || (Number(quantity) < 0)) mes += "invalid input for quantity\n";

        return mes;
    }

    public async regProduct(account: any, mealname: string, price: string, quantity: string, image: string | undefined): Promise<string> {

        let mes = "";

        let id = await this.getInfo(account);
        if (id[0].identity === "c") {
            mes += "You are not a shop owner QAQ\n Register shop to continue";
            return mes;
        }
        let [q, _] = await this.database.promise().execute(
            `SELECT PID 
              FROM shops NATURAL JOIN products,users 
              where shops.UID=users.UID and account = ? and mealname=?;`, [account, mealname]
        );

        if ((q as any).length) mes += "Product name already used\n";
        mes += this.validProduct(mealname, price, quantity, image);
        if (mes === "") {
            let q = await this.getShopInfo(account);
            await this.database.promise().execute(
                'INSERT into products values(0,?,?,?,?,?);',
                [q[0].SID, mealname, Number(price), Number(quantity), String(image)]);
        }

        return mes;

    }

    public async getProduct(account: any): Promise<any> {
        let [result, _] = await this.database.promise().execute(
            `SELECT mealname, price, quantity, image 
              FROM shops NATURAL JOIN products,users 
              where shops.UID=users.UID and account = ? ;`, [account]
        );

        return result as any;
    }

    public async getShopInfo(account: any): Promise<any> {
        let [result, _] = await this.database.promise().execute(
            `SELECT SID, shopname, category, shops.latitude, shops.longitude 
              FROM shops, users
              where shops.UID = users.UID and account = ? ;`, [account]
        );
        return (result as any);
    }

    public async check_name_used(name: any) {

        var result = (await this.database.promise().execute(
            `SELECT * FROM shops WHERE shopname = ?;`, [name]
        )) as any;

        return result[0];
    }

    // home
    public async getInfo(account: any) {
        let [result, _] = await this.database.promise().execute(
            `SELECT UID, name, phone, identity, wallet, latitude, longitude 
            FROM users
            where account = ? ;`,
            [account]
        );
        return (result as any);
    }

    public async edit_location(account: any, latitude: any, longitude: any) {
        let check = ""
        if (!latitude.length) check += "latitude feild required\n";
        else if (isNaN(Number(latitude)) ||
            Number(latitude) > 90 ||
            Number(latitude) < -90
        )
            check += "invalid input for latitude\n";
        if (!longitude.length) check += "longitude feild required\n";
        else if (isNaN(Number(longitude)) ||
            Number(longitude) > 180 ||
            Number(longitude) < -180
        )
            check += "invalid input for longitude\n";

        if (check != "") return check;

        check = "s";
        this.database.promise().execute(
            `UPDATE users 
            SET latitude = ?, longitude = ? 
            WHERE account = ?;`,
            [latitude, longitude, account]
        )
        return check;
    }

    public async search_shop(account: any,
        name: any, distance: any,
        price_down: any, price_up: any,
        meal: any, category: any,
        name_sort: boolean, cat_sort: boolean, dis_sort: boolean) {

        var check = "";
        var [user_info, _] = await this.getInfo(account);
        var near = 40000, medium = 500000, far = 10000000;
        var my_name, my_dis_d, my_dis_u, my_p_d, my_p_u, my_meal, my_cat;

        if (name.length === 0) my_name = "";
        else my_name = name;

        if (name === undefined) my_name = "";
        else my_name = name;

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

        if (price_down.length === 0) my_p_d = 0;
        else if (isNaN(price_down)) return "d";
        else my_p_d = price_down;

        if (price_up.length === 0) my_p_u = 1000000;
        else if (isNaN(price_up)) return "u";
        else my_p_u = price_up;

        if (my_p_d > my_p_u) {
            var tem = my_p_d;
            my_p_d = my_p_u;
            my_p_u = tem;
        }

        if (meal.length === 0) my_meal = "";
        else my_meal = meal;

        if (category.length === 0) my_cat = "";
        else my_cat = category;

        var from_database = "", where_condi;

        if (price_down.length == 0
            && price_up.length == 0
            && meal.length == 0) {

            from_database = `FROM shops `;
            where_condi
                = `WHERE shopname like ? 
                AND category like ? 
                AND ST_Distance_Sphere(POINT(?,?),location) BETWEEN ? AND ? `;
        } else {
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

        var query =
            `SELECT shops.SID, shopname, category, ST_Distance_Sphere(POINT(?,?),location) AS distant ` + from_database + where_condi;

        if (name.length === 0) {
            if (category.length === 0) {
                query += ` ORDER BY ST_Distance_Sphere(POINT(?,?),location)`;
                if (dis_sort) query += ` desc`;

                query += `, shopname`;
                if (name_sort) query += ` desc`;

                query += `,category `;
                if (cat_sort) query += ` desc`;
                query += `;`

            }
            else {
                query += ` ORDER BY category`;
                if (cat_sort) query += ` desc`;

                query += `,shopname`;
                if (name_sort) query += ` desc`;

                query += `,ST_Distance_Sphere(POINT(?,?),location)`
                if (dis_sort) query += ` desc`;
                query += `;`
            }
        } else {
            query += ` ORDER BY shopname`;
            if (name_sort) query += ` desc`;

            query += `,category `;
            if (cat_sort) query += ` desc`;

            query += `,ST_Distance_Sphere(POINT(?,?),location)`
            if (dis_sort) query += ` desc`;
            query += `;`

        }
        var result = await this.database.promise().execute(
            query,
            [user_info.longitude, user_info.latitude,
            "%" + my_name + "%", "%" + my_cat + "%",
            user_info.longitude, user_info.latitude, my_dis_d, my_dis_u,
            user_info.longitude, user_info.latitude
            ]
        );
        return result[0];
    }

    public async load_product_info(SID: any) {
        var result = await this.database.promise().execute(
            `SELECT mealname, price, quantity, image 
            FROM products natural join shops
            WHERE shops.SID = ?;`,
            [SID]
        );

        return result[0];
    }


    // home order

    public async search_product(SID: any) {
        var result = (await this.database.promise().execute(
            `SELECT * 
            FROM shops NATURAL JOIN products
            WHERE shops.SID = ? AND shops.SID = products.SID;`, [SID]
        )) as any;
        return result;
    }

    // edit this later
    public async Add_value(account: any, value: any) {
        var user = (await this.database.promise().execute(
            `SELECT UID, name FROM users WHERE account = ?;`,
            [account]
        )) as any;
        await this.Add_tradeRecords(user[0][0].UID, "Recharge", account, value);
    }

    public async build_order(SID: string, distance: any, subtotal: any, fee: any, account: any, foods: any) {
        var user = (await this.database.promise().execute(
            `SELECT UID FROM users WHERE account = ?;`,
            [account]
        )) as any;
        var UID = user[0][0].UID;
        

        var shop = (await this.database.promise().execute(
            `SELECT shopname, category, UID FROM shops WHERE SID = ?;`,
            [SID]
        )) as any;
        var shop_name = shop[0][0].shopname;
        var foodType = shop[0][0].category;
        var shop_owner = shop[0][0].UID;
        var now_int = Date.now();
        var nowww = new Date(now_int).toUTCString();  
        
        await this.database.promise().execute(
            `INSERT into orders values(0, ?, ?, "N", ?, ?, ?, ?, ?, NULL);`,
            [UID, SID, distance, subtotal, fee, foodType, nowww]
        )
        var result = (await this.database.promise().execute(
            `SELECT OID FROM orders WHERE SID = ? AND UID = ? order by OID desc;`,
            [SID, UID]
        )) as any;
        var OID = result[0][0].OID;
        for (var i = 0; i < foods.length; i++) {
            var data = (await this.database.promise().execute(
                `SELECT PID, image, mealname FROM products WHERE SID = ? AND mealname = ?;`,
                [SID, foods[i][0]]
            )) as any;
            var product = data[0][0];
            await this.database.promise().execute(
                `INSERT into includes values(?, ?, ?, ?, ?, ?);`,
                [OID, product.PID, foods[i][2], foods[i][1], product.image, product.mealname]
            );
        }
        var Total = parseInt(subtotal) + parseInt(fee);
        await this.Add_tradeRecords(UID, "Payment", shop_name, -Total);
        await this.Add_tradeRecords(shop_owner, "Received", account, Total);

        var wallet = (await this.database.promise().execute(
            `SELECT wallet FROM users WHERE UID = ?;`, [UID]
        )) as any;
        return wallet[0][0].wallet;
    }

    public async food_ordered(SID: any, foods: any) {
        for (var i = 0; i < foods.length; i++) {
            await this.database.promise().execute(
                `UPDATE products 
                SET quantity = quantity - ? 
                WHERE SID = ? AND mealname = ?;`,
                [foods[i][1], SID, foods[i][0]]
            )
        }
    }

    public async Add_tradeRecords(UID: any, action: any, trader: any, value: any) {
        var now_int = Date.now();
        var nowww = new Date(now_int).toUTCString();
        await this.database.promise().execute(
            `INSERT into tradeRecords values(0, ?, ?, ?, ?, ?);`,
            [UID, action, nowww, trader, value]
        )
        await this.database.promise().execute(
            `UPDATE users SET wallet = wallet + ? WHERE UID = ?;`,
            [parseInt(value), UID]
        )
    }

    public async Search_MyOrder(filter: any, account: any) {

        var UID = (await this.database.promise().execute(
            `SELECT UID FROM users WHERE account = ?;`,
            [account]
        )) as any;
        UID = UID[0][0].UID;

        var my_orders;
        if (filter == "All") {
            my_orders = (await this.database.promise().execute(
                `SELECT OID, orders.UID as UID, OID, status, subtotal, fee, end, shopname, start
                FROM orders, shops
                WHERE orders.UID = ?
                    AND orders.SID = shops.SID;`,
                [UID]
            )) as any;
        } else {
            my_orders = (await this.database.promise().execute(
                `SELECT OID, orders.UID as UID, OID, status, subtotal, fee, end, shopname, start
                FROM orders, shops 
                WHERE orders.UID = ? 
                    AND status = ? 
                    AND orders.SID = shops.SID;`,
                [UID, filter[0]]
            )) as any;
        }
        return my_orders[0];
    }

    public async Search_Order(OID: any) {

        var my_orders = (await this.database.promise().execute(
            `SELECT *
                FROM orders
                WHERE OID = ?;`,
            [OID]
        )) as any;
        return my_orders[0][0];
    }

    public async Foods_in_order(OID: any) {
        var foods = (await this.database.promise().execute(
            `SELECT image, mealname, price, amount as quantity
            FROM orders, includes
            WHERE orders.OID = ? 
                AND orders.OID = includes.OID;`,
            [OID]
        )) as any;

        return foods[0];
    }

    public async Check_order(OID: any) {
        var result = (await this.database.promise().execute(
            `SELECT status FROM orders WHERE OID = ?;`, [OID]
        )) as any;
        return result[0][0].status;
    }

    public async Cancel_orders(OID: any) {
        await this.database.promise().execute(
            `UPDATE orders SET status = "C" WHERE OID = ?;`,
            [OID]
        );
        var shop = (await this.database.promise().execute(
            `SELECT orders.SID as SID, orders.UID as user_UID, shops.UID as owner_UID, shopname
            FROM orders, shops
            WHERE OID = ?
                AND orders.SID = shops.SID;`,
            [OID]
        )) as any;
        shop = shop[0][0];
        var SID = shop.SID;
        var shop_owner = shop.owner_UID;
        var shopname = shop.shopname;
        var UID = shop.user_UID;

        var user = (await this.database.promise().execute(
            `SELECT account FROM users WHERE UID = ?;`,
            [UID]
        )) as any;
        user = user[0][0].account;

        var order = (await this.database.promise().execute(
            `SELECT subtotal, fee FROM orders WHERE OID = ?;`,
            [OID]
        )) as any;
        var subtotal = order[0][0].subtotal;
        var fee = order[0][0].fee;
        var total = parseInt(subtotal) + parseInt(fee);

        var foods = (await this.database.promise().execute(
            `SELECT PID, amount
            FROM includes
            WHERE OID = ?;`, [OID]
        )) as any;
        foods = foods[0];
        for (var i = 0; i < foods.length; i++) {
            await this.database.promise().execute(
                `UPDATE products 
                SET quantity = quantity + ?
                WHERE PID = ? AND SID = ?;`,
                [foods[i].amount, foods[i].PID, SID]
            )
        }

        await this.Add_tradeRecords(UID, "Received", shopname, total);
        await this.Add_tradeRecords(shop_owner, "Payment", user, -total);
    }

    public async get_user_wallet(OID: any) {
        var UID = (await this.database.promise().execute(
            `SELECT UID FROM orders WHERE OID = ?;`, [OID]
        )) as any;
        UID = UID[0][0].UID;

        var wallet = (await this.database.promise().execute(
            `SELECT wallet FROM users WHERE UID = ?;`, [UID]
        )) as any;
        return wallet[0][0].wallet;
    }

    public async get_shop_wallet(OID: any) {
        var UID = (await this.database.promise().execute(
            `SELECT shops.UID FROM orders, shops 
             WHERE OID = ?
                AND orders.SID = shops.SID;`, [OID]
        )) as any;
        UID = UID[0][0].UID;

        var wallet = (await this.database.promise().execute(
            `SELECT wallet FROM users WHERE UID = ?;`, [UID]
        )) as any;
        return wallet[0][0].wallet;
    }

    public async get_total(OID: any) {
        var result = (await this.database.promise().execute(
            `SELECT subtotal, fee FROM orders
             WHERE OID = ?;`, [OID]
        )) as any;
        result = result[0][0];

        return result.subtotal + result.fee;
    }

    // shop order
    public async shopFilter(status: string, UID: any) {
        if (status == "a") {
            let [result, _] = await this.database.promise().execute(
                `SELECT OID, status, start, end, shopname, subtotal, fee 
                FROM shops INNER JOIN orders on shops.SID = orders.SID
                WHERE shops.UID = ?` , [UID]
            )
            return result as any;
        } else {
            let [result, _] = await this.database.promise().execute(
                `SELECT OID, status, start, end, shopname, subtotal, fee
                FROM shops INNER JOIN orders on shops.SID = orders.SID
                WHERE shops.UID = ? and status = ?` , [UID, status]
            )
            return result as any;
        }
    }

    public async getOrderDetail(OID: number) {

        // change cost to subtotal + delivery
        let [result, _] = await this.database.promise().execute(
            `SELECT mealname, image, price, amount as quantity, status, subtotal,fee
            from includes, orders
            WHERE orders.OID=includes.OID and orders.OID = ?;` , [OID]
        )
        return result as any;
    }

    public async checkOrderStatus(OID: number) {
        let [result, _] = await this.database.promise().execute(
            `SELECT status from orders WHERE OID = ?`, [OID]
        )
        return (result as any)[0].status;
    }

    public async finishOrder(OID: number) {

        let status = await this.checkOrderStatus(OID);
        let mes = "";
        var now_int = Date.now();
        var nowww = new Date(now_int).toUTCString();
        if (status == "N") {
            await this.database.promise().execute(
                `UPDATE orders SET status = ? , end=?
                WHERE OID =?`, ["F", nowww, OID]
            )
            mes += "Order #" + OID + " finished successfully :) \n";
        } else if (status == "C") {
            mes += "Order #" + OID + " has already been canceled QAQ\n";
        } else {
            mes += "Order #" + OID + " has already been finished ?\n";
        }
        return mes;
    }



    public async cancelOrder(OID: number, UID: any) {
        // check if status == not finished

        let status = await this.checkOrderStatus(OID);

        if (status == "F") return "Order #" + OID + " has already been finished :D\n";
        else if (status == "C") return "Order #" + OID + " has already been canceled QAQ\n";

        else {
            let [q, _] = await this.database.promise().execute(
                `SELECT subtotal, fee, UID FROM orders WHERE OID=?`, [OID]
            ) as any;
            let total = q[0].subtotal + q[0].fee;

            let info = await this.database.promise().execute(
                `SELECT shopname, account 
                    from orders NATURAL JOIN users INNER JOIN shops ON shops.SID = orders.SID 
                    WHERE shops.UID=? and users.UID = ?; ` , [UID, q[0].UID]
            ) as any;
             
            const conn = await this.database.promise().getConnection();
            conn.beginTransaction();
            try {
                //refund for customer
                await conn.execute(
                    'UPDATE users SET wallet=wallet+? WHERE UID =?', [total, q[0].UID]
                );
                //refund for shop
                await conn.execute(
                    'UPDATE users SET wallet=wallet-? WHERE UID =?', [total, UID]
                );
                //tradeRecord for customer
                var now_int = Date.now();
                var nowww = new Date(now_int).toUTCString();
                await conn.execute(
                    `INSERT INTO tradeRecords values(0,?,"Received",?,?,?)`, [q[0].UID, nowww, info[0][0].shopname, total]
                )
                //tradeRecord for shop
                await conn.execute(
                    `INSERT INTO tradeRecords values(0,?,"Payment",?,?,?)`, [UID, nowww, info[0][0].account, -1 * total]
                )
                //update orders
                await conn.execute(
                    `UPDATE orders SET status = "C" WHERE OID = ?`, [OID]
                )
                // add canceled orders back 
                let [products,_] = await conn.execute(
                    `SELECT PID,amount from includes WHERE OID =? `,[OID]
                ) as any;
                for(let i=0;i<products.length;++i){
                    await conn.execute(
                        `UPDATE products SET quantity = quantity+? WHERE PID =?`,[products[i].amount,products[i].PID]
                    )
                }
                await conn.commit();
                return `Order #${OID} caceled successed:)\n`;

            } catch (err) {
                conn.rollback();
                return `Order #${OID} caceled failed because you have no money QQ\n`;
            } finally {
                
                conn.release();
            }
        }

    }



    public async tradeFilter(UID: any, filter: string) {
        if (filter == "a") {
            let [result, _] = await this.database.promise().execute(
                `SELECT RID, action, time, trader, amount_change
                FROM tradeRecords WHERE UID = ?`, [UID]
            )
            return result as any;
        }
        else {
            let [result, _] = await this.database.promise().execute(
                `SELECT RID, action, time, trader,amount_change
                FROM tradeRecords WHERE UID = ? and action=?`, [UID, filter]
            )
            return result as any;
        }
    }

}
