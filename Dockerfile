FROM node:slim

RUN apt-get update && apt-get -y install ffmpeg && apt-get -y clean && apt-get -y autoclean

WORKDIR /app

COPY package*.json ./

RUN npm install -g

COPY . .

CMD [ "node", "app.js" ]
