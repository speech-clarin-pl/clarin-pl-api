const fs = require('fs-extra');
const fsnormal = require('fs');
const appRoot = require('app-root-path'); //zwraca roota aplikacji 
const path = require('path');
var emptyDir = require('empty-dir');

exports.convertJSONFileIntoTXT = (JSONFilePath) => {
    let jsonFile = fs.readJsonSync(JSONFilePath);

    // w przyszłości poprawić jak będzie więcej bloków
    let txtContent = jsonFile.blocks[0].data.text;

    return txtContent
}

//having txt file, the function makes appropriate JSCON from it
exports.convertTxtFileIntoJSON = (txtFilePath) => {

    let transcription = fs.readFileSync(txtFilePath, 'utf8');

    let toReturnTemplate = {
        "blocks" : [
            {
                "starttime" : 123456,
                "stoptime" : 124556,
                "data" : {
                    "text": transcription,
                    "type": "speech"
                }
            }
        ]
    }

    return toReturnTemplate;
}

//funtion returns only the file name from the path
exports.getFileNameFromPath = (filePath) => {
    let splitedPath = filePath.split("/");
    return splitedPath[splitedPath.length-1];
}

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

  
  //jezeli mamy nazwapliku-23j2347_temp.wav to robie nazwapliku.wav
  exports.bringOryginalFileName = (fileName) =>{
    let ext = this.getFileExtention(fileName);
    let gdziedash = fileName.lastIndexOf('-');
    let nazwapliku = fileName.substring(0,gdziedash);
    let ostatecznie = nazwapliku + '.'+ext[0];

    return ostatecznie;
  }


  //cut the extension from filename
  exports.getFileNameWithNoExt = (fileName) =>{
    let gdziedot = fileName.lastIndexOf('.');
    let nazwaplikubezext = fileName.substring(0,gdziedot);
    return nazwaplikubezext;
  }

    //getExtentionOf the file
    exports.getFileExtention = (path) =>{
        return (path.match(/(?:.+..+[^\/]+$)/ig) != null) ? path.split('.').slice(-1): 'null';
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

  //zwraca nazwe pliku z wersji z dodaną data (multer tak robi)
  exports.getFileNameFromEncodedMulter = (encodedFileName) =>{

    let filename='';
    //pomysł jest taki aby zwracać ciąg do drugiej znalezionej od tyłu kropki..

    let gdziekropki = this.charPos(encodedFileName,'.');
    let gdziemyslniki = this.charPos(encodedFileName,'-');

    let pozycjaPrzedOstatniej = gdziekropki[gdziekropki.length -2];
    let pozycja = gdziemyslniki[gdziemyslniki.length -3];

    //jezeli plik ma rozszerzenie...
    if(gdziekropki.length >= 2){
        
        filename = encodedFileName.substring(0,pozycjaPrzedOstatniej);
        //wnioskuje rozszerzenie
        filename = filename + encodedFileName.substring(pozycjaPrzedOstatniej,pozycja);
    }else{
        //plik nie mial rozszerzenia ale jest ciagle ok
        //wtedy biore przed 3 myslnik przed myslinikeim
        
        
        filename = encodedFileName.substring(0,pozycja);
    }
    
    
    return filename;
  }

  
  //zwraca wystepowanie okreslonego znaku w stringu
  exports.charPos = (str, char) => {
    return str
           .split("")
           .map(function (c, i) { if (c == char) return i; })
           .filter(function (v) { return v >= 0; });
  }
  

  //zwraca ścieżkę katalogu w repo w którym jest plik
  exports.getRepoPathFromKey = (fileKey) =>{
    let gdzieslash = fileKey.lastIndexOf('/');
    let sciezka = fileKey.substring(0,gdzieslash);
    return sciezka;
  }

   //zwraca ścieżkę katalogu w repo w którym jest plik
   exports.getFileNameFromRepoKey = (fileKey) =>{
    let gdzieslash = fileKey.lastIndexOf('/');
    let filename = fileKey.substring(gdzieslash+1);
    return filename;
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
