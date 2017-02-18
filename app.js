var express    = require('express');
var app        = express();
var bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port = 4000;

// 
var audio_analysis = require('./routes/audio-analysis');
var program = require('./routes/program');

app.use('/audio', audio_analysis);
app.use('/program', program);

//サーバ起動
app.listen(port);
console.log('listen on port ' + port);
