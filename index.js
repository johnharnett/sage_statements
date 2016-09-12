#! c:\progra~1\nodejs\node.exe

var request = require("superagent");
var async = require("async");
var _ = require("underscore");
var sales_summary = require("sales_summary").sales_summary;
var lastSixMonths = require("sales_summary").lastSixMonths;
var fs = require("fs");
var moment = require("moment");

var manufacturers = ["LEN","TOSH"]

var len_file_name = "\\\\LOCATESTORE\\Gerry\\snc\\" + moment().format("YYYY_MM_DD__HH_mm") + "len_stock_news.csv";
var tosh_file_name = "\\\\LOCATESTORE\\Gerry\\snc\\" + moment().format("YYYY_MM_DD__HH_mm") + "tosh_stock_news.csv";
var top_line= "Product Code,FreeStock,Channel,"
lastSixMonths().forEach(function(month){
 top_line += month +",";
})

fs.writeFileSync(len_file_name, top_line + "Action\n");
fs.writeFileSync(tosh_file_name, top_line + "Action\n");



async.parallel( {
stock_in_the_channel: function(callback){
        request.get("http://johnharnett.co.uk/products.json")
        .set('Accept', 'application/json')
        .end(function(err,resp){
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
           var all_sales = sales_summary(results["local_invoices"],sitc_product.sku)
                   var last_sales = ""
                   lastSixMonths().forEach(function(month){
                                   report_row += all_sales[month] + ","

                   });
         
         console.log(report_row);  
         if (sitc_product.sku.indexOf("LEN") == 0) {
         fs.appendFileSync(len_file_name ,report_row + '\n','utf-8',function(err){
                 if (err){ fs.writeFileSync("err.file",err)}

         });
         }
         else{
         fs.appendFileSync(tosh_file_name ,report_row + '\n','utf-8',function(err){
                 if (err){ fs.writeFileSync("err.file",err)}

         });

         }
 });
                 
});
