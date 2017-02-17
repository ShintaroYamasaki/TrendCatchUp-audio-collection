FROM	ubuntu:14.04

RUN 	apt-get update

RUN		apt-get -y install software-properties-common
RUN		add-apt-repository ppa:mc3man/trusty-media
RUN 	apt-get update
RUN		apt-get -y install ffmpeg

RUN		apt-get install -y nodejs npm
RUN		update-alternatives --install /usr/bin/node node /usr/bin/nodejs 10

COPY	. /app
RUN 	cd /app; npm install;

WORKDIR	/app

EXPOSE	4000

CMD ["node", "app.js"]
