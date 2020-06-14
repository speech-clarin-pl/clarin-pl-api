const dotenv = require('dotenv');
dotenv.config();
const nodemailer = require('nodemailer');
 

module.exports = {
    port: process.env.PORT, //the port for API to listen 
    publicApiAddress: process.env.PUBLIC_API_ADDRESS, //the public path exposed by proxy server to reach the static files of the user
    dbPath: process.env.DB_PATH, //the path to mongo DB
    tokenKey: process.env.TOKEN_KEY, //need for authorization
    
    // do wysyłania maili
    smtpHost: "smtp.ethereal.email",
    smtpPort: 587,
    auth: {
        user: 'louie.stokes@ethereal.email', // generated ethereal user
        pass: 'tHEAnZNmq2xT1Aazk5', // generated ethereal password
      },

};



