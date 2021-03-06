const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//definiuje jak wyglada wpis pojedynczego projektu w bazie danych
const task = new Schema({
    task: {
        type: String,
        required: true
    },
    in_progress: {
        type: Boolean,
        required: true,
        default: false,
    },
    done: {
        type: Boolean,
        required: true,
        default: false,
    },
    time: {
        type: Date,
        required: true,
        default: new Date().toUTCString(),
    },
    input: {
        type: Schema.Types.Mixed,
        required: true
    },
    result: {
        type: String,
        required: false
    },
    error: {
        type: String,
        required: false
    }
    
}, {timestamps: true});

module.exports = mongoose.model('Task', task);