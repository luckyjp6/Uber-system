function search_func(){
    $.post("/search", {
      name: $("#search_shop_name").val(),
      distance: $("#search_distance").val(),
      price_down: $("#search_price_lowerbound").val(),
      price_up: $("#search_price_upperbound").val(),
      meal: $("#search_meal").val(),
      category: $("#search_category").val(),
      name_sort: document.getElementById("order_by_name").textContent,
      cat_sort: document.getElementById("order_by_cat").textContent,
      dis_sort: document.getElementById("order_by_dis").textContent
    }).done(function (data, status) {
      // about search failed or nothing found
      if (data.result == "d") {
        alert("Invalid price lower bound");
        return;
      }
      if (data.result == "u"){
        alert("Invalid price upper bound");
        return;
      }
      var display_html = "";
      if (data.result.length === 0) {
        display_html += "<tr>";
        display_html += "<th scope='row'>1</th>"; // index
        display_html += "<td>not found</td>"; // name
        display_html += "<td>not found</td>"; // category
        display_html += "<td>not found</td>"; // distance
        display_html += "</tr>";
      }
      else {
        // about display the search result
        var near = 40000, medium = 500000, far = 10000000;
        for (let i = 0; i < data.result.length; i++) {

          shopname= convert_name(data.result[i].shopname);
          display_html += "<tr>";
          display_html += `<th scope='row'>` + (i + 1) + `</th>`; // index
          display_html += `<td>` + data.result[i].shopname + `</td>`; // name
          display_html += `<td>` + data.result[i].category + `</td>`; // category
          display_html += `<td id = "shop` + data.result[i].SID + `_distance">` + (data.result[i].distant/1000).toFixed(1) + ` km</td>`; // distantance
          /*if (data.result[i].distant <= near) display_html += `<td>near</td>`; // distance near
          else if (data.result[i].distant <= medium) display_html += `<td>medium</td>`; // distance medium
          else if (data.result[i].distant <= far) display_html += `<td>far</td>`; // distance
          else display_html += `<td>something wrong</td>`*/
          display_html += `<td><button type='button' class='btn btn-info' data-toggle="modal" 
                          data-target="#the_menu"
                          onClick = open_menu(${data.result[i].SID})>Open menu</button></td>\n`;
          display_html += "</tr>";
        }
      }
      $("#search_result").html(display_html);
      goPage(1);
    });
  }


  function goPage(currentPage) {
    var pageSize = 5;
    var table = document.getElementById("search_result");
    var row = table.getElementsByTagName("tr");
    var num = row.length;
    var totalPage = Math.ceil(num / pageSize);

    var startRow = (currentPage - 1) * pageSize + 1;
    var endRow = currentPage * pageSize;
    if (endRow > num) endRow = num;

    for (var i = 1; i <= num; i++) {
      var irow = row[i - 1];
      if (i >= startRow && i <= endRow) irow.style.display = "table-row";
      else irow.style.display = "none";
    }

    var tempStr = "";

    if (currentPage > 1) {
      tempStr += `<button type='button' class='btn btn-primary' onClick = goPage(1)> first page</button>&nbsp`;
      tempStr += `<button type='button' class='btn btn-primary' onClick = goPage(${currentPage - 1}) enabled> previous </button>&nbsp&nbsp&nbsp&nbsp`;
    } else {
      tempStr += `<button type='button' class='btn btn-primary' disabled> first page</button>&nbsp`;
      tempStr += `<button type='button' class='btn btn-primary' disabled> previous </button>&nbsp&nbsp&nbsp&nbsp`;
    }
    tempStr += `Page ${currentPage} / ${totalPage} &nbsp&nbsp`;
    if (currentPage < totalPage) {
      tempStr += `<button type='button' class='btn btn-primary' onClick = goPage(${currentPage + 1}) enabled> next</button>&nbsp`;
      tempStr += `<button type='button' class='btn btn-primary' onClick = goPage(${totalPage})> end page </button>`;
    } else {
      tempStr += `<button type='button' class='btn btn-primary' disabled> next</button>&nbsp`;
      tempStr += `<button type='button' class='btn btn-primary' disabled> end page </button>`;
    }
    $("#search_mutiple_page").html(tempStr);

  }


;(function () {
    $("#order_by_name").click(function (){
        var t = document.getElementById("order_by_name");
        if (t.textContent == "▲") t.textContent = "▼";
        else t.textContent = "▲";
        search_func();
      })
      $("#order_by_cat").click(function (){
        var t = document.getElementById("order_by_cat");
        if (t.textContent == "▲") t.textContent = "▼";
        else t.textContent = "▲";
        search_func();
      })
      $("#order_by_dis").click(function (){
        var t = document.getElementById("order_by_dis");
        if (t.textContent == "▲") t.textContent = "▼";
        else t.textContent = "▲";
        search_func();
      })
}())

;(function () {
    $("#edit_location_btn").click(function () {
        $.post("/edit_location", {
          latitude: $("#edit_latitude").val(),
          longitude: $("#edit_longitude").val()
        }).done(function (data, status) {
          if (data.result == "s") {
            document.getElementById("user_location").textContent = data.location;
          } else {
            alert(data.result);
          }
        })
      })
}())



