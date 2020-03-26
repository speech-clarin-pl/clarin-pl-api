const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//definiuje jak wyglada wpis pojedynczego projektu w bazie danych
const SessionSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    projectId: {
        type: String,
        required: true
    },
    containersIds: [
        {
            type: Schema.Types.ObjectId,
            ref: 'ProjectFile'
        }
    ]
}, {timestamps: true});

module.exports = mongoose.model('Session', SessionSchema);