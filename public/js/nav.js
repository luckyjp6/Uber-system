; (function () {
  
  $.post("/load_info")
    .done(function (data, status) {
      if (data.status === "u") {
        alert("please login!");
        window.location.replace("/");
      }
      else {
        document.getElementById("user_account").textContent = data.account;
        document.getElementById("user_name").textContent = data.name;
        if (data.identity === 's') {
          document.getElementById("user_identity").textContent = "manager";
          document.getElementById("shp1").placeholder = data.shopname;
          document.getElementById("shp2").placeholder = data.category;
          document.getElementById("shp3").placeholder = data.longitude;
          document.getElementById("shp4").placeholder = data.latitude;
          document.getElementById("shp1").disabled = true;
          document.getElementById("shp2").disabled = true;
          document.getElementById("shp3").disabled = true;
          document.getElementById("shp4").disabled = true;
          document.getElementById("regshpbtn").disabled = true;
          load_pdt(data.product);
        } else {
          document.getElementById("user_identity").textContent = "user";
        }
        document.getElementById("user_phone_number").textContent = data.phone;
        document.getElementById("user_wallet").textContent = data.wallet;
        document.getElementById("user_location").textContent = data.location;
      }
    })
    
}())

  ; (function () {
    $(document).ready(function () {
      $(".nav-tabs a").click(function () {
        $(this).tab('show');
      });
    });
  }())


; (function () {

  $("#logout_btn").click(function () {
    sessionStorage.clear();
    window.location.replace("/");
  })

}())

; (function () {
  $("#shp1").bind("input propertychange", function(){
    $.post("/check_name_used",{name: $("#shp1").val()})
      .done( function(data, status){
        var new_text = "";
        if (data.status == "u") new_text = "Shopname has been registered!";
        document.getElementById("shopname_used").textContent = new_text;
      })
  })
  }())


  function convert_name(name){

    let converted="";
    for(let i=0;i<name.length;++i){
        if(name[i]==" ") converted+="_";
        else converted += name[i];
    }
    
    return converted;
}

function convert_back(name){
  let converted="";
    for(let i=0;i<name.length;++i){
        if(name[i]=="_") converted+=" ";
        else converted += name[i];
    }
    
    return converted;
}