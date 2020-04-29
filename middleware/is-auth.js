const jwt = require('jsonwebtoken');

const config = require('../config');
const dotenv = require('dotenv');
dotenv.config();

module.exports = (req, res, next) => {

    //można się zalogować albo poprzez wysłanie odpowiedniego tokena
    //albo podanie w nazwie GET parametru api_key z tym tokenem.

    const authHeader = req.get('Authorization');
    let apiKey = req.query.api_key; //pobieram api_key z adresu url - na potrzeby dostepu do plikow w repo

    // logotwanie GET aby dostac sie do repo
    if(apiKey && !authHeader){

        const token = apiKey;
        let decodedToken;
        try {
            decodedToken = jwt.verify(token, config.tokenKey);
        } catch (err){
            err.statusCode = 500;
            throw err;
        }

        //nie bylem w stanie zweryfikowac tokena..
        if(!decodedToken){
            const error = new Error('Not authenticated.');
            error.statusCode = 401;
            throw error;
        }

        //mamy dobry token
        req.userId = decodedToken.userId;
        next();

    // logowanie przeze header Authorization
    } else {

        if(!authHeader){
                const error = new Error('Not authenticated.');
                error.statusCode = 401;
                throw error;
        }

        const token = authHeader.split(' ')[1];
        let decodedToken;
        try {
            decodedToken = jwt.verify(token, config.tokenKey);
        } catch (err){
            err.statusCode = 500;
            throw err;
        }

        //nie bylem w stanie zweryfikowac tokena..
        if(!decodedToken){
            const error = new Error('Not authenticated.');
            error.statusCode = 401;
            throw error;
        }

            //mamy dobry token
        req.userId = decodedToken.userId;
        next();
    }


  

    
}