const fs = require('fs');
const path = require('path');

const mkdirp = require("mkdirp"); //do tworzenia folderu
const rimraf = require("rimraf"); 
const appRoot = require('app-root-path'); //zwraca roota aplikacji
const moment = require('moment');
const utils = require('../utils/utils');


// POBIERAM LISTE PLIKOW DANEGO UZYTKOWNIKA W JEGO FOLDERZE
exports.getRepoFiles = (req,res,next) => {
    console.log('GET REPO FILES');

    const userId = req.userId;
    const projectId = req.query.projectId;

    console.log(userId);
    console.log(projectId);
    
    //tymczasowo symulacja damych
    //one mjusza byc dynamicznie z node generowane
     const files = [
        {
          key: 'cat in a hat.mp3',
          modified: +moment().subtract(1, 'hours'),
          size: 1.5 * 1024 * 1024,
        },
        {
          key: 'photos/animals/kitten_ball.png',
          modified: +moment().subtract(3, 'days'),
          size: 545 * 1024,
        },
        {
          key: 'photos/animals/elephants.png',
          modified: +moment().subtract(3, 'days'),
          size: 52 * 1024,
        },
        {
          key: 'photos/funny fall.gif',
          modified: +moment().subtract(2, 'months'),
          size: 13.2 * 1024 * 1024,
        },
        {
          key: 'photos/holiday.jpg',
          modified: +moment().subtract(25, 'days'),
          size: 85 * 1024,
        },
        {
          key: 'documents/letter chunks.doc',
          modified: +moment().subtract(15, 'days'),
          size: 480 * 1024,
        },
        {
          key: 'documents/export.pdf',
          modified: +moment().subtract(15, 'days'),
          size: 4.2 * 1024 * 1024,
        },
      ];

      //sciezka do plikow danego usera i danego projektu
      const repoPath = appRoot + "/repo/" + userId + "/" + projectId;
      const repoFiles = utils.getFilePaths(repoPath);

      //sciezki zawieraja pewne sciezki wiec je przeksztalcam na relatywne
      const userfiles = repoFiles.map(path => {
              const relativePath = path.replace(repoPath,'');
              let fileEntry = {
                  key: relativePath,
                  modified: +moment().subtract(15, 'days'),
                  size: 4.2 * 1024 * 1024,
              }
              return fileEntry;
      })

     // console.log(userfiles);
      
      res.status(200).json({message: 'Files for this project and user featched!', files: userfiles})

}