const fs = require('fs-extra');
const appRoot = require('app-root-path'); //zwraca roota aplikacji 
const path = require('path');
var emptyDir = require('empty-dir');

exports.readDir = (dir, callback) => {

    let files = [];

    walkDir = (dir, callbackWK) => {

        fs.readdirSync(dir).forEach( f => {
            let dirPath = path.join(dir, f);
            let isDirectory = fs.statSync(dirPath).isDirectory();
           
            //console.log(dirPath)
            if(isDirectory){
                let isEmptyDir = emptyDir.sync(dirPath);
                if(isEmptyDir){
                    files.push(path.join(dir, f) + '/');
                }
                //callback(path.join(dir, f));
                walkDir(dirPath, callback) ;
            } else {
                files.push(path.join(dir, f));
                //callback(path.join(dir, f));
            }
        });
        //callbackWK(files)
    }

    walkDir(dir);
    callback(files);

}


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
