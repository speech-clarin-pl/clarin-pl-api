const fs = require('fs-extra');
const path = require('path');
const appRoot = require('app-root-path'); //zwraca roota aplikacji 

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
            
            let dir = appRoot + '/repo/' + userId + '/' + projectId;
            console.log("------------------------")
            console.log("do katalogu " + dir )
            console.log(userId)
            console.log(projectId)
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
