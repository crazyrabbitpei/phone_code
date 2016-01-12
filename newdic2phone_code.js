var iconv = require('iconv-lite');
var express = require('express');
var bodyParser = require('body-parser');
var urlencode = require('urlencode');
var querystring = require("querystring");
var request = require('request');
var S = require('string');
var fs = require('fs');
var HashMap = require('hashmap');
var LineByLineReader = require('line-by-line');

var filename = process.argv[2];
var keydic = "./dict/key.code";
var map_key  = new HashMap();
var map_word = new HashMap();
var dict_name = "dict_revised_2014_20151014_1_u.txt";
var dict2_name = "dict_revised_2014_20151014_2_u.txt";
var dict3_name = "dict_revised_2014_20151014_3_u.txt";
var cnt=0;

var cnt_line=0;
ReadKeyCode(keydic,function(r){
    //console.log("read key code:"+r);
    ReadDict(dict_name,function(result1){
        ReadDict(dict2_name,function(result2){
            ReadDict(dict3_name,function(result3){
                NewDicPhoneCode("init",filename,function(result){
                    console.log("read phone code:"+result);
                    console.log("READ DICT DONE:"+dict_name+" status:"+result4);
                });

            });
        });

    })
});
function getPhoneCode(str,fin){
    var cnt_set=1;
    var words = str.split("");
    var max_word=1;
    var index;
    var q=0;
    var result  = new Array();
    for(i=0;i<words.length;i++){
        temp = map_word.get(words[i]);
        if(typeof temp =="undefined"){
            console.log("words:"+words+" words["+i+"]:"+words[i]);
            continue;
        }
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
                    if(typeof temp1 =="undefined"){
                        console.log("words:"+words+" words["+i+"-1]:"+words[i-1]);
                        continue;
                    }
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
                            if(typeof result[index] =="undefined"){
                                console.log("index:"+index+" result:"+result[index]+" reaplce:"+temp[j-1]+" to:"+temp[j])
                                continue;
                            }
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
    fin(result);
}


function NewDicPhoneCode(option,filename,fin){
    //ReadLine
    
    var phone_code="";

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
        cnt_line++;
        //var timeOut = setTimeout(function(){
            //console.log("ok!"+cnt);
            getPhoneCode(line,function(code){
                var phone_code="";
                for(k=0;k<code.length;k++){
                    if(cnt_line!=0){
                        phone_code += "\n1\tXXXX"+code[k]+"XXXX\t"+line;
                    }
                    else{
                        phone_code += "1\tXXXX"+code[k]+"XXXX\t"+line;
                    }
                }
                cnt++;
                fs.appendFile("test.txt",phone_code,function(err){
                    if (err) throw err;
                    //fin(phone_code);
                });
            });
        //},1000*cnt_line);
    });
    lr.on('end', function () {
        // All lines are read, file is closed now.
        fin(cnt_line);
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
function ReadDict(filename,fin){
    var temp="";
    var code;
    //ReadLine
    var options = {
        //encoding: 'utf8',
        skipEmptyLines:false
    }
    var lr = new LineByLineReader("./dict/dict_revised_2014_20151014/"+filename,options);
    iconv.skipDecodeWarning = true;
    lr.on('error', function (err) {
        // 'err' contains error object
        console.log("error:"+err);
        fin("error");
    });
    lr.on('line', function (line) {
        //console.log("--"+line);
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

                }
                if(voice[i-1]!='ˇ'&&voice[i-1]!='ˋ'&&voice[i-1]!='ˊ'){
                    code+=" ";
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
                }
                if(voice[i-1]!='ˇ'&&voice[i-1]!='ˋ'&&voice[i-1]!='ˊ'){
                    code+=" ";
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
