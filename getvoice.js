var express = require('express');
var bodyParser = require('body-parser');
var urlencode = require('urlencode');

var request = require('request');

var app  = express();
var http = require('http');
var server = http.createServer(app);

var apiip = "140.123.101.168";
var apiport = "3585";
var querystring = require("querystring");

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({
    extended: true
}));


app.get('/convert2voice/v1.0/',function(req,res){
    var str = req.query.q;
    var result = querystring.stringify({str:str});
    console.log('http://char.iis.sinica.edu.tw/API/pinyin_SQL.aspx?'+result+'&choose=1');
    //http://zh.pttpedia.wikia.com/wiki/PTT%E9%84%89%E6%B0%91%E7%99%BE%E7%A7%91
    //http://char.iis.sinica.edu.tw/API/pinyin.htm
    request({
        uri:'http://char.iis.sinica.edu.tw/API/pinyin_SQL.aspx?'+result+'&choose=1',
    },function(error, response, body){
        res.send(body);
    });
    
});

//server process
process.on('SIGINT', function () {
    console.log("[Server stop] ["+new Date()+"] http stop at "+apiip+":"+apiport);
    process.exit(0);
});
process.on('SIGTERM', function () {
    console.log("[Server stop] ["+new Date()+"] http stop at "+apiip+":"+apiport);
    process.exit(0);
});
server.listen(apiport,apiip,function(){
    console.log("[Server start] ["+new Date()+"] http work at "+apiip+":"+apiport);
});
