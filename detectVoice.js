var Es = require("./es_command");
var request = require('request');
var querystring = require("querystring");
var haspmap = require("hashmap");
var S = require("string");
function detectVoice(map_term,command,pattern,not_pattern,source,board,column,res,fin)
{
    var result = querystring.stringify({q:pattern});
    
    request({
        uri:'http://'+apiip+':'+apiport+'/phone_code/v2.0/2same/?'+result
    },function(error, response, body){
        var i,j,k,l,m;
        var temp_result="";
        var search_term,new_term;
        var terms,new_term_temp,temp_terms;
        if(command=="get"){
            /*
            if(body.indexOf(pattern)==-1){
                parts = body.split("=");
                temp_result += "您是不是想找 :";
                for(j=0;j<1;j++){
                    if(body.indexOf("!==")==-1){
                        terms = body.split("|");
                        for(i=0;i<terms.length;i++){
                            temp_result += " "+terms[i];
                        }
                    }
                }

            }
            temp_result+="\n";

            */
            //fin(temp_result);
        }
        else if(command=="convert"){
            terms = body.split("=");
            search_term="";
            var term_array = [];
            var result_array = [];
            var s_array = [];
            var compare_array = [];
            for(j=0;j<terms.length;j++){
                term_array.push(terms[j]);
            }
            console.log(term_array);
            for(j=0;j<term_array.length;j++){
                s_array=[];
                temp_terms = term_array[j].split("|");
                for(k=0;k<temp_terms.length;k++){
                    s_array.push(temp_terms[k]);
                }
                result_array.push(s_array);
            }
            console.log(result_array);
            new_term="";
            cnt=0;
            s_array=[];
            for(j=0;j<result_array.length;j++){
               for(k=0;k<result_array[j].length;k++){
                    s_array.push(" "+result_array[j][k]);
                    compare_array.push(result_array[j][k]);
                    if(result_array.length==1){
                        if(s_array.indexOf(result_array[j][k])==-1){
                            //s_array.push(" "+result_array[j][k]);
                        }
                        if(cnt!=0){
                            new_term += ' ||(+"'+result_array[j][k]+'")';
                            //compare_array.push(result_array[j][k]);
                        }
                        else{
                            new_term += '(+"'+result_array[j][k]+'")';
                            //compare_array.push(result_array[j][k]);
                        }
                        cnt++;
                    }
                    else if(result_array[j].length==1&&j==result_array.length-1){
                        if(s_array.indexOf(result_array[j][k])==-1){
                            //s_array.push(" "+result_array[j][k]);
                        }
                        if(cnt!=0){
                            new_term += ' ||(+"'+result_array[j][k]+'")';
                            //compare_array.push(result_array[j][k]);
                        }
                        else{
                            new_term += '(+"'+result_array[j][k]+'")';
                            //compare_array.push(result_array[j][k]);
                        }
                        //cnt++;
                    }
                    else if(j==result_array.length-1){
                        break;
                    }
                    else{
                        for(l=0;l<result_array[j+1].length;l++){
                            if(result_array[j][k]==""){continue;}
                            //s_array.push(result_array[j][k]+result_array[j+1][l]);
                            if(s_array.indexOf(result_array[j][k])==-1){
                                //if(cnt!=0){
                                //    s_array.push(" "+result_array[j][k]);
                                //}
                                //else{
                                //    s_array.push(" "+result_array[j][k]);
                                //}
                            }
                            if(s_array.indexOf(result_array[j+1][l])==-1){
                                //if(cnt!=0){
                                //    s_array.push(" "+result_array[j+1][l]);
                                //}
                                //else{
                                //    s_array.push(" "+result_array[j+1][l]);
                                //}
                            }

                            if(cnt!=0){
                                new_term += ' ||(+"'+result_array[j][k]+result_array[j+1][l]+'")';
                                new_term += ' ||(+"'+result_array[j][k]+'" +"'+result_array[j+1][l]+'")';
                                compare_array.push(result_array[j][k]+result_array[j+1][l]);
                                //compare_array.push(result_array[j][k]);
                                //compare_array.push(result_array[j+1][k]);
                                //s_array.push(result_array[j][k]+result_array[j+1][l]);
                                //s_array.push(result_array[j][k]+" "+result_array[j+1][l]);

                            }
                            else{
                                new_term += '(+"'+result_array[j][k]+result_array[j+1][l]+'")';
                                new_term += ' ||(+"'+result_array[j][k]+'" +"'+result_array[j+1][l]+'")';
                                compare_array.push(result_array[j][k]+result_array[j+1][l]);
                                //compare_array.push(result_array[j][k]);
                                //compare_array.push(result_array[j+1][k]);
                                //s_array.push(result_array[j][k]+result_array[j+1][l]);
                                //s_array.push(result_array[j][k]+" "+result_array[j+1][l]);
                            }
                            cnt++;
                        }
                    }
               }
            }


            var score;
            var first=0,second=0;
            var for_sort=[];

            for(i=0;i<compare_array.length;i++){
                score = map_term.get(compare_array[i]);
                if(typeof score!="undefined"){
                    for_sort.push([score,compare_array[i]]);

                }
            }

            for_sort.sort(sortFunction);
            console.log(for_sort);

            console.log("cnt:"+cnt+" conver term:"+new_term);

            //return;

            Es.EsSearch(source,board,column,new_term,not_pattern,function(result){
                var hits = result.hits;
                if(hits.total!=0){
                    //temp_result += S(new_term).strip("||","\"","+","(",")").s;
                    
                    for(i=0;i<s_array.length;i++){
                        console.log(s_array[i]);
                        if(temp_result.indexOf(s_array[i])!=-1){
                            continue;
                        }
                        if(i==0){
                            temp_result+=s_array[i];
                        }
                        else{
                            temp_result+=" "+s_array[i];
                        }
                    }
                    output = JSON.stringify({"result_count":hits.total,"convert":"yes","convert_term":temp_result,"result":result});
                    //fin("search term:"+temp_result+"\nresult count:"+hits.total+"\nresult:\n"+JSON.stringify(result)+"\n");

                    fin(output);
                }
                else{
                    temp_result += "您是想找 :";
                    temp_result += S(new_term).strip("||","\"","+","(",")").s;
                    /*
                    for(i=1;i<terms.length;i++){
                        if(terms[i].indexOf(pattern)==-1){
                            console.log("=>"+terms[i]);
                            temp_result += " "+terms[i];
                        }
                    }
                    */
                    temp_result += " 嗎?";
                    output = JSON.stringify({"result_count":hits.total,"convert":"yes","convert_term":temp_result,"result":"<none>"});
                    fin(output);
                }
            });
    }
    });
    
}
function sortFunction(a, b) {
    if (a[0] === b[0]) {
        return 0;
    }
    else {
        return (a[0] < b[0]) ? -1 : 1;
    }
}
exports.detectVoice = detectVoice;
    
