#! c:\progra~1\nodejs\node.exe

var request = require("superagent");
var async = require("async");
var _ = require("underscore");
var sales_summary = require("sales_summary").sales_summary;
var lastSixMonths = require("sales_summary").lastSixMonths;
var fs = require("fs");
var moment = require("moment");

var manufacturers = ["LEN","TOSH","DELL","HP"]
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

var len_file_name = "\\\\LOCATESTORE\\Gerry\\snc\\" + moment().format("YYYY_MM_DD__HH_mm") + "_len_stock_news.csv";
var tosh_file_name = "\\\\LOCATESTORE\\Gerry\\snc\\" + moment().format("YYYY_MM_DD__HH_mm") + "_tosh_stock_news.csv";
var dell_file_name = "\\\\LOCATESTORE\\Gerry\\snc\\" + moment().format("YYYY_MM_DD__HH_mm") + "_dell_stock_news.csv";
var hp_file_name = "\\\\LOCATESTORE\\Gerry\\snc\\" + moment().format("YYYY_MM_DD__HH_mm") + "_hp_stock_news.csv";
var top_line= "Product Code,FreeStock,Channel,days_left_s3,Beta,Namb,Comp,"
lastSixMonths().slice(0,4).forEach(function(month){
 top_line += month +",";
})
top_line += "QtyOnOrder," 

fs.writeFileSync(len_file_name, top_line + "Action\n");
fs.writeFileSync(tosh_file_name, top_line + "Action\n");
fs.writeFileSync(dell_file_name, top_line + "Action\n");
fs.writeFileSync(hp_file_name, top_line + "Action\n");

function addQtyOnOrderToOutputRow(product_sku,report_row){
         if (typeof product_sku != 'undefined'){
          // console.log(product_sku.QtyInStock);
         report_row += product_sku.QtyOnOrder + ","
         }
         else{
           report_row += "product not available,";
         }
         return report_row;
          
}

async.parallel( {
stock_in_the_channel: function(callback){
        request.get("https://locate.johnharnett.co.uk/products.json")
        .set('Accept', 'application/json')
        .set('X-Sitc', 'asdf;l;l')
        .end(function(err,resp){
           if(err != null){ 
            console.log(Object.keys(err));
           }
          callback(null,resp.body);
        });
},
local_products: function(callback){
        request.get("http://192.168.1.127:3000/collections/cate")
        .set('Accept', 'application/json')
        .end(function(err,resp){
          callback(null,resp.body);
        });
},
local_invoices: function(callback){
        request.get("http://192.168.1.127:3001/collections/invoices")
        .set('Accept', 'application/json')
        .end(function(err,resp){
          callback(null,resp.body);
        });

}

},function(err,results){
  var sorted_stock_in_the_channel = _.sortBy(results["stock_in_the_channel"],function(sitc_product){return sitc_product.sku});
 _.each(sorted_stock_in_the_channel,function(sitc_product){

         var report_row = sitc_product.sku + ",";

         var product_sku = _.find(results["local_products"],function(item){ 
                 return item.Sku == sitc_product.sku
         });



         //console.log(sitc_product.sku);
         if (typeof product_sku != 'undefined'){
          // console.log(product_sku.QtyInStock);
           report_row += product_sku.QtyInStock + ",";
         }
         else{
                 console.log("product not in sage");
           report_row += "not found in sage,";
         }
           report_row += sitc_product.stock_in_the_channel + ",";
           report_row += sitc_product.stock_days_in_the_channel_based_on_3 + ",";
           report_row += sitc_product.stock_in_the_channel_from_external_b + ",";
           report_row += sitc_product.stock_in_the_channel_from_external_n + ",";
           report_row += sitc_product.stock_in_the_channel_from_competitors + ",";
           var all_sales = sales_summary(results["local_invoices"],sitc_product.sku)
                   var last_sales = ""
                   lastSixMonths().slice(0,4).forEach(function(month){
                                   report_row += all_sales[month] + ","

                   });
         //quantity on order
         report_row = addQtyOnOrderToOutputRow(product_sku,report_row);
         
         console.log(report_row);  
         switch(sitc_product.sku.slice(0,2)){
                 case "HP":
         fs.appendFileSync(hp_file_name ,report_row + '\n','utf-8',function(err){
                 if (err){ fs.writeFileSync("err.file",err)}

         });
                break;
                 case "LE":
         fs.appendFileSync(len_file_name ,report_row + '\n','utf-8',function(err){
                 if (err){ fs.writeFileSync("err.file",err)}

         });
                break;
                case "TO":
         
         fs.appendFileSync(tosh_file_name ,report_row + '\n','utf-8',function(err){
                 if (err){ fs.writeFileSync("err.file",err)}

         });
                break;
                case "DE":
         
         fs.appendFileSync(dell_file_name ,report_row + '\n','utf-8',function(err){
                 if (err){ fs.writeFileSync("err.file",err)}

         });
                break;
                default:
               throw "not found a place to put " + sitc_product.sku
                  

         }
 });
                 
});
