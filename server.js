var express = require('express');
var S = require("string");
var bodyParser = require('body-parser');
var urlencode = require('urlencode');
var iconv = require('iconv-lite');
var app  = express();
var http = require('http');
var server = http.createServer(app);
var Es = require("./es_command");
var detectVoice = require("./detectVoice");
/*
var elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client({
            host: 'localhost:2468'
});
*/
var LineByLineReader = require('line-by-line');
var HashMap = require('hashmap');
var map_term = new HashMap();


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
var dict_name="./dict/idf_all.dic";
ReadDict(dict_name,function(result){
    console.log("READ DICT DONE:"+dict_name+" status:"+result)
});

function ReadDict(filename,fin){
    //ReadLine
    var options = {
        //encoding: 'utf8',
        skipEmptyLines:false
    }
    var lr = new LineByLineReader(filename,options);
    iconv.skipDecodeWarning = true;
    lr.on('error', function (err) {
        // 'err' contains error object
        console.log("error:"+err);
    });
    lr.on('line', function (line) {
        var datas = line.split(" ");
        map_term.set(datas[0],datas[2]);
        console.log(datas[0]+":"+datas[2]);
    });
    lr.on('end', function () {
        // All lines are read, file is closed now.
        fin("ok");
    });
}
app.get('/pei_es/search/:source?/:board?/:column/',function(req,res){
    var column = req.params.column;
    var pattern = req.query.q;
    
    //var pattern = req.params.q;
    var source,board,search_t,not_t;
    var search_pattern,not_pattern;
    var cnt,not_cnt;
    if(!req.params.source){
        source = "ptt";
        board = "gossip";
    }
    else if(req.params.source=="ptt"){
        if(!req.params.board){
            res.send("Need board name");
            return;
        }
    }

    source = req.params.source;
    board = req.params.board;
    search_t = pattern.split(" ");
    search_pattern="";not_pattern="";
    not_cnt=0;
    cnt=0;
    for(i=0;i<search_t.length;i++){
        not_t  = search_t[i].split("-");
        if(search_t[i]==""){continue;}

        if(not_t.length==1){
            if(cnt==0){
                search_pattern += "+"+search_t[i];
            }
            else{
                search_pattern += " +"+search_t[i];
            }
            cnt++;
        }
        else{
            search_pattern += " -"+not_t[1];
            not_cnt++;
        }

    }
    console.log("pattern:"+search_pattern+" not pattern:"+not_pattern+"source:"+source+" board:"+board);
    
    Es.EsSearch(source,board,column,search_pattern,not_pattern,function(result){
        var hits = result.hits;
        var result_cnt = hits.total; 
        var source = hits.hits;
        var pattern_temp = "";
        var not_pattern_temp = "";
        //var result = JSON.stringify(hits);
        if(hits.total==0){
            pattern_temp = S(search_pattern).strip('"',"+","||").s;
            /*
            not_pattern_temp = pattern_temp.split(" ");
            for(i=0;i<not_pattern_temp.length;i++){
                if(not_pattern_temp[i][0]=="-"){
                    temp += " -"+not_pattern_temp;
                }
            }
            */
            console.log("convert:"+pattern_temp+" not pattern:"+not_pattern_temp);
            detectVoice.detectVoice(map_term,"convert",pattern_temp,not_pattern_temp,source,board,column,res,function(output){
                res.send(output);
            });
        }
        else{
            /*
            pattern_temp = S(search_pattern).strip('"').s;
            not_pattern_temp = S(not_pattern).strip('"').s;
            console.log("seacrh:"+pattern_temp+" not:"+not_pattern_temp);
            detectVoice.detectVoice("get",pattern_temp,not_pattern_temp,source,board,column,res,function(output){
                res.send(output+"result count:"+hits.total+"\nresult:\n"+JSON.stringify(result)+"\n");
            });
            */
            output = JSON.stringify({"result_count":hits.total,"convert":"no","convert_term":"<none>","result":result});
            res.send(output);
            //res.send("result count:"+hits.total+"\nresult:\n"+JSON.stringify(result)+"\n");

        }
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
