var AWS = require('aws-sdk');

var s3 = new AWS.S3();

// バケット名はすべての S3 ユーザーの間で一意である必要があります

var myBucket = 'test-mit';

var myKey = 'myBucketKey';

s3.createBucket({Bucket: myBucket}, function(err, data) {

		if (err) {
			console.log(err);
		} else {
			params = {Bucket: myBucket, Key: myKey, Body: 'Hello!'};
			s3.putObject(params, function(err, data) {
				if (err) {
					console.log(err)
				} else {
					console.log("Successfully uploaded data to myBucket/myKey");
				}
			});
		}

});
