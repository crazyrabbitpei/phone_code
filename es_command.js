var elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client({
                host: 'localhost:2468'
});

function EsSearch(source,board,column,pattern,not_pattern,fin)
{
    //https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-query-string-query.html
    client.search({
        index: 'c_test',
        type: board,
        body: {
            query: {
                query_string:{
                    //query:column+":("+pattern+")"
                    query:pattern,
                    //query:"\"洪秀柱\" &&\"新聞\"",
                    //analyzer:"ik",
                    fields:["title","body"],
                }
            },
            size:100,
            highlight:{
                pre_tags:['<mark>'],
                post_tags:['</mark>'],
                fields:{
                    body:{},
                    title:{}
                }
            }
        }
    }).then(function (resp) {
        var hits = resp.hits;
        var result_cnt = hits.total;
        var source = hits.hits;
        //var result = JSON.stringify(hits);
        //fin("result count:"+hits.total+"\nresult:\n"+JSON.stringify(resp)+"\n");
        fin(resp);
    }, function (err) {
        console.trace(err.message);
    });
    
}
exports.EsSearch = EsSearch;
