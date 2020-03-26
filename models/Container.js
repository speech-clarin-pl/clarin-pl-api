const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ContainerSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    size: {
        type: String,
        required: false
    },
    sessionId: {
        type: Schema.Types.ObjectId,
        required: true,
    },
    ifVAD: {
        type: Schema.Types.Boolean,
        default: false,
    },
    ifDIA: {
        type: Schema.Types.Boolean,
        default: false,
    },
    ifREC: {
        type: Schema.Types.Boolean,
        default: false,
    },
    ifSEG: {
        type: Schema.Types.Boolean,
        default: false,
    },
}, {timestamps: true});

module.exports = mongoose.model('Container', ContainerSchema);