const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//definiuje jak wyglada wpis pojedynczego projektu w bazie danych
const projectFile = new Schema({
    name: {
        type: String,
        required: true
    },
    fileKey: {
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
    connectedWithFiles: [
        {
            type: Schema.Types.ObjectId,
            ref: 'ProjectFile'
        }
    ]
}, {timestamps: true});

module.exports = mongoose.model('ProjectFile', projectFile);