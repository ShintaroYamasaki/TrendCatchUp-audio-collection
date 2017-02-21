TrendCatchUp-audio-collection
====
## Build and run the container
`docker build -t audio-collection .`  
`docker run -p 80:4000 -d audio-collection`  

## Example
* Send audio data  
`curl "http://[IP address]/audio" -X POST -F "file=@audio.wav" -F 'json={"group_id":7,"data_id":"aaaaa", "sample_rate":16000, "audio_period":100000, "audio_count": 1}'`

* Sum audio and twitter data and generate highlight  
`curl "http://[IP address]/sum?group_id=2222&start_time=1487445552&end_time=1487455294" -X GET `

* Get program data  
`curl "http://[IP address]/program" -X GET`
