'use strict';
var elasticsearch = require('elasticsearch');
var esClient = new elasticsearch.Client({
		host: 'localhost:2468'
});
var readline = require('readline');
var fs = require('fs');


var rl = readline.createInterface({
		input: fs.createReadStream(process.argv[2])
});
var remain = 0;
var errNum = 0;
var current = 0;
const minConcurrent = 5;
const maxConcurrent = 15;
rl.on('line', function(line){
		current++;
		if(!(current%10) ){
				console.error(current, new Date());
		}
		let record;
		try{
				record = JSON.parse(line);
				
		}catch(e){
				console.log(line);
				errNum++;
				return;
		}
		//TODO insert to elastic
		if(!record || !record.url){
				console.log(line);
				return;
		}
		if(remain > maxConcurrent){
				rl.pause();
		}
		remain++;
		esClient.create({
				index: "c_test",
				type: "gossip",
				id: record.url,
				body: record
		}).then(function(result){
				remain--;
				if(remain < minConcurrent){
						rl.resume();
				}
		}).catch(function(err){
				remain--;
				if(remain < minConcurrent){
						rl.resume();
				}
				console.error(err);
				console.log(line);
				errNum++;
		});
});
rl.on('close',function(){
		console.log("close");
});

