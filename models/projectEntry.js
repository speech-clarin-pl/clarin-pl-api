const mongoose = require('mongoose');
const User = require('./user');
const Schema = mongoose.Schema;

//definiuje jak wyglada wpis pojedynczego projektu w bazie danych
const projectEntrySchema = new Schema({
    name: {
        type: String,
        required: true
    },
    projectCreated: {
        type: String,
        required: true
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
   // accessToRead: {
   //     type: Array,
   //     required: false,
   // },
   // accessToEdit: {
   //     type: Array,
   //     required: false,
   // },
    sessionIds: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Session',
            required: false,
        }
    ],
    corpusCreatedAt:{
        type: Date,
        required: false,
    }
}, {timestamps: true});



//sprawdzenie czy użytkownik znajduje się na liście uprawnionych do odczytu tego zasobu
projectEntrySchema.methods.checkPermission = async function (loggedUserId) {

    const project = this;

    let error = new Error('Nie masz uprawnień!');
    error.statusCode = 403;

    //sprawdzam czy mam uprawnienia
    const userToCheck = await User.findById(loggedUserId,"_id status");

    //jeżeli użytkownik nie jest aktywowany bądź znaleziony nie jest zalogowanym to
    if ((userToCheck._id.toString() !== loggedUserId.toString()) || (userToCheck.status.toString() !== "Active")) {
      throw error;
    }

    //jeżeli zalogowany użytkownik nie jest właścicielem tego zasobu
    if(project.owner.toString() !== loggedUserId.toString()){
        throw error;
    }
}

module.exports = mongoose.model('ProjectEntry', projectEntrySchema);
