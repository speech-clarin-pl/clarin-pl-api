const app = require('./appPre');
const config = require('./config.js');


let listen = app.listen(config.port);
listen.setTimeout(720000000); //200min
console.log('CONNECTED AND LISTENING TO THE PORT: ' + config.port);

