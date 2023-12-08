import express from "express";
import express_session from "express-session";
import path from "path";
import { DataBase } from "./database";
import multer from "multer";


const app: express.Application = express();

const db = new DataBase();

app.listen(3000, () => {
    console.log("App is listening on port 3000");
});

app.set("view engine", "ejs");
app.set("view cache", false);

app.use(express.static(path.join(__dirname, '../public/')));

app.use(express.urlencoded({ extended: true }));

app.use(
    express_session({
        saveUninitialized: false,
        secret: "df4t3g8rybuib",
        resave: false,
    })
);

declare module 'express-session' {
    export interface SessionData {
        account: { [key: string]: any };
        UID: { [key: string]: any }
    }
}

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/Picture')
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
})
var upload = multer({ storage: storage })

// end middleware


// get portion
app.get("/", (req, res) => {
    res.render("pages/index");
});

app.get("/nav", (req, res) => {
    if(req.session.account==undefined) res.render("pages/index");
    else res.render("pages/nav", { products: "" });
})

app.get("/sign-up", async (req, res) => {
    res.render("pages/sign-up");
})




// log in
app.post("/sign-in", async function (req, res) {

    let q = await db.checkpassword(req.body.account, req.body.password);
    if (q.length==1) {
        console.log("login success");
        req.session.account = req.body.account;
        req.session.UID = q[0].UID;
        res.status(200).send({ status: "login ok" });
    } else {
        console.log("failed");
        res.send({ status: "login failed!! QAQ" });
    }

})


// register
app.post("/register", async (req, res) => {

    let message = await
        db.validuser(
            req.body.account,
            req.body.name,
            req.body.password,
            req.body.re_password,
            req.body.phone,
            req.body.latitude,
            req.body.longitude);

    if (message === "") {
        db.register(
            req.body.account,
            req.body.name,
            req.body.password,
            req.body.phone,
            req.body.latitude,
            req.body.longitude);

        res.send({ status: "o" });
    }
    else {
        res.send({ status: message });
    }
})

app.post("/check_account_used", async (req, res) => {
    var result = (await db.check_account_used(req.body.account)) as any;
    var status = "";
    if (result.length != 0) status = "u";
    res.send({ status: status });
})


// shop
app.post("/registershop", async (req, res) => {

    // would need to check if a user is logged in 
    //console.log(req.session.account);
    let mes = await db.validshop(
        req.session.account,
        req.body.shopname,
        req.body.category,
        req.body.latitude,
        req.body.longitude
    );

    if (mes === "") {
        db.registershop(
            req.session.account,
            req.body.shopname,
            req.body.category,
            req.body.longitude,
            req.body.latitude
        );
        res.send({ status: "o" });
    }
    else res.send({ status: mes });

})

app.post("/check_name_used", async (req, res) => {

    var result = (await db.check_name_used(req.body.name)) as any;
    var status = "";
    if (result.length != 0) status = "u";
    res.send({ status: status });
})

app.post('/addProduct', upload.single("file"), async (req, res) => {

    let path = req.file?.path.slice(7);
    let mes = await
        db.regProduct(
            req.session.account,
            req.body.mealname,
            req.body.price,
            req.body.quantity,
            path);
    let pdt = await db.getProduct(req.session.account);
    res.send({ status: mes, products: pdt });

})

app.post("/load_shop",async(req,res)=>{
    let pdt = await db.getProduct(req.session.account);
    res.send({pdt:pdt});
})

app.post("/load_info", async (req, res) => {

    // check if user is logged in 
    if (req.session.account === undefined) {
        res.send({ status: "u" });
        return;
    }
    let result = await db.getInfo(req.session.account);
    if (result[0].identity === "s") {
        let shop = await db.getShopInfo(req.session.account);
        let pdt = await db.getProduct(req.session.account);
        res.status(200).send({
            account: req.session.account,
            name: result[0].name,
            phone: result[0].phone,
            identity: result[0].identity,
            wallet: result[0].wallet,
            location: result[0].latitude + ", " + result[0].longitude,
            shopname: shop[0].shopname,
            category: shop[0].category,
            longitude: shop[0].longitude,
            latitude: shop[0].latitude,
            product: pdt
        });
    } else {
        res.status(200).send({
            account: req.session.account,
            name: result[0].name,
            phone: result[0].phone,
            identity: result[0].identity,
            wallet: result[0].wallet,
            location: result[0].latitude + ", " + result[0].longitude
        });

    }


})



app.post("/editProduct", async (req, res) => {

    let mes = await db.edit_product(
        req.session.account,
        req.body.mealname,
        req.body.price,
        req.body.quantity);

    let pdt = await db.getProduct(req.session.account);
    res.send({
        status: mes,
        products: pdt
    })
})

