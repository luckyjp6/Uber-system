
function shopFilter() {

    let filter = $("#sf").val();
    if (filter == undefined) filter = "a";

    $.post("/statusFilter", {
        status: filter
    }).done(function (data, status) {
        showOrders(data.orders, filter);
    })

}

function showOrders(orders) {
    let html = "";
    let s, end;

    for (let i = 0; i < orders.length; ++i) {
        html += '<tr><th scope="row">' + orders[i].OID + '</th>';
        if (orders[i].status == "N") {
            s = "Not Finished";
            end = "null";
        } else if (orders[i].status == "F") {
            s = "Finished";
            //end = orders[i].end.substring(0, 10) + " " + orders[i].end.substring(11, 19);
            end = new Date(orders[i].end).toLocaleString();
        } else {
            s = "Canceled";
            end = "null"
        }
        var start_time = new Date(orders[i].start).toLocaleString();
        html += '<td>' + s + '</td>';
        html += '<td>' + start_time + '</td>';
        html += '<td>' + end + '</td>';
        html += '<td>' + orders[i].shopname + '</td>';
        html += '<td>' + (orders[i].subtotal + orders[i].fee) + '</td>';
        html += '<td><button type="button" class="btn btn-info" data-toggle="modal" data-target="#order-details"';
        html += 'onclick=showOrderDetail(' + orders[i].OID + ')>' + 'order details</button>';
        if (orders[i].status == "N") {
            html += `<td><input type = "checkbox" class = "shop_cb" value = ${orders[i].OID}> Select</td>`;

        } else {
            html += '<td></td>';
        }

        html += '</tr>';
    }

    $("#sfr").html(html);
}

function showOrderDetail(OID) {
    $.post("/get_order_detail", {
        OID: OID
    }).done(function (data, status) {

        loadOD(data.details);
    })
}

function loadOD(details) {
    console.log(details);
    let html = "";
    for (let i = 0; i < details.length; ++i) {
        html += '<tr>';
        html += '<td><img src="' + details[i].image + '"width="50px" heigh="10"</img></td>';
        html += '<td>' + details[i].mealname + '</td>';
        html += '<td>' + details[i].price + '</td>';
        html += '<td>' + details[i].quantity + '<td>';
        html += '</tr>';
    }

    $("#SOD").html(html);
    document.getElementById("OD_subtol").textContent = "Subtotal $" + details[0].subtotal;
    document.getElementById("OD_df").textContent = "fee $" + details[0].fee;
    document.getElementById("OD_tp").textContent = "Total $" + (details[0].subtotal + details[0].fee);


}

function done(OID) {

    let checked = document.getElementsByClassName("shop_cb");
    let selected = [];
    let filter = $("#sf").val();
    if(checked.length == 0) return;
    for(let i=0;i<checked.length;++i){
        if(checked[i].checked) selected.push(checked[i].value);
    }
    $.post("finish_order", {
        selected: selected,
        filter: filter
    }).done(function (data, status) {

        alert(data.mes);
        showOrders(data.orders);
    })
}

function cancel(OID) {

    let checked = document.getElementsByClassName("shop_cb");
    let selected = [];
    let filter = $("#sf").val();
    if(checked.length==0) return;
    for(let i=0;i<checked.length;++i){
        if(checked[i].checked) selected.push(checked[i].value);
    }

    $.post("cancel_order", {
        selected:selected,
        filter:filter
    }).done(function (data, status) {
        alert(data.mes);
        showOrders(data.orders);
        document.getElementById("user_wallet").textContent = data.wallet;

    })
}