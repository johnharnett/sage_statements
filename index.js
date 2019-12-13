#! c:\progra~1\nodejs\node.exe

var fs = require("fs");
var Slack = require('slack-node');
var webhookUri = "https://hooks.slack.com/services/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"

var slack = new Slack();
slack.setWebhook(webhookUri);


var today = new Date();
var dd = today.getDate();
var mm = today.getMonth()+1; //January is 0!
var yyyy = today.getFullYear();

if(dd<10) {
    dd = '0'+dd
} 

if(mm<10) {
    mm = '0'+mm
} 

today = '_' + mm + '_' + dd + '_' + yyyy;



function sendToSlack(text){

slack.webhook({
  channel: "#accounting",
  username: "accounting_webhook",
  text: text
}, function(err, response) {
  console.log(response);
});

}

var   rs =   fs.createReadStream('c:\\product_enquirer_input\\sage_50_export_statements.xml')

rs.on('error',function() {
        sendToSlack("error reading sage statements")

})
rs.pipe(fs.createWriteStream('\\\\LocateStore\\Accounts2\\sage_50_export_statements'+ today + '.xml'));

rs.on('close', function(){
        sendToSlack("sent export statements to network")
});

