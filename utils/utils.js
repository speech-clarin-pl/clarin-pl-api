const fs = require('fs');
const path = require('path');

/** Retrieve file paths from a given folder and its subfolders. */
exports.getFilePaths = (folderPath) => {
    const entryPaths = fs.readdirSync(folderPath).map(entry => path.join(folderPath, entry));
    const filePaths = entryPaths.filter(entryPath => fs.statSync(entryPath).isFile());
    const dirPaths = entryPaths.filter(entryPath => !filePaths.includes(entryPath));
    const dirFiles = dirPaths.reduce((prev, curr) => prev.concat(getFilePaths(curr)), []);
    return [...filePaths, ...dirFiles];
  };

  // przenosi plik z glownego repo do katalogu uzytkownika i jego projektu
  exports.moveFileToUserRepo = (projectId, userId, file) => {
    return new Promise((resolve, reject) => {
        if (file) {
            //przenosze plik
            console.log("przenosze plik: " + file);
            console.log("do katalogu ")
            var dir = appRoot + '/repo/' + userId + '/' + projectId;
            console.log(dir)
            fs.move('./repo/' + file, dir + '/' + file, function (err) {
                if (err) {
                    console.error(err);
                    reject(err);
                } else {
                    resolve(dir);
                }
            });
        }
    });
}
