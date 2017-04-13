#! c:\progra~1\nodejs\node.exe

var request = require("superagent");
var async = require("async");
var _ = require("underscore");
var fs = require("fs");
var moment = require("moment");
var Slack = require('slack-node');
var config = require("config");

var slack = new Slack();
slack.setWebhook(config.slack.webhookUri);

function sendToSlack(text){

slack.webhook({
  channel: config.slack.channel_name,
  username: config.slack.bot_name,
  text: text
}, function(err, response) {
  console.log(response);
});

}

var manufacturers = ["HP"]
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

var hp_file_name = config.output.dir + moment().format("YYYY_MM_DD__HH_mm") + "_hp_competitors.csv";
var top_line= "Product Code,in sage?,stock in Channel(suppliers),stock in Channel (Competitors),(suppliers) days_left_s3,(suppliers) days_left_s4,Namb_days_left_s3,Namb_days_left_s4,Comp_days_left_s3,Comp_days_left_s4,"
fs.writeFileSync(hp_file_name, top_line + "\n");

async.parallel( {
stock_in_the_channel: function(callback){
        request.get("https://locate.johnharnett.co.uk/products.json")
        .set('Accept', 'application/json')
        .set('X-Sitc', 'asdf;l;l')
        .end(function(err,resp){
           if (err){
            sendToSlack("error retrieving stock_in_the_channel data from   johnharnett.co.uk"); 
            console.log(Object.keys(err));
           }
           else{ 
             callback(null,resp.body);
           }
        });
},
local_products: function(callback){
        request.get("http://localhost:3000/collections/cate")
        .set('Accept', 'application/json')
        .end(function(err,resp){
           if (err){
            sendToSlack("error retrieving skus from local server "); 
            console.log(Object.keys(err));
           }
           else{ 
             callback(null,resp.body);
           }
        });
}
},function(err,results){
        if (err){

                sendToSlack("err in getting hp stock news => " + err);

                return
        }
        sendToSlack("writing hp stock news in the channel data for " + results["stock_in_the_channel"].length + " skus")
  var sorted_stock_in_the_channel = _.sortBy(results["stock_in_the_channel"],function(sitc_product){return sitc_product.sku});
 _.each(sorted_stock_in_the_channel,function(sitc_product){

         var report_row = sitc_product.sku + ",";

         var product_sku = _.find(results["local_products"],function(item){ 
                 return item.Sku == sitc_product.sku
         });



         if (typeof product_sku == 'undefined'){
                 console.log("product not in sage");
//                 sendToSlack(sitc_product.Sku + " not found in sage (whilst writing stock report)");
           report_row += "No,";
         }
         else{
           
           report_row += ",";

         }
           report_row += sitc_product.stock_in_the_channel + ",";
           report_row += sitc_product.stock_in_the_channel_from_competitors + ",";
           report_row += sitc_product.stock_days_in_the_channel_based_on_3 + ",";
           report_row += sitc_product.stock_days_in_the_channel_based_on_4 + ",";
           report_row += sitc_product.n_stock_days_in_the_channel_based_on_3 + ",";
           report_row += sitc_product.n_stock_days_in_the_channel_based_on_4 + ",";
           report_row += sitc_product.competitor_stock_days_in_the_channel_based_on_3 + ",";
           report_row += sitc_product.competitor_stock_days_in_the_channel_based_on_4 + ",";
         
         console.log(report_row);  
         switch(sitc_product.sku.slice(0,2)){
                 case "HP":
         fs.appendFileSync(hp_file_name ,report_row + '\n','utf-8',function(err){
                 if (err){ fs.writeFileSync("err.file",err)}

         });
                break;

                default:
               console.log("not found a place to put " + sitc_product.sku);
                  
//                       sendToSlack("not found a place to put " + sitc_product.sku);
                  


         }
 });
                 
});
