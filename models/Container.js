const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ContainerSchema = new Schema({
    fileName: {
        type: String,
        required: true
    },
    containerName: {
        type: String,
        required: true,
    },
    owner: {
        type: Schema.Types.ObjectId,
        required: true,
    },
    project: {
        type: Schema.Types.ObjectId,
        required: true,
    },
    size: {
        type: String,
        required: false
    },
    session: {
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
    statusVAD: {
        type: String,
        required: false
    },
    statusDIA: {
        type: String,
        required: false
    },
    statusREC: {
        type: String,
        required: false
    },
    statusSEG: {
        type: String,
        required: false
    },
    txtFileId: {
        type: Schema.Types.ObjectId,
        required: false,
    },
    VADUserSegments: {
        type: Schema.Types.Mixed,
        required: false
    },
    DIAUserSegments: {
        type: Schema.Types.Mixed,
        required: false
    },
    RECUserSegments: {
        type: Schema.Types.Mixed,
        required: false
    },
}, {timestamps: true});

module.exports = mongoose.model('Container', ContainerSchema);