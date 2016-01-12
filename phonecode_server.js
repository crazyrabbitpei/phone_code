var iconv = require('iconv-lite');
var express = require('express');
var bodyParser = require('body-parser');
var urlencode = require('urlencode');
var S = require('string');
var app  = express();
var http = require('http');
var server = http.createServer(app);

var request = require('request');
var querystring = require("querystring");

var fs = require('fs');

var HashMap = require('hashmap');
var map_word = new HashMap();
var map_singal_word = new HashMap();
var map_terms = new HashMap();
var map_key = new HashMap();

//var apiip = "localhost";
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

var line_cnt=0;
var keyfile ="./dict/key.code"
var phone_file = "my_newdic.txt";
var dict_name = "dict_revised_2014_20151014_1_u.txt";
var LineByLineReader = require('line-by-line');
/*
var str = "耳邊風";
var part = str.split("");
console.log(part);
*/
ReadPhoneCode("insert",phone_file,function(result){
    console.log("read phone code:"+phone_file);
    ReadKeyCode("",keyfile,function(result2){
        console.log("read key code:"+keyfile);
        ReadDict(dict_name,function(result){
            console.log("READ DICT DONE:"+dict_name+" status:"+result);
            map_terms.forEach(function(value,key){
                console.log(key+","+value);
                fs.appendFile("./test.txt",key+"\t"+value+"\n","utf8",function(){});
            });
        })
    });
});
/*--init--*/
function ReadKeyCode(option,filename,fin){
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
function ReadPhoneCode(option,filename,fin){
    //ReadLine
    var options = {
        //encoding: 'utf8',
        skipEmptyLines:false
    }
    var lr = new LineByLineReader("./dict/"+filename,options);
    iconv.skipDecodeWarning = true;
    lr.on('error', function (err) {
        // 'err' contains error object
        console.log("error:"+err);
    });
    lr.on('line', function (line) {
        // 'line' contains the current line without the trailing newline character.
        //var str = iconv.decode(line,"big5");
        var datas = line.split("\t");
        var terms_all = S(datas[2]).strip(" ").s;
        var final_term="";
        var word="",part="",terms="",voice="",temp="",strip_voice="";
        var cnt=0;
        line_cnt++;
        //if(line_cnt<=4){
            
            voice = datas[1].match(/([^X])*[^X]/g).toString();
            for(i=0;i<voice.length;i++){
                if(!S(voice[i]).isAlphaNumeric()){
                    if(voice[i]!='-'&&voice[i]!=';'&&voice[i]!=','&&voice[i]!='.'&&voice[i]!='/'&&voice[i]!=' '){
                        //console.log(voice[i]+" is wrong");
                        cnt++;
                        continue;
                    }
                }
                word += voice[i];
                strip_voice += voice[i];
            }
            if(option=="insert"){
                console.log("insert:"+terms_all+" voice:["+strip_voice+"]");
                //fs.appendFile("./result.txt","insert:"+terms_all+" voice:["+strip_voice+"]\n","utf8",function(){});
                if(typeof (temp = map_terms.get(strip_voice))!=="undefined"){
                    final_term = temp;
                    temp_terms = terms_all.split("|");

                    for(i=0;i<temp_terms.length;i++){
                        if(temp.indexOf(temp_terms[i])==-1){
                            final_term += "|"+temp_terms[i];
                        }
                    }
                    map_terms.set(strip_voice,final_term);
                }
                else{
                    map_terms.set(strip_voice,terms_all);
                }
            }
            else{//init, update
                map_terms.set(strip_voice,terms_all);
            }
        //}
    });
    lr.on('end', function () {
        // All lines are read, file is closed now.
        map_terms.forEach(function(value,key){
            console.log(key+","+value);
        });
        fin("ok");
    });
}
function ReadDict(filename,fin){
    var temp="";
    var code;
    //ReadLine
    var options = {
        encoding: 'utf8',
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
                if(find_value.indexOf(code)==-1){
                    find_value += "~"+code;
                    map_word.set(word,find_value);
                }
                //console.log(word+","+voice+"\t"+find_value);
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
                    if((s_voice[i-1]!='ˇ'&&s_voice[i-1]!='ˋ'&&s_voice[i-1]!='ˊ')){
                            code+=" ";
                    }

                    temp = s_string.split(" ");
                    if(temp.length>1){
                        temp = S(s_string).between("(",")");
                        s_string = s_string.replace("("+temp+")","");
                        s_string+=" | "+temp;
                    }
                    if(typeof (temp = map_terms.get(code)) !="undefined"){
                        temp += "|"+s_string
                        map_terms.set(code,temp);
                    }
                    else{
                        map_terms.set(code,s_string);
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
/*--init end--*/
function trans2code(str,fin){
    var i,j,k;
    var result = new Array();
    var word_get=map_terms.search(str);

    if(word_get !=null){
        console.log("exist in dict:["+word_get+"]");
        fin(word_get);
    }
    else{
        console.log("not exist in dict:"+str+" =>"+word_get);
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
                        console.log("temp["+j+"]:"+temp[j]);

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
            console.log("ok");
            fin(result);
    }
}
/*--API--*/
app.get('/phone_code/v2.0/:type(2code|2word|2same)',function(req,res){
    var str = req.query.q;
    var type = req.params.type;
    var temp="",temp1="";
    var i,j,k;
    temp1 = S(str).between('"','"');
    if(type=="2word"){//getByCode return word
        console.log("get code:["+temp1+"]");
        temp = map_terms.get(temp1);
        console.log("return:["+temp+"]");
        if(typeof temp !="undefined"){
            str = temp;
        }
        res.send(str);    
    }
    else if(type=="2code"){//getByWord return code
        console.log("Get:["+str+"]");
        trans2code(str,function(r_string){
            res.send(r_string);
        });
    }
    else if(type=="2same"){//getByWord return same voice word

        var i;
        console.log("Get:["+str+"]");
        var parts = str.split(" ");
        console.log("parts.length:"+parts.length);
        var promiseAry = [];
        for(j=0;j<parts.length;j++){
            promiseAry.push(
                new Promise(function (resolve, reject) {

                    console.log("parts["+j+"]:"+parts[j]);
                    /*
                    temp_trans2code(parts[j],function(sta){
                        resolve(sta);
                    });
                    */
                    trans2code(parts[j],function(r_string){
                        var cnts=0;
                        var result="";
                        console.log("r_string:"+r_string+" length:"+r_string.length);
                        for(i=0;i<r_string.length;i++){
                            console.log("["+i+"] r_string.length:"+r_string.length+" =>["+r_string[i]+"]");
                            if(cnts>0){
                                temp = map_terms.get(r_string[i]);
                                if(typeof temp != "undefined"){
                                    console.log("=>["+temp+"]");
                                    if(result.indexOf(temp)==-1){
                                        result += "|"+temp;
                                    }
                                }
                                else{
                                    console.log("not exist:["+r_string[i]+"]");
                                }
                            }
                            else{
                                temp = map_terms.get(r_string[i]);
                                if(typeof temp != "undefined"){
                                    console.log("=>["+temp+"]");
                                    result = temp;
                                    cnts+=1;
                                }
                                else{
                                    console.log("not exist:["+r_string[i]+"]");
                                }
                            }
                        }
                        console.log("end ["+i+"] r_string.length:"+r_string.length+" =>"+r_string[i]);
                        if(cnts==0){
                            result = parts[j];
                        }
                        console.log("!!resolve:"+result);
                        resolve(result);
                        //res.send(result);
                    })
                }).catch(function(error){console.log(error)})
            )
            
        }
        
        Promise.all(promiseAry).then(function(results){
            var fin_result="";
            for(k=0;k<results.length;k++){
                if(k!=0){
                    fin_result+="="+results[k];
                }
                else{
                    fin_result+=results[k];
                }
                console.log(results[k]);
            }
            res.send(fin_result);
        })
        //res.send("result:ok");

    }
    //console.log("result:"+result);
});
function temp_trans2code(str,fin){
    console.log("===>get:"+str);
    fin(str);
}
//import new phone code dictionary
app.post('/phone_code/v2.0/:option(newdic|updatedic)/',function(req,res){
    var filename = req.query.q;
    var option =  req.params.option;
    if(option=="newdic"){
        console.log("Read phone code file:"+filename);
        ReadPhoneCode("insert",filename,function(result){
            res.send("Insert file:"+filename+" import ok");
        });
    }
    else if(option=="updatedic"){
        console.log("Update phone code file:"+filename);
        ReadPhoneCode("update",filename,function(result){
            res.send("Update file:"+filename+" import ok");
        });
    }
});
//import new dictionary
app.post('/dict/v2.0/insert/',function(req,res){
    var filename = req.query.q;
    ReadDict(filename,function(result){
        console.log("READ DIC DONE:"+filename+" status:"+result);
        res.send("READ DIC DONE:"+filename+" status:"+result);
    });
});
//Error handing
app.use(errorHandler);
function errorHandler(err, req, res, next) {
    if (res.headersSent) {
        return next(err);
    }
    res.status(500);
    res.end(); 
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



//phone code to a word , a term to phone code
//no use
app.get('/phone_code/:type(code|word)?',function(req,res){
    //phone_code/?q=九龍堂 => 
    //phone_code/code/?q=ru.3 => 酒
    console.log(req.query.q);
    var terms = req.query.q.split(" ");
    //console.log(terms.length);
    var str="",temp="",code="";
    if(req.params.type=="code"){
        if(typeof (temp = map_singal_word.search(req.query.q))!=="undefined"){
            str+=temp;
        }
    }
    else{
        temp ='"';
        for(j=0;j<terms.length;j++){
            code="";
            //s_word = terms[j].split("");
            //console.log("["+j+"] terms:"+terms[j]);
            if(j==0){
                temp += terms[j];
            }
            else{
                temp += "="+terms[j];
            }

            /*
            for(i=0;i<s_word.length;i++){
                if(typeof (temp = map_singal_word.get(s_word[i]))!=="undefined"){
                    //console.log(temp.match(/(.)*[ ]$/));
                    //   for(i=0;i<t.length;i++){
                    //   console.log(t[i]);
                    //   }
                    //    temp = S(temp).strip(' ').s;
                    //console.log("temp:["+temp+"]");
                    code += temp;
                }
                else{
                    code_false=-1;
                }
            }
            */
        }
        temp+='"';
        getPhoneCode(temp,function(codes){
            code = codes.split("=");
            for(j=0;j<code.length;j++){
                //console.log("("+code[j]+")");
                if(typeof (temp2 = map_terms.get(code[j]))!=="undefined"){
                    //console.log("get term:"+temp2);
                    if(j!=0){
                        str += "="+temp2;
                    }
                    else{
                        str += temp2;
                    }
                }
                else{
                    //use phone code to get the same voice terms(cut two voice to convert)

                    find=0;
                    index_cnt=0;
                    console.log("total:"+code[j]);
                    while(find!=1&&index_cnt<5){
                        word_cnt=0;
                        cut_cnt=2;
                        code_part="";
                        console.log("index_cnt:"+index_cnt+" word_cnt:"+word_cnt);
                        for(k=0;k<code[j].length;k++){
                            if(word_cnt>=index_cnt){
                                //console.log("index_cnt:"+index_cnt+" word_cnt:"+word_cnt);
                                code_part += code[j][k];
                            }
                            if(code[j][k]=='3'||code[j][k]=='4'||code[j][k]=='6'||code[j][k]=='7'||code[j][k]==' '){
                                word_cnt++;
                                if(word_cnt==cut_cnt&&word_cnt>index_cnt){
                                    console.log("cut_cnt:"+cut_cnt+"=>"+code_part);
                                    temp2="";
                                    if(typeof (temp2 = map_terms.get(code_part))!=="undefined"){
                                        console.log("word_cnt:"+word_cnt+"cut cnt:"+cut_cnt);
                                        if(j!=0){
                                            str += "="+temp2;
                                        }
                                        else if(str!=""){
                                            str += "="+temp2;
                                        }
                                        else{
                                            str += "="+temp2;
                                        }
                                        code_part="";
                                        word_cnt=0;
                                        find=1;
                                    }
                                    else{
                                        cut_cnt++;
                                    }

                                }

                            }
                        }
                        if(find==0){
                            index_cnt++;
                        }
                    }
                }
                if(str==""){
                    str += "phone code:"+code[j];
                }
                console.log("code:"+code[j]+" str:"+str);
            }
            res.send(str);    
        });
        /*
        for(j=0;j<code.length;j++){

        }
        */
    }
});
