#! c:\progra~1\nodejs\node.exe

var request = require("superagent");
var async = require("async");
var _ = require("underscore");
var sales_summary = require("sales_summary").sales_summary;
var lastSixMonths = require("sales_summary").lastSixMonths;


async.parallel( {
stock_in_the_channel: function(callback){
        request.get("http://139.162.247.66:3000/products.json")
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
        request.get("http://192.168.1.127:3000/collections/invoices")
        .set('Accept', 'application/json')
        .end(function(err,resp){
          callback(null,resp.body);
        });

}

},function(err,results){
        /*
 _.chain(results)
               .values()
               .map(function(content) { 
                       console.log(content)
               }); 
               */
 _.each(results["stock_in_the_channel"],function(sitc_product){

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
         //console.log(sitc_product.stock_in_the_channel);
           report_row += sitc_product.stock_in_the_channel + ",";
           var all_sales = sales_summary(results["local_invoices"],sitc_product.sku)
                   var last_sales = ""
                   lastSixMonths().forEach(function(month){
                                   report_row += all_sales[month] + ","

                   });
         
         console.log(report_row);  
 });
                 
});
