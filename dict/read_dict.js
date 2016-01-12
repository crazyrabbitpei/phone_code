var express = require('express');
var iconv = require('iconv-lite');
var bodyParser = require('body-parser');
var urlencode = require('urlencode');

var request = require('request');
var app  = express();
var http = require('http');
var server = http.createServer(app);
var apiip = "140.123.101.168";
var apiport = "3585";

var querystring = require("querystring");
var LineByLineReader = require('line-by-line');
var S = require('string');
var fs = require('fs');

var HashMap = require('hashmap');
var map_word = new HashMap();
var keydic = "key.code";
var map_key  = new HashMap();


app.use(bodyParser.json());

app.use(bodyParser.urlencoded({
    extended: true
}));

ReadKeyCode(keydic,function(r){
    console.log("READ KEY CODE DONE");
});

app.get('/init/dict/v2.0/',function(req,res){
    var filename = req.query.q;
    ReadDic("./dict_revised_2014_20151014/"+filename,function(result){
        console.log("READ DIC DONE:"+filename+" status:"+result);
        res.send("READ DIC DONE:"+filename+" status:"+result);
        process.exit();
    });
});

app.get('/phone_code/v2.0/:type(code|word)',function(req,res){
    var str = req.query.q;
    var type = req.params.type;
    var result = new Array();
    var temp="",temp1="";

    if(type=="code"){//getByCode
    
    }
    else if(type=="word"){//getByWord
        console.log("Get:"+str);
        //result+=map_word.get(str);

        var cnt_set=1;
        var words = str.split("");
        var max_word=1;
        var index;
        var q=0;
        for(i=0;i<words.length;i++){
            temp = map_word.get(words[i]);
            temp = temp.split("~");
            if(i==0){
                cnt_set = temp.length;
            }
            if(temp.length>max_word){
                max_word = temp.length;
            }
            //console.log("cnt_set:"+cnt_set);
            var flag=1;

            for(j=0;j<temp.length;j++){
                index=0;
                q=0;
                if(i==0){
                    result[j] = temp[j];
                }
                else if(i!=0){
                    if(flag==1){
                        temp1 = map_word.get(words[i-1]);
                        temp1 = temp1.split("~");
                        last_cnt_set=cnt_set;
                        cnt_set=cnt_set*temp.length;
                        //console.log("cnt_set:"+cnt_set);
                        flag=0;
                    }
                    //console.log("temp["+j+"]:"+temp[j]);
                    for(k=0;k<cnt_set;k++){
                        //console.log("result["+k+"]:"+result[k]);
                        if(typeof result[k]=="undefined"){
                            if(j!=0){
                                if(temp.length>temp1.length){
                                    if(q==last_cnt_set){
                                        //console.log("last_cnt_set:"+last_cnt_set);
                                        j++;
                                        q=0;
                                    }
                                }
                                else{
                                    if(q==cnt_set){
                                        //console.log("last_cnt_set:"+last_cnt_set);
                                        j++;
                                        q=0;
                                    }
                                }
                                //console.log("["+index+"]replace:"+result[index]);
                                //console.log("=>"+temp[j-1]);
                                //console.log("<="+temp[j]);
                                result[k] = result[index].replace(temp[j-1],"");
                                result[k] += temp[j];
                                q++;
                                index++;
                            }
                            /*
                            else{
                                result[k] += result[index];
                                console.log("~>"+result[k]);
                            }
                            */

                        }
                        else{
                            if(j==0){
                                result[k] += temp[j];
                                //console.log(result[k]);
                            }
                            /*
                            if(j!=0){
                                result[k] = result[k].replace(temp[j-1],"");
                                result[k] += temp[j];
                                console.log(result[k]);
                            }
                            */
                        }
                    }
                }
            }
        }
    }
    //console.log("result:"+result);
    res.send(result);
    
});

var cnt=0;
function ReadDic(filename,fin){
    var temp="";
    var code;
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
        fin("error");
    });
    lr.on('line', function (line) {
        //console.log("--"+line);
        cnt++;
        var datas = line.split(",");
        if(datas[0]==1){
            var voice=datas[2];
            var sv = "";
            var word = datas[1];
            if(word=="_"||word.indexOf("&")!=-1){
                return;
            }
            var len = S(voice).length;
            var find_value = map_word.get(word);
            code="";
            if(typeof find_value=="undefined"){
                for(i=0;i<S(voice).length;i++){

                    temp = map_key.get(voice[i]);
                    if(typeof temp !="undefined"){
                        code+=temp;
                    }
                    else if(voice[i]!=" "){
                        code+=voice[i];
                    }
                    if(voice[i]==" "&&(voice[i-1]!='ˇ'&&voice[i-1]!='ˋ'&&voice[i-1]!='ˊ')){
                        code+=" ";
                    }
                }
                //console.log(word+","+voice+"\t"+code);
                map_word.set(word,code);
            }
            else{
                for(i=0;i<S(voice).length;i++){
                    temp = map_key.get(voice[i]);
                    if(typeof temp !="undefined"){
                        code+=temp;
                    }
                    else if(voice[i]!=" "){
                        code+=voice[i];
                    }
                    if(voice[i]==" "&&(voice[i-1]!='ˇ'&&voice[i-1]!='ˋ'&&voice[i-1]!='ˊ')){
                        code+=" ";
                    }
                }

                find_value += "~"+code;
                //console.log(word+","+voice+"\t"+find_value);
                map_word.set(word,find_value);
            }

        }
        //directly turn to phone code
        if(datas[0]==2){
            var s_string = datas[1];
            var s_voice="";
            var one_voice="";
            var cnt_word;
            for(j=2;j<datas.length;j++){
                if(s_string[0]=="&"){
                    continue;
                }
                one_voice="";
                cnt_word=0;
                code="";
                if(datas[j]!=""){
                    s_voice=datas[j];
                    for(i=0;i<S(s_voice).length;i++){
                        temp = map_key.get(s_voice[i]);
                        if(typeof temp !="undefined"){
                            code+=temp;
                        }
                        else if(s_voice[i]!=" "){
                            code+=s_voice[i];
                        }
                        else if(s_voice[i]==" "&&(s_voice[i-1]!='ˇ'&&s_voice[i-1]!='ˋ'&&s_voice[i-1]!='ˊ')){
                            code+=" ";
                        }
                    }
                    temp = s_string.split(" ");
                    if(temp.length>1){
                        temp = S(s_string).between("(",")");
                        s_string = s_string.replace("("+temp+")","");
                        s_string+=" | "+temp;
                    }
                    var phone_code = "\n1\tXXXX"+code+"XXXX\t"+s_string;
                    fs.appendFile("my_newdic5.txt",phone_code,"utf8",function(err){
                        if (err) throw err;
                    });
                }

            }
        }
    });
    lr.on('end', function () {
        /*
        map_word.forEach(function(value,key){
            if(value!=""&&value!=" "&&value!="~"&&value!=" ~ "){
                //console.log(key+"\t"+value);
            }
        });
        */
        // All lines are read, file is closed now.
        fin("ok");
    });
}
function ReadKeyCode(filename,fin){
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
        var datas = line.split("\t");
        map_key.set(datas[0],datas[1]);
    });
    lr.on('end', function () {
        // All lines are read, file is closed now.
        fin("ok");
    });
}
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
