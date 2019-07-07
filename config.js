const dotenv = require('dotenv');
dotenv.config();

module.exports = {
    port: process.env.PORT, //the port for API to listen 
    publicApiAddress: process.env.PUBLIC_API_ADDRESS, //the public path exposed by proxy server to reach the static files of the user
    dbPath: process.env.DB_PATH //the path to mongo DB
};