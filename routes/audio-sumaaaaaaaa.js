const express = require('express');
const router = express.Router();

const bodyParser = require('body-parser');
router.use(bodyParser.urlencoded({extended: true}));

const async = require('async');
const request = require('request');

var period = null;


router.get('/', function(req, res) {
	console.log(req.query);
	groupId = req.query.group_id;
	startTime = req.query.start_id;
	endTime = req.query.end_id;

	if (groupId == null) {
		res.send('No group id');
		return;
	}

	var options = {
		url: 'https://mbshackmit.cybozu.com/k/v1/records.json?app=5&query=group_id%20%3d%20' + groupId + '%20order%20by%20time_sec%20asc%20limit%20500',
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
				// audio sampling
				
				var current_time = 0;
				var sum = 0;
				var samples = [];

				var sum_of_samples = 0;
				var num_of_samples = 0;

				var count = 0;

				console.log(records.length);
				
				async.each(records, function(record, next) {

					console.log(record.time_sec.value);
					if (Number(record.time_sec.value) != current_time) {
						console.log(current_time);
						if (period == null) {
							period = Number(record.time_sec.value) - current_time;
						}
						current_time += period;
						var sample = sum / count;

						samples.push(sample);

						sum_of_samples += sample;
						num_of_samples += 1;

						sum = 0;
						count = 0;
					}

					sum += Number(record.value.value);
					count += 1;

					next();
				}, function complete(err) {
					const avg_of_samples = sum_of_samples / num_of_samples;

					// audio all
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


					var options = {
						url: 'https://mbshackmit.cybozu.com/k/v1/records.json?app=10&query=Group_ID%20%3d%20' + groupId + '%20and%20Number%20%3e%20' + startTime + '%20order%20by%20Numberand%20Number%20%3c%3d%20' + endTime + '%20asc%20limit%20500',
						headers: {
							"X-Cybozu-API-Token": "NR6LxfHx4dFWMuTeTLw937LkqKR1FfZZgumi9ufa"
						}
					};
					
					var max_value = 0;
					var max_key = 0;
			
					// integrate 
					var key = 0;
					async.each(samples, function(spl, next) {
					console.log(spl);
					var value = spl / avg_of_samples;
					const time = key * period;

					if (max_value < value) {
						max_value = value;
						max_key = key;
					}
				
					const options = {
						uri: "https://mbshackmit.cybozu.com/k/v1/record.json",
						headers: {
							"Content-type": "application/json",
							"X-Cybozu-API-Token": "bkfzVnpXNormsJRdUVa2GAbuRpNU3eVlycUk2NtD"
						},
						body: {
							"app":11,
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

					key += 1;

					next();
				}, function complete(err) {
					const backward = 10;
					const forward = 5;

					var backward_key = max_key - backward;
					var forward_key = max_key + forward;
					
					if (backward_key < 0) 
						backward_key = 0;

					if (forward_key > samples.length)
						forward_key = samples.length;

					const start_sec = backward_key * period;
					const end_sec = forward_key * period;

				
				// extract highlight of video 

					var options = {
						url: 'https://mbshackmit.cybozu.com/k/v1/records.json?app=3&query=group_id%20%3d%20' + groupId + '%20',
						headers: {
							"X-Cybozu-API-Token": "pZtwW6hTNGibfwfjz2runV0meCX3Nxxs07DVQSxS"
						}
					};
				
					request.get(options, function (error, response, body) {

						// Trim
						const videoPath = JSON.parse(body).records[0].video_file.value;
						
						var suzuDownloader = require('suzu-downloader');
						var downloader = new suzuDownloader();
						
						const in_video = __dirname + '/../uploads/movie' + groupId + '.mp4';

						downloader.get({
							url: videoPath,
							path: in_video,
							success: function() {
								const execSync = require('child_process').execSync;

								var len = end_sec - start_sec;
								const out_video = __dirname + '/../uploads/output' + groupId + '.mp4';

								const result =  execSync('ffmpeg -y -i ' + in_video + ' -ss ' + start_sec + ' -t ' + len + ' ' + out_video);

								var fs = require('fs');

											
								var AWS = require('aws-sdk'); 
								var s3 = new AWS.S3();

								var myBucket = 'tcu';

								require('date-utils');
								var date = new Date() ;

								var myKey = 'output' + groupId + date.getTime() + '.mp4';

								var params = {Bucket: myBucket, Key: myKey, Body: fs.readFileSync(out_video), ACL: 'public-read-write'};

								s3.putObject(params, function(err, data) {
									if (err) {
										console.log(err)
									} else {
										console.log(data);

										params = {Bucket: myBucket, Key: myKey, Expires: 21600};
										s3.getSignedUrl('getObject', params, function (err, url) {
											console.log("The URL is", url);

											var options = {
												uri: "https://mbshackmit.cybozu.com/k/v1/record.json",
												headers: {
													"Content-type": "application/json",
													"X-Cybozu-API-Token": "2uX0Pv2GzsSHSmgtqb9LJ8W0rL9RD0DtbOndFytF"
												},
												body: {
													"app":2,
													"record":{
														"group_id":{
															"value":groupId
														},
														"start_sec":{
															"value":start_sec
														},
														"end_sec":{
															"value":end_sec
														},
														"video_file":{
															"value":url
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
									}
								});
							},
							error: function() {
								console.log('error');
							}
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
