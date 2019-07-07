FROM node:slim

WORKDIR /app

COPY package*.json ./

RUN npm install -g

COPY . .

CMD [ "node", "app.js" ]