app.post("/deleteProduct", async (req, res) => {
    await db.delete_product(req.session.account, req.body.mealname);
    let pdt = await db.getProduct(req.session.account);
    res.send({
        status: "",
        products: pdt
    })
})


// home
app.post("/edit_location", async (req, res) => {

    let result = await db.edit_location(req.session.account, req.body.latitude, req.body.longitude);
    res.send({ result: result, location: req.body.latitude + ", " + req.body.longitude });
})

app.post("/search", async (req, res) => {

    if (req.session.account === undefined) {
        console.log("account undefined");
        res.sendStatus(403);
    }
    var name_sort = (req.body.name_sort == "▼");
    var cat_sort = (req.body.cat_sort == "▼");
    var dis_sort = (req.body.dis_sort == "▼");

    var result = (await db.search_shop(
        req.session.account,
        req.body.name,
        req.body.distance,
        req.body.price_down,
        req.body.price_up,
        req.body.meal,
        req.body.category,
        name_sort,
        cat_sort,
        dis_sort)) as any;
    res.send({ result: result });
})

app.post("/load_product_info", async (req, res) => {
    var result = (await db.load_product_info(req.body.SID)) as any;
    res.send({ result: result });
})



// home orders
app.post("/search_product", async (req, res) => {
    var result = (await db.search_product(req.body.SID)) as any;
    var money = (await db.getInfo(req.session.account)) as any;
    res.send({result: result[0], money: money[0].wallet});
})

app.post("/Add_value", async(req, res) => {
    await db.Add_value(req.session.account, req.body.value);
    var money = (await db.getInfo(req.session.account)) as any;
    res.send({wallet:money[0].wallet});
})

app.post("/build_order", async(req, res) => {
    var wallet = await db.build_order(
        req.body.SID, 
        req.body.distance, 
        parseInt(req.body.subtotal),
        parseInt(req.body.fee),
        req.session.account, 
        req.body.foods);
    await db.food_ordered(req.body.SID, req.body.foods);
    res.send({wallet: wallet});
})

app.post("/Search_MyOrder", async(req, res)=>{
    var result = (await db.Search_MyOrder(
        req.body.my_filter,
        req.session.account
    ))
    res.send({result: result});
})

app.post("/Search_Order", async(req,res)=>{
    var result = (await db.Search_Order(req.body.OID)) as any;
    var foods = (await db.Foods_in_order(req.body.OID))as any;
    res.send({result: result, foods: foods});
})

app.post("/Cancel_orders", async(req,res)=>{
    var alert_text = "";
    var orders = req.body.orders;
    var flg = false;
    for (var i = 0; i < orders.length; i++) {
        var check = (await db.Check_order(orders[i])) as any;
        if (check != "N") {
            alert_text += `Cannot cancel order No.${orders[i]}\n`;
            continue;
        }
        var shop_wallet = (await db.get_shop_wallet(orders[i])) as any;
        var total = (await db.get_total(orders[i])) as any;
        if (shop_wallet < total) {
            alert_text += `Cannot cancel order No.${orders[i]}QAQ\n`;
            continue;
        }
        await db.Cancel_orders(orders[i]);
        flg = true;
    }
    var wallet;
    if (flg) wallet = (await db.get_user_wallet(orders[0])) as any;
    res.send({alert_text: alert_text, wallet: wallet});
})


// shop orders
app.post("/statusFilter", async (req, res) => {
    let orders = await db.shopFilter(req.body.status, req.session.UID);
    res.send({ orders: orders });
})


app.post("/get_order_detail", async (req, res) => {
    let details = await db.getOrderDetail(req.body.OID);
    res.send({ details: details });
})

app.post("/finish_order", async (req, res) => {
    
    var mes = "";
    var selected = req.body.selected;
    for(let i=0;i<selected.length;++i){
        mes+=await db.finishOrder(req.body.selected[i]);
    }
    let orders = await db.shopFilter(req.body.filter, req.session.UID);
    res.send({mes:mes, orders:orders})
})

app.post("/cancel_order", async(req,res)=>{
    
    let selected = req.body.selected;
    let mes ="";
    for(let i=0;i<selected.length;++i){
        mes += await db.cancelOrder(selected[i],req.session.UID);
    }
    let orders = await db.shopFilter(req.body.filter, req.session.UID);
    let wallet = (await db.getInfo(req.session.account) as any)[0].wallet;
    res.send({mes:mes,orders:orders,wallet:wallet});
})


// tradeReocords filter

app.post("/trade_filter", async(req,res)=>{
    let records = await db.tradeFilter(req.session.UID, req.body.filter);
    res.send({records:records});
})



