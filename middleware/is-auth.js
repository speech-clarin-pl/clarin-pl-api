const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    //sprawdzam czy token jest poprawny
    const authHeader = req.get('Authorization');
    
    if(!authHeader){
        const error = new Error('Not authenticated.');
        error.statusCode = 401;
        throw error;
    }

    const token = authHeader.split(' ')[1];
    let decodedToken;
    try {
        decodedToken = jwt.verify(token, 'olaujelajajo');
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