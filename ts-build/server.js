"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_session_1 = __importDefault(require("express-session"));
const path_1 = __importDefault(require("path"));
const database_1 = require("./database");
const multer_1 = __importDefault(require("multer"));
const app = (0, express_1.default)();
const db = new database_1.DataBase();
app.listen(3000, () => {
    console.log("App is listening on port 3000");
});
app.set("view engine", "ejs");
app.set("view cache", false);
app.use(express_1.default.static(path_1.default.join(__dirname, '../public/')));
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, express_session_1.default)({
    saveUninitialized: false,
    secret: "df4t3g8rybuib",
    resave: false,
}));
var storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/Picture');
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});
var upload = (0, multer_1.default)({ storage: storage });
// end middleware
// get portion
app.get("/", (req, res) => {
    res.render("pages/index");
});
app.get("/nav", (req, res) => {
    if (req.session.account == undefined)
        res.render("pages/index");
    else
        res.render("pages/nav", { products: "" });
});
app.get("/sign-up", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.render("pages/sign-up");
}));
// log in
app.post("/sign-in", function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        let q = yield db.checkpassword(req.body.account, req.body.password);
        if (q.length == 1) {
            console.log("login success");
            req.session.account = req.body.account;
            req.session.UID = q[0].UID;
            res.status(200).send({ status: "login ok" });
        }
        else {
            console.log("failed");
            res.send({ status: "login failed!! QAQ" });
        }
    });
});
// register
app.post("/register", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let message = yield db.validuser(req.body.account, req.body.name, req.body.password, req.body.re_password, req.body.phone, req.body.latitude, req.body.longitude);
    if (message === "") {
        db.register(req.body.account, req.body.name, req.body.password, req.body.phone, req.body.latitude, req.body.longitude);
        res.send({ status: "o" });
    }
    else {
        res.send({ status: message });
    }
}));
app.post("/check_account_used", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var result = (yield db.check_account_used(req.body.account));
    var status = "";
    if (result.length != 0)
        status = "u";
    res.send({ status: status });
}));
// shop
app.post("/registershop", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // would need to check if a user is logged in 
    //console.log(req.session.account);
    let mes = yield db.validshop(req.session.account, req.body.shopname, req.body.category, req.body.latitude, req.body.longitude);
    if (mes === "") {
        db.registershop(req.session.account, req.body.shopname, req.body.category, req.body.longitude, req.body.latitude);
        res.send({ status: "o" });
    }
    else
        res.send({ status: mes });
}));
app.post("/check_name_used", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var result = (yield db.check_name_used(req.body.name));
    var status = "";
    if (result.length != 0)
        status = "u";
    res.send({ status: status });
}));
app.post('/addProduct', upload.single("file"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    let path = (_a = req.file) === null || _a === void 0 ? void 0 : _a.path.slice(7);
    let mes = yield db.regProduct(req.session.account, req.body.mealname, req.body.price, req.body.quantity, path);
    let pdt = yield db.getProduct(req.session.account);
    res.send({ status: mes, products: pdt });
}));
app.post("/load_info", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // check if user us logged in 
    if (req.session.account === undefined) {
        res.send({ status: "u" });
        return;
    }
    let result = yield db.getInfo(req.session.account);
    if (result[0].identity === "s") {
        let shop = yield db.getShopInfo(req.session.account);
        let pdt = yield db.getProduct(req.session.account);
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
    }
    else {
        res.status(200).send({
            account: req.session.account,
            name: result[0].name,
            phone: result[0].phone,
            identity: result[0].identity,
            wallet: result[0].wallet,
            location: result[0].latitude + ", " + result[0].longitude
        });
    }
}));
app.post("/editProduct", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let mes = yield db.edit_product(req.session.account, req.body.mealname, req.body.price, req.body.quantity);
    let pdt = yield db.getProduct(req.session.account);
    res.send({
        status: mes,
        products: pdt
    });
}));
app.post("/deleteProduct", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield db.delete_product(req.session.account, req.body.mealname);
    let pdt = yield db.getProduct(req.session.account);
    res.send({
        status: "",
        products: pdt
    });
}));
// home
app.post("/edit_location", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let result = yield db.edit_location(req.session.account, req.body.latitude, req.body.longitude);
    res.send({ result: result, location: req.body.latitude + ", " + req.body.longitude });
}));
app.post("/search", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (req.session.account === undefined) {
        console.log("account undefined");
        res.sendStatus(403);
    }
    var name_sort = (req.body.name_sort == "▼");
    var cat_sort = (req.body.cat_sort == "▼");
    var dis_sort = (req.body.dis_sort == "▼");
    var result = (yield db.search_shop(req.session.account, req.body.name, req.body.distance, req.body.price_down, req.body.price_up, req.body.meal, req.body.category, name_sort, cat_sort, dis_sort));
    res.send({ result: result });
}));
app.post("/load_product_info", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var result = (yield db.load_product_info(req.body.SID));
    res.send({ result: result });
}));
// home orders
app.post("/search_product", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var result = (yield db.search_product(req.body.SID));
    var money = (yield db.getInfo(req.session.account));
    res.send({ result: result[0], money: money[0].wallet });
}));
app.post("/Add_value", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield db.Add_value(req.session.account, req.body.value);
    var money = (yield db.getInfo(req.session.account));
    res.send({ wallet: money[0].wallet });
}));
app.post("/build_order", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var wallet = yield db.build_order(req.body.SID, req.body.distance, parseInt(req.body.subtotal), parseInt(req.body.fee), req.session.account, req.body.foods);
    yield db.food_ordered(req.body.SID, req.body.foods);
    res.send({ wallet: wallet });
}));
app.post("/Search_MyOrder", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var result = (yield db.Search_MyOrder(req.body.my_filter, req.session.account));
    res.send({ result: result });
}));
app.post("/Search_Order", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var result = (yield db.Search_Order(req.body.OID));
    var foods = (yield db.Foods_in_order(req.body.OID));
    res.send({ result: result, foods: foods });
}));
app.post("/Cancel_orders", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var alert_text = "";
    var orders = req.body.orders;
    var flg = false;
    for (var i = 0; i < orders.length; i++) {
        var check = (yield db.Check_order(orders[i]));
        if (check != "N") {
            alert_text += `Cannot cancel order No.${orders[i]}\N`;
            continue;
        }
        yield db.Cancel_orders(orders[i]);
        flg = true;
    }
    var wallet;
    if (flg)
        wallet = (yield db.get_user_wallet(orders[0]));
    res.send({ alert_text: alert_text, wallet: wallet });
}));
// shop orders
app.post("/statusFilter", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let orders = yield db.shopFilter(req.body.status, req.session.UID);
    res.send({ orders: orders });
}));
app.post("/get_order_detail", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let details = yield db.getOrderDetail(req.body.OID);
    res.send({ details: details });
}));
app.post("/finish_order", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var mes = "";
    var selected = req.body.selected;
    for (let i = 0; i < selected.length; ++i) {
        mes += yield db.finishOrder(req.body.selected[i]);
    }
    let orders = yield db.shopFilter(req.body.filter, req.session.UID);
    res.send({ mes: mes, orders: orders });
}));
app.post("/cancel_order", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let selected = req.body.selected;
    let mes = "";
    for (let i = 0; i < selected.length; ++i) {
        mes += yield db.cancelOrder(selected[i], req.session.UID);
    }
    let orders = yield db.shopFilter(req.body.filter, req.session.UID);
    res.send({ mes: mes, orders: orders });
}));
// tradeReocords filter
app.post("/trade_filter", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let records = yield db.tradeFilter(req.session.UID, req.body.filter);
    res.send({ records: records });
}));
