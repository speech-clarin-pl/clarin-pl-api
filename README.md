# CLARIN-PL-API
This is back-end for webservice for building audio corpora and analyzing speech signals, available at [https://mowa.clarin-pl.eu](https://mowa.clarin-pl.eu).
The project is a part of CLARIN-PL project. It order to run speech services in development mode, the system requires to have this docker image working [speechclarinpl/website-worker](https://hub.docker.com/r/speechclarinpl/website-worker) and the following installed:

 * **nodejs** - The environment for running the server written in javascript
 * **mongoDB** - database 
 * **ffmpeg** - library for audio conversion.
 * **python3** - the file where the project starts living - means where the server starts to listen to requests on given port.
 * **python3 textgrid** - python module for interacting with Praat TextGrid file types.
 * **audiowaveform** - audiowaveform is a C++ command-line application that generates waveform data from either MP3, WAV, FLAC, or Ogg Vorbis format audio files. 


## How to run the app
In order to run the app, rename the .env.development into .env.development.local (and the same for .env.production) and change the environmental variables defined there. Then run `npm install` and `npm run dev` (Linux) or `npm run devWin` (Windows) to start the server. 

## General Project Structure
The project includes the following folders:
 * **appPre.js/** - all configurations of the serwer (routes, global error handlers etc.) and here is the connection to database.
 * **app.js/** - the file where the project starts living - means where the server starts to listen to requests on given port.
 * **routes/** - contains the routes for API, divided into routes for each part of the front-end: authentication, home page, project list page, segmentation tool, recognition tool and user repository
* **repo/** - the directory for storing the user files and the outcomes of speech processing
* **tests/** - the directory with tests
* **apidoc/** - the api documentation
* **demo_files/** - the demo files, together with the ready output from the authomatic speech tools. These files are copied when the the demo session is created.
* **emu/** - python scripts for converting the output of speech tools into different formats
* **models/** - models of data structures for mongo db
* **middleware/** - the main middleware responsible for user authentication
* **controllers/** - all the tasks are implemented in this dir
* **clarin-api.postman_collection.json** - the API endpoints for testing in Postman application
* **run_worker.sh** - runs the docker image speechclarinpl/website-worker with appropriate development configuration.
* **run_worker_test.sh** - runs the docker image speechclarinpl/website-worker with appropriate test configuration (IMPORTANT! run this worker if you plan to run tests)

## Testing
We use [jestjs](https://jestjs.io/) testing framework for performing application tests. 
IMPORTANT!: before you run any test, create a new .env.test configuration file with separate configuration for database, especially use different DB_PATH variable than you use in dev or production. Otherwise, the tests will be running on the production version of the database and will remove all your data!
In order to start testing run `npm run test`. 

## Sending Feedback

We are always open to your feedback. Authors:

 * Mariusz Kleć (mklec@pjwstk.edu.pl): the front-end and API part
 * Danijel Korzinek (danijel@pjwstk.edu.pl): the speech processing tools

