const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//definiuje jak wyglada wpis pojedynczego projektu w bazie danych
const projectFile = new Schema({
    name: {
        type: String,
        required: true
    },
    fileSize: {
        type: String,
        required: true
    },
    fileModified: {
        type: String,
        required: true
    },
    projectOwner: {
        type: Schema.Types.ObjectId,
        ref: 'ProjectEntry',
        required: true,
    },
}, {timestamps: true});

module.exports = mongoose.model('ProjectFile', projectFile);