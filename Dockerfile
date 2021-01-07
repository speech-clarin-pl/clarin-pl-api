FROM node:slim

RUN echo "no cache"

RUN apt-get update && apt-get -y install ffmpeg git make cmake gcc g++ libmad0-dev libid3tag0-dev libsndfile1-dev libgd-dev libboost-filesystem-dev libboost-program-options-dev libboost-regex-dev && \
	git clone https://github.com/bbc/audiowaveform.git /audiowaveform && cd /audiowaveform && cmake -D ENABLE_TESTS=0 -D BUILD_STATIC=1 . && make && make install && cd / && rm -rf /audiowaveform && \
	apt-get -y purge git make cmake gcc g++ libmad0-dev libid3tag0-dev libsndfile1-dev libgd-dev libboost-filesystem-dev libboost-program-options-dev libboost-regex-dev && apt-get -y autoremove && apt-get clean

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

CMD [ "npm", "run", "production" ]
