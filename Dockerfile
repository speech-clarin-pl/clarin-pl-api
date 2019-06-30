FROM node

WORKDIR /usr/src/app

RUN npm install -g serve

COPY package*.json ./

RUN npm install 

COPY . .

CMD [ "npm", "start" ]
