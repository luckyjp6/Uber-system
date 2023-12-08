; (function () {
  $("#addbtn").click(function () {
    const mealname = document.getElementById("add1");
    const price = document.getElementById("add2");
    const quantity = document.getElementById("add3");
    const files = document.getElementById("myFile");
    var formData = new FormData();
    formData.append('mealname', mealname.value);
    formData.append('price', price.value);
    formData.append('quantity', quantity.value);
    formData.append('file', files.files[0]);
    $.ajax({
      url: "/addProduct",
      data: formData,
      processData: false,
      contentType: false,
      type: "POST",

      success: function (data) {
        //console.log(data.products.length)
        load_pdt(data.products);

        if (data.status == "") {
          alert("product added success!");
          mealname.value = "";
          price.value = "";
          quantity.value = "";
          files.value = "";
        } else alert(data.status);

      }
    });
  })
}())

  ; (function () {
    // register shop
    $("#regshpbtn").click(function () {
      $.post("/registershop", {
        shopname: $("#shp1").val(),
        category: $("#shp2").val(),
        longitude: $("#shp3").val(),
        latitude: $("#shp4").val(),
      }).done(function (data, status) {
        if (data.status === "u") {
          alert("please login!");
          window.location.replace("/");
        }
        else if (data.status === "o") {
          alert("shop register success");
          document.getElementById("shp1").disabled = true;
          document.getElementById("shp2").disabled = true;
          document.getElementById("shp3").disabled = true;
          document.getElementById("shp4").disabled = true;
          document.getElementById("regshpbtn").disabled = true;

        } else {
          alert(data.status);
        }
      })
    })
  }())



function editProduct(mealname) {

  let m = convert_back(mealname)

  document.getElementById("PdtEditLabal").textContent = m + ' Edit';
  //console.log(mealname);
  document.getElementById("editPdt").onclick= function(){edit(m);};
   

}


function deleteProduct(meal_name) {

  let mealname=convert_back(meal_name)
  $.post("/deleteProduct", {
    mealname: mealname,
  }).done(
    function(data, status) {
      if (data.status === "") {
        alert("Product deleted!");
        load_pdt(data.products);
      } else {
        alert("Somthing went wrong");
      }
    
  })
}

function edit(mealname) {

  $.post("/editProduct", {
    mealname: mealname,
    price: $("#ex72").val(),
    quantity: $("#ex42").val()
  }).done(
    function(data, status) {

      if (data.status === "") {
        alert("Product edited success!");
        load_pdt(data.products);
      } else {
        alert(data.status);
      }
    
  })
}

function load_shop(){
  $.post("/load_shop").done(function(data,status){
    load_pdt(data.pdt);
  })
}


function load_pdt(pdt) {

  var html = "";

  for (let i = 0; i < pdt.length; ++i) {

    let mealname = convert_name(pdt[i].mealname); // from " " to "_"

    html += '<tr><th scope="row">' + (i + 1) + '</th>';
    html += '<td><img src=' + '"' + pdt[i].image + '"' + 'width="120" height="120" alt=' + '"' + pdt[i].mealname + '"' + '></img></td>';
    html += '<td>' + mealname + '</td>';
    html += '<td>' + pdt[i].price + '</td>';
    html += '<td>' + pdt[i].quantity + '</td>';
    html += '<td><button type="button" class="btn btn-info" data-toggle="modal" data-target=' + '"#editProduct" onclick=editProduct(' + '"' + mealname + '"'+')>';
    html += 'Edit' + ' </button></td>';
    html += '<td><button type="button" class="btn btn-danger" onclick=deleteProduct(' + '"' + mealname + '"' + ')>Delete</button></td>';
    html += '</tr>';
  }
  //console.log(html);
  $("#shpProducts").html(html);
}