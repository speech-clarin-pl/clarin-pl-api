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


//formats nr of bytes into readable format
exports.bytesToSize = (bytes) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return 'n/a';
    const i = parseInt(Math.floor(Math.log(Math.abs(bytes)) / Math.log(1024)), 10);
    if (i === 0) return `${bytes} ${sizes[i]})`;
    return `${(bytes / (1024 ** i)).toFixed(1)} ${sizes[i]}`;
  }

  //add sufix to the name of given file
  exports.addSuffixToFileName = (fileName, suffix, ext=null) =>{
    let gdziedot = fileName.lastIndexOf('.');
    let nazwaplikubezext = fileName.substring(0,gdziedot);
    let fileext;
    if(ext==null){
         fileext = fileName.substring(gdziedot + 1);
    } else {
        fileext = ext;
    }
    nazwaplikubezext = nazwaplikubezext + suffix;
    return nazwaplikubezext + '.' + fileext;
  }

  //zwraca ścieżkę katalogu w repo w którym jest plik
  exports.getRepoPathFromKey = (fileKey) =>{
    let gdzieslash = fileKey.lastIndexOf('/');
    let sciezka = fileKey.substring(0,gdzieslash);
    return sciezka;
  }


  // przenosi plik z glownego repo do katalogu uzytkownika i jego projektu
  exports.moveFileToUserRepo = (projectId, userId, file) => {
    return new Promise((resolve, reject) => {
        if (file) {
            //przenosze plik
            console.log("przenosze plik: " + file);
            
            let dir = appRoot + '/repo/' + userId + '/' + projectId;
            //console.log("------------------------")
            //console.log("do katalogu " + dir )
           // console.log(userId)
            //console.log(projectId)
           // console.log(dir)

            fs.move('./repo/uploaded_temp/' + file, dir + '/' + file, function (err) {
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
