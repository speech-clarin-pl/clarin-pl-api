const fs = require('fs-extra');

fs.copy('./jakisprosty.txt', './drugiplikskopiowany.txt')
  .then(() => console.log('success!'))
  .catch(err => console.error("wystapil blad" + err));
