const express = require('express');
const router = express.Router();

const uploadPath = __dirname + '/../uploads/'
const multer  = require('multer');
const upload = multer({ dest: uploadPath});

const fs = require('fs');

//const Puid = require('puid');
//const puid = new Puid(true);

const bodyParser = require('body-parser');
router.use(bodyParser.urlencoded({extended: true}));

const pcm = require('pcm');
const execSync = require('child_process').execSync;
const request = require('request');


function analyze(file, groupId, data_id, sample_rate, audio_period, audio_count, callback) {

	//const period = 1; // Sec

	var samples = [];

	var sampleBuffer = 0.0;
	var count = 0;

	var max_of_samples = 0;
	var min_of_samples = 0;
	var num_of_samples = 0;
	var avg_of_samples = 0;
	var sum_of_samples = 0;

	// Loading again
	pcm.getPcmData(file, { stereo: false, sampleRate: sample_rate },
		function(sample, channel) {
			if (count == (period * sample_rate)) {
				const _sample = sampleBuffer / (period * sample_rate);

				if (max_of_samples < _sample) {
					max_of_samples = _sample;
				} else if (min_of_samples > _sample) {
					min_of_samples = _sample;
				}

				samples.push(_sample);

				sampleBuffer = 0.0;

				count = 0;
			}

			sampleBuffer += Math.abs(sample);

			count += 1;
			num_of_samples += 1;
			sum_of_samples += Math.abs(sample);

		},
		function(err, out) {
			if (err) {
				callback(null, err)
				throw new Error(err);
			}

			console.log('End loading and storing');
			
			// Rest of buffer
			const _sample = sampleBuffer / count;

			if (max_of_samples < _sample) {
				max_of_samples = _sample;
			} else if (min_of_samples > _sample) {
				min_of_samples = _sample;
			}

			samples.push(_sample);


			avg_of_samples = sum_of_samples / num_of_samples;
			console.log(avg_of_samples);


			// Post data
			samples.forEach(function(spl, key) {
				//const value = (spl - min_of_samples) / max_of_samples;
				//var value = 20 * Math.log(spl / avg_of_samples);
				//var value = spl / avg_of_samples;
				var value = spl;
				const time = key * period + audio_period / 1000 * audio_count;

				const options = {
					uri: "https://mbshackmit.cybozu.com/k/v1/record.json",
					headers: {
						"Content-type": "application/json",
						"X-Cybozu-API-Token": "ENiRtxkhPbhGY8jiV7eq8bZq9FR1DiSCXkmTYQZa"
					},
					body: {
						"app":5,
						"record":{
							"group_id":{
								"value":groupId
							},
							"value":{
								"value":value
							},
							"time_sec":{
								"value":time
							},
							"data_id":{
								"value":data_id
							}
						}
					},
					json:true
				};
				request.post(options, function(error, response, body){
					if (err) {
						throw new Error(error);
					}
				});
			});

			data = {
				num: num_of_samples,	
				sum: sum_of_samples,
				avg: avg_of_samples,
				rate: sample_rate,
				period: period * 1000
			};

			callback(data, null);
		}
	);

}


router.post('/', upload.single('file'), function(req, res) {
	json = JSON.parse(req.body.json);
	console.log(json.group_id);
	groupId = json.group_id;
	dataId = json.data_id;
	sampleRate = json.sample_rate;
	audioPeriod = json.audio_period;
	audioCount = json.audio_count;

	if (groupId == null) {
		res.send('No group id');	

		return;
	} 

	if (dataId == null) {
		res.send('No data id');

		return;
	}

	if (sampleRate == null) {
		res.send("No sampling rate");
		return;
	}

	if (audioPeriod == null) {
		res.send('No audio period');
	}

	if (audioCount == null) {
		res.send('No audio count');
	}

	if (req.file != null) {
		const audiofile = req.file;

		analyze(audiofile.path, groupId, dataId, sampleRate, audioPeriod, audioCount, function(result, err) {
			if (err)
				res.send({error:err});
				
			data = {
				group_id: groupId,
				data_id: dataId,
				audio_period: audioPeriod,
				audio_count: audioCount,
				result: result
			}

			console.log(data);
			res.send(data);	
		});
	} else if (json.filedata != null) {
		console.log('data');

		const filename = uploadPath + dataId + '.wav';
		fs.writeFileSync(filename, json.filedata);

		analyze(audiofile.path, groupId, dataId, sampleRate, audioPeriod, audioCount, function(result, err) {
			if (err)
				res.send({error:err});
				
			data = {
				group_id: groupId,
				data_id: dataId,
				audio_period: audioPeriod,
				audio_count: audioCoubnt,
				result: result
			}

			res.send(data);	
		});
	} else {
		res.send('No audio');
	}
});

module.exports = router;
