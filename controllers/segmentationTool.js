const dockerTaskController = require('./runTask');
const dockerTaskControllerOK = require('./runTaskOK');
const appRoot = require('app-root-path'); //zwraca roota aplikacji  
const ProjectEntry = require('../models/projectEntry');
const ProjectFile = require('../models/projectFile');
const fs = require('fs-extra');
const User = require('../models/user');
const utils = require('../utils/utils');

exports.startEntrySegmentation =  (req, res,next) => {
  
    const entryId = req.body.entryId;
    const userId = req.body.userId;  
    const projectId = req.body.projectId; 

    let sentAudioFile = null;
    let sentTxtFile = null; 
    
    const audioFrom = req.body.audioFrom;
    const txtFrom = req.body.txtFrom;
    
    console.log('START ENTRY SEGMENTATION')
    console.log(entryId)
    console.log(userId)
    console.log(projectId)
   
    console.log(audioFrom)
    console.log(txtFrom)
    
     
     //nazrazie zakładam że audio i text muszą pochodzić z jednego źródła
     //tzn. oba albo z local albo oba z repo


     if(audioFrom=="local" && txtFrom=="local"){

        //powinny być wysłane dwa pliki
        //musze sprawdzić jakie maja rozszerzenia aby przyporzadkowac je do odpowiednich zmiennych
        // sentAudioFile = req.files[0].filename;
        // sentTxtFile = req.files[1].filename;
        // console.log(sentAudioFile)
        // console.log(sentTxtFile)

        //  if(!sentAudioFile){
        //     const error = new Error('No audio file provided');
        //     error.statusCode = 422;
        //     throw error;
        // }

        // if(!sentTxtFile){
        //     const error = new Error('No audio file provided');
        //     error.statusCode = 422;
        //     throw error;
        // }

        
     } else if(audioFrom=="repo" && txtFrom=="repo"){

        sentAudioFile = JSON.parse(req.body.audioFiles);
        sentTxtFile = JSON.parse(req.body.txtFiles);
        
        console.log(sentAudioFile)
        console.log(sentTxtFile)

        if(!sentAudioFile){
            const error = new Error('No audio file provided');
            error.statusCode = 422;
            throw error;
        }

        if(!sentTxtFile){
            const error = new Error('No txt file provided');
            error.statusCode = 422;
            throw error;
        }

        //jeżli plik pochodzi z repo,  Wyszukuje go z bazy danych i kopiuje tymczasowo do 
         //repo/uploaded_temp

         let sentAudioFileId = sentAudioFile.fileId;
         let sentTxtFileId = sentTxtFile.fileId;

         let foundProjectEntry = null;

        ProjectEntry.findById(projectId)
        .then((foundPE)=> {

            foundProjectEntry = foundPE;
             //mam pewnosc ze to jest projekt uzytkownika...
            //wiec wyszukuje z bazy wpis dotyczacy pliku ktory zostal przeciagniety
            const draggedAudioFile = foundProjectEntry.files.find(file => {
                return file._id == sentAudioFileId;
            });
            const draggedTxtFile = foundProjectEntry.files.find(file => {
                return file._id == sentTxtFileId;
            });

            //wydobywam informacje dla audio
            const draggedAudioFileName = draggedAudioFile.name;
            const draggedAudioFileKey = draggedAudioFile.fileKey;
            const draggedAudioFileSize = draggedAudioFile.fileSize;
            const draggedAudioFileModified = draggedAudioFile.fileModified;

            //wydobywam informacje dla txt
            const draggedTxtFileName = draggedTxtFile.name;
            const draggedTxtFileKey = draggedTxtFile.fileKey;
            const draggedTxtFileSize = draggedTxtFile.fileSize;
            const draggedTxtFileModified = draggedTxtFile.fileModified;

             //KOPIUJE PLIKI DO KATALOGU 'repo/uploaded_temp' dla dokera do przetworzenia
             let fileAudioFrom = appRoot + '/repo/' + userId + '/' + projectId + '/' + draggedAudioFileKey ;
             let fileTxtFrom = appRoot + '/repo/' + userId + '/' + projectId + '/' + draggedTxtFileKey ;

             //buduje unikatowa nazwe dla pliku dla bezpieczenstwa dodajac date
             let newOryginalAudioName = draggedAudioFileName + '-'+new Date().toISOString();
             let newOryginalTxtName = draggedTxtFileName + '-'+new Date().toISOString();

             let fileAudioTo = appRoot + '/repo/uploaded_temp/' + newOryginalAudioName;
             let fileTxtTo = appRoot + '/repo/uploaded_temp/' + newOryginalTxtName;

             fs.copy(fileAudioFrom, fileAudioTo)
             .then(()=>{
                fs.copy(fileTxtFrom, fileTxtTo)
                .then(()=>{
                    // //tutaj uruchamiam task z dockera
                    dockerTaskControllerOK.runTaskOK(
                        "forcealign",
                        draggedAudioFileKey,
                        draggedTxtFileKey,
                        sentAudioFileId,
                        sentTxtFileId,
                        newOryginalAudioName,
                        newOryginalTxtName,
                        userId,
                        projectId,
                        entryId)
                        .then(task =>{
                            console.log(' TASK ZAKONCZONY SUKCESEM');

                            // teraz jeszcze czyszcze uploaded_temp
                            fs.remove(fileAudioTo)
                            .then(() => {
                                fs.remove(fileTxtTo)
                                .then(()=>{
                                    res.status(201).json({ message: "segmentation task finished with sucess", sentEntryId: { entryId } });
                                })
                            })
                        })
                        .catch(err => {
                            console.log(' PROBLEM Z TASKIEM ');
                            if(!err.statusCode){
                                err.statusCode = 500;
                            }

                            // teraz jeszcze czyszcze uploaded_temp
                            fs.remove(fileAudioTo)
                            .then(() => {
                                fs.remove(fileTxtTo)
                                .then(()=>{
                                    res.status(500).json({ message: "Something went wrong!", sentEntryId: { entryId }  });
                                    next(err);
                                })
                            })
                        })
                })
             })
        })

     }

}