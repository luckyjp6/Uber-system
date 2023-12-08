function tradeFilter(){

    $.post("trade_filter",{
        filter:$("#tf").val()
    }).done( function(data, status){
        load_records(data.records);
    })
    
}

function load_records(records){
    let html="";
    for(let i=0;i<records.length;++i){
        var record_time = new Date(records[i].time).toLocaleString();
        html += '<tr><th scope="row">' + records[i].RID + '</th>';
        html += '<td>' + records[i].action + '</td>';
        html += '<td>' + record_time + '</td>';
        html += '<td>' + records[i].trader + '</td>';
        if(records[i].amount_change>0){
        html += '<td>+' + records[i].amount_change + '</td>';
        }else html += '<td>' + records[i].amount_change + '</td>';
    }
    $("#tfr").html(html);
}