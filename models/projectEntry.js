const mongoose = require('mongoose');
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
    accessToRead: {
        type: Array,
        required: false,
    },
    accessToEdit: {
        type: Array,
        required: false,
    }
}, {timestamps: true});

module.exports = mongoose.model('ProjectEntry', projectEntrySchema);