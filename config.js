const dotenv = require('dotenv-flow');
dotenv.config();
const nodemailer = require('nodemailer');
 

module.exports = {
    port: process.env.PORT, //the port for API to listen 
    publicApiAddress: process.env.PUBLIC_API_ADDRESS, //the public path exposed by proxy server to reach the static files of the user
    dbPath: process.env.DB_PATH, //the path to mongo DB
    tokenKey: process.env.TOKEN_KEY, //need for authorization
    
    // do wysyłania maili
    smtpHost: process.env.SMTP_HOST,
    smtpPort: process.env.SMTP_PORT,
    auth: {
        user: process.env.SMTP_USERNAME, 
        pass: process.env.SMTP_PASSWORD,
      },
};