function open_menu(SID) {

  $.post("/load_product_info", {SID: SID}).done(
    function(data, status){      
      var display_html = "";
      for (var i = 0; i < data.result.length; i++) {
        display_html += `<tr>`;
        display_html += `<th scope="row">` + (i+1) + "</th>";
        display_html += `<td><img src = '` + data.result[i].image + `' width="50" heigh="10"></td>`;
        display_html += `<td id = "food_name` + i + `">` + data.result[i].mealname + `</td>`;
        display_html += `<td id = "food_price` + i + `">` + data.result[i].price + `</td>`;
        display_html += `<td>` + data.result[i].quantity + `</td>`;
        display_html += `<td> <input id="food_amount` + i + `"></td>`;
        
        display_html += `</tr>`;
      }
      //calculate_price(data.name, data.result.length);
      $("#the_price").html("");
      $("#menu_context").html(display_html);

      var btn =  `<div class="modal-footer">\n`
                  +`<td><button type="button" class="btn btn-default" 
                  onClick = calculate_price("${SID}",${data.result.length})>`
                  + `Calculate price</button></td>\n`
                  + "</div>";
      document.getElementById("calculate_price_btn").innerHTML = btn;
      
      btn =  `<div class="modal-footer">\n`
                  +`<td><button type="button" class="btn btn-default" data-dismiss="modal" 
                  onClick = build_order(${SID},${data.result.length})>`
                  + `Order</button></td>\n`
                  + "</div>";
      document.getElementById("build_order_btn").innerHTML = btn;
    })

}

function calculate_price(SID, length) {
  $.post("/search_product", {SID: SID}).done(      
    function(data, status){
      var alert_text = "";
      if (data.result.length == 0) {
        alert_text += "This shop doesn't have any meals available now!\n";
      }
      var food = {};
      for (var i = 0; i < data.result.length; i++) {
        food[data.result[i].mealname] = data.result[i];
      }

      var display_html = "";
      var subtotal = 0;
      for (var i = 0; i < length; i++) {
        var product_name = document.getElementById("food_name" + i).textContent;
        if ((product_name in food) == false){
          alert_text += product_name + " not exsists!\n";
          continue;
        }

        var order_amount = $("#food_amount" + i).val();        
        if (order_amount == "") order_amount = 0;
        order_amount = Number(order_amount);
        if (order_amount < 0 || order_amount%1!=0 || isNaN(order_amount)) {
          alert_text += "Invailid order for " + product_name + "\n";
          continue;
        }
        if (food[product_name].quantity < order_amount) {
          alert_text += "Not enough stock for " + product_name + "!\n";
          continue;
        }

        subtotal += food[product_name].price * order_amount;
      }

      var fee = 0;
      if ($("#delivery_pickup").val() == "Delivery") {
        var dis = document.getElementById(`shop${SID}_distance`).textContent;
        dis = dis.substring(0, dis.length-2);
        fee = parseFloat(dis) * 10;
        if (fee < 10) fee = 10;
      }
      
      if (alert_text.length != 0) {
        alert(alert_text);
        display_html += "<p>The price of valid order: </p>";
      }
      display_html += "<p>Subtotal&emsp;$" + subtotal + "</p>";
      display_html += "<p>Delivery fee&emsp;$" + fee + "</p>";
      display_html += "<p id = 'total_price'>Total Price&emsp;$" + (subtotal + fee) + "</p>";
      
      $("#the_price").html(display_html);
    })
}

function build_order(SID, length){
  $.post("/search_product", {SID: SID}).done(      
    function(data, status){
      var alert_text = "";
      if (data.result.length == 0) {
        alert_text += "This shop doesn't have any meals available now!\n";
      } 
      var food = {};
      for (var i = 0; i < data.result.length; i++) {
        food[data.result[i].mealname] = data.result[i];
      }

      var display_html = "";
      var subtotal = 0;
      for (var i = 0; i < length; i++) {
        var product_name = document.getElementById("food_name" + i).textContent;
        if ((product_name in food) == false){
          alert_text += product_name + " not exsists!\n";
          continue;
        }

        var order_amount = $("#food_amount" + i).val();        
        if (order_amount == "") order_amount = 0;
        order_amount = Number(order_amount);
        if (order_amount < 0 ||  order_amount%1!=0 || isNaN(Number(order_amount))) {
          alert_text += "Invailid order for " + product_name + "\n";
          continue;
        }
        if (food[product_name].quantity < order_amount) {
          alert_text += "Not enough stock for " + product_name + "!\n";
          continue;
        }

        subtotal += food[product_name].price * order_amount;
      }

     

      var fee = 0, dis=0;
      if ($("#delivery_pickup").val() == "Delivery") {
        dis = document.getElementById(`shop${SID}_distance`).textContent;
        dis = parseFloat(dis.substring(0, dis.length-2));
        fee = dis * 10;
        if (fee < 10) fee = 10;
      }


      var total = parseInt(subtotal + fee);
      display_html += "<p>Subtotal&emsp;$" + subtotal + "</p>";
      display_html += "<p>Delivery fee&emsp;$" + fee + "</p>";
      display_html += "<p id = 'total_price'>Total Price&emsp;$" + total + "</p>";

      if (total > data.money) {
        alert_text += "You don't have enough money to buy these foods!"
        flg = false;
      }

      if (alert_text.length != 0) {
        
        display_html += "<p>The price of valid order: </p>";
      }
      
      $("#the_price").html(display_html);

      if (alert_text.length != 0) {
        alert(alert_text);
        return;
      }else if(subtotal == 0){
        alert("Nothing chosen!");
        return;
      }

      var food_in_order = [];
      for (var i = 0; i < length; i++) {
        var product_name = document.getElementById("food_name" + i).textContent;
        var order_amount = $("#food_amount" + i).val();
        var order_price = document.getElementById("food_price" + i).textContent;
        if (order_amount != 0) 
          food_in_order.push([product_name, order_amount, order_price]);
      }
      
      
      $.post("/build_order", {SID: SID, distance: dis, subtotal: subtotal, fee: fee, foods: food_in_order}).done(
        function (data, status) {
          document.getElementById("user_wallet").textContent = data.wallet;
          alert("Successfully ordered!");          
        }
      );
      
    })
}

function Add_value() {
  var value = $("#Add_value").val();
  if (value <= 0 || value%1!=0) {
    alert("Invalid recharge");
    return;
  }
  $.post("/Add_value", {value: value}).done(
    function(data, status) {
      document.getElementById("user_wallet").textContent = data.wallet;
      alert("Recharge success!");
    }
  );
  
}

function Search_MyOrder(){
  var my_filter = $("#MyOrder_fiter").val();
  $.post("/Search_MyOrder", {my_filter: my_filter}).done(
    function(data, status){
      
      var display_html = "";
      for (var i = 0; i < data.result.length; i++) {
        display_html += "<tr>";
        display_html += "<th scope = 'row'>" + data.result[i].OID + "</th>";

        display_html += "<td>"
        if (data.result[i].status == "N") display_html += "Not Finished";
        else if (data.result[i].status == "F") display_html += "Finished";
        else if (data.result[i].status == "C") display_html += "Canceled";
        display_html += "</td>";
        
        var start_time = new Date(data.result[i].start).toLocaleString();
        display_html += "<td>";
        display_html += start_time;
        display_html += "</td>";

        
        if (data.result[i].end != null) {
          var end_time = new Date(data.result[i].end).toLocaleString();
          display_html += "<td>";
          display_html += end_time;
          display_html += "</td>";
        }
        else display_html += "<td>null</td>";
          
        
        display_html += "<td>" + data.result[i].shopname + "</td>";
        display_html += "<td>" + (parseInt(data.result[i].subtotal) + parseInt(data.result[i].fee)) + "</td>";
        display_html += `<td><button type='button' class='btn btn-info' data-toggle="modal" 
          data-target="#MyOrder_details"
          onClick = open_order_details(${data.result[i].OID})`
          + `>Order Details</button></td>`;
        if (data.result[i].status == "N") {
          display_html += `<td><input type = "checkbox" class = "Cancel_order" value = ${data.result[i].OID}> Cancel</td>`;
        }
      }
      $("#MyOrder_result").html(display_html);      
    }
  )
}

function open_order_details(OID){
  $.post("/Search_Order", {OID: OID}).done(      
    function(data, status){
      var food_context = "";
      for (var i = 0; i < data.foods.length; i++) {
        food_context += `<tr>`;
        food_context += `<td><img src = '${data.foods[i].image}' width="50" heigh="10"></td>`;
        food_context += `<td id = "food_name${i}">${data.foods[i].mealname}</td>`;
        food_context += `<td id = "food_price${i}">${data.foods[i].price}</td>`;
        food_context += `<td>${data.foods[i].quantity}</td>`;        
        food_context += `</tr>`;
      }
      $("#MyOrder_details_context").html(food_context);
      var display_html = "";
      display_html += `<h4>Subtotal&emsp;$ ${data.result.subtotal}</h4>`;
      display_html += `<h5>Delivery fee&emsp;$ ${data.result.fee}</h5>`;
      display_html += `<h4 id = 'total_price'>Total Price&emsp;$ ${data.result.subtotal+data.result.fee}</h4>`;
      $("#MyOrder_details_price").html(display_html);
    })

}

function Cancel_orders(){
  var choose = document.getElementsByClassName("Cancel_order");
  var orders = [];
  if(choose.length ==0) return;
  for (var i = 0; i < choose.length; i++) {
    if (choose[i].checked) orders.push(choose[i].value);
  }
  $.post("/Cancel_orders", {orders:orders}).done(
    function (data, status) {
      if (data.alert_text.length != 0) alert(data.alert_text);  
      document.getElementById("user_wallet").textContent = data.wallet;
      Search_MyOrder();
    }
  )
}
