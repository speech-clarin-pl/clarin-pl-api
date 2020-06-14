const dotenv = require('dotenv');
dotenv.config();
const nodemailer = require('nodemailer');
const config = require('./config');
// konfiguracja transportera do wysyłania maili

module.exports = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    auth: {
      user: config.auth.user,
      pass: config.auth.pass,
    },
  });
 



