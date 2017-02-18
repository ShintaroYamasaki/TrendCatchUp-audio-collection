const express = require('express');
const router = express.Router();

const fs = require('fs');

const bodyParser = require('body-parser');
router.use(bodyParser.urlencoded({extended: true}));

const execSync = require('child_process').execSync;
const request = require('request');


router.get('/', function(req, res) {
	var options = {
		url: 'https://mbshackmit.cybozu.com/k/v1/records.json?app=3',
		headers: {
			"X-Cybozu-API-Token": "pZtwW6hTNGibfwfjz2runV0meCX3Nxxs07DVQSxS"
		},
	};

	request.get(options, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			console.log(body);
			res.send(body);	
		} else {
			console.log('error: '+ response.statusCode);
			res.send(body);	
		}
	});

});

module.exports = router;
