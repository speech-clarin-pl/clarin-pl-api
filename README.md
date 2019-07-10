This project is written in Node js as the backend (API) for a new speech proccessing platform, developed as a part of CLARIN project. The current deployment of this platform is available at [https://mowa.clarin-pl.eu:8433/](https://mowa.clarin-pl.eu:8433/). This is the beta version of the new platform. The previous platform is available at [https://mowa.clarin-pl.eu/](https://mowa.clarin-pl.eu/). All features are intended to be developed here. Any suggestions and comment are welcomed.

## How to run the app
In order to run the app, rename the .env.example into .env and define the environmental variables defined there. Then run app.js in node. 

## General Project Structure
The project includes the following folders:
 * **app.js/** - the file where the project starts
 * **routes/** - contains the routes for API, divided into routes for each part of the front-end: authentication, home page, project list page, segmentation tool, recognition tool and user repository
* **repo/** - the directory for storing the user files and the outcomes of speech processing
* **models/** - models of data structures for mongo db
* **middleware/** - the main middleware responsible for user authentication
* **controllers/** - all the tasks are implemented in this dir

## Sending Feedback

We are always open to your feedback. Authors:

 * Mariusz Kleć (mklec@pjwstk.edu.pl): the front-end and API part
 * Danijel Korzinek (danijel@pjwstk.edu.pl): the speech processing tools

