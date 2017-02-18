const express = require('express');
const router = express.Router();

const bodyParser = require('body-parser');
router.use(bodyParser.urlencoded({extended: true}));

const async = require('async');
const request = require('request');

//const period = 5;
const period = 1;

router.get('/', function(req, res) {
	console.log(req.query);
	groupId = req.query.group_id;

	if (groupId == null) {
		res.send('No group id');
	}

	var options = {
		url: 'https://mbshackmit.cybozu.com/k/v1/records.json?app=5&query=group_id%20%3d%20' + groupId + '%20order%20by%20time_sec%20asc',
		headers: {
			"X-Cybozu-API-Token": "ENiRtxkhPbhGY8jiV7eq8bZq9FR1DiSCXkmTYQZa"
		}
	};

	request.get(options, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			const records = JSON.parse(body).records;

			if (records == null) {
				res.send('No programs');
			} else {
				var current_time = 0;
				var sum = 0;
				var samples = [];

				var sum_of_samples = 0;
				var num_of_samples = 0;

				var count = 0;
				
				async.each(records, function(record, next) {
					sum += Number(record.value.value);
					count += 1;

					if (Number(record.time_sec) != current_time) {
						current_time += 5;
						var sample = sum / count;
						console.log(sum + ' ' + count);

						samples.push(sample);

						sum_of_samples += sample;
						num_of_samples += 1;

						sum = 0;
						count = 0;
					}
					next();
				}, function complete(err) {
					const avg_of_samples = sum_of_samples / num_of_samples;

					samples.forEach(function(spl, key) {
						console.log(spl);
						var value = spl / avg_of_samples;
						const time = key * period;

						const options = {
							uri: "https://mbshackmit.cybozu.com/k/v1/record.json",
							headers: {
								"Content-type": "application/json",
								"X-Cybozu-API-Token": "jsS4TwsV5ErYTkWGyqnbH2DsNokJD0ndfXRKTNSq"
							},
							body: {
								"app":8,
								"record":{
									"group_id":{
										"value":groupId
									},
									"value":{
										"value":value
									},
									"time_sec":{
										"value":time
									}
								}
							},
							json:true
						};
						request.post(options, function(error, response, body){
							if (err) {
								console.log(body);
								throw new Error(error);
							}
							console.log(body);
						});
					});


					data = {
						num: num_of_samples,	
						sum: sum_of_samples,
						avg: avg_of_samples,
						period: period * 1000
					};

					res.send(data);	

				});
			}
		} else {
			console.log('error: '+ response.statusCode);
			res.send(body);	
		}
	});
});

module.exports = router;
