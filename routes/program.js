const express = require('express');
const router = express.Router();

const fs = require('fs');

const bodyParser = require('body-parser');
router.use(bodyParser.urlencoded({extended: true}));

const request = require('request');

const period = 5 * 60 * 1000;	// 5 min
const rate = 48000;

function uuid() {
	var uuid = "", i, random;
	for (i = 0; i < 32; i++) {
		random = Math.random() * 16 | 0;

		uuid += (i == 12 ? 4 : (i == 16 ? (random & 3 | 8) : random)).toString(16);
	}
	return uuid;
}


router.get('/', function(req, res) {
		//url: 'https://mbshackmit.cybozu.com/k/v1/records.json?app=3&query=start%5Fdatetime%20%3E%20NOW%28%29%20order%20by%20start%5Fdatetime%20asc%20limit%201',
	var options = {
		url: 'https://mbshackmit.cybozu.com/k/v1/records.json?app=3&query=start%5Fdatetime%20%3E%20NOW%28%29%20order%20by%20start%5Fdatetime%20asc%20limit%201',
		headers: {
			"X-Cybozu-API-Token": "pZtwW6hTNGibfwfjz2runV0meCX3Nxxs07DVQSxS"
		}
	};

	request.get(options, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			console.log(body);
			const record = JSON.parse(body).records[0];

			if (record == null) {
				res.send('No programs');
			} else {
				const start_time = new Date(record.start_datetime.value);
				const end_time = new Date(record.end_datetime.value);

				const size = end_time - start_time;	// milisec

				var file_num = size / period;
				if (size % period !== 0) {
					file_num += 1;
				}

				const group_id = record.group_id.value;
				const data_id = uuid();

				const msg = Math.round( start_time.getTime() / 1000) + ' ' + file_num + ' ' + period + ' ' + rate + ' ' + group_id + ' ' + data_id;
				 
				console.log(msg);

				res.send(msg);	
			}
			
		} else {
			console.log('error: '+ response.statusCode);
			res.send(body);	
		}
	});

});

module.exports = router;
