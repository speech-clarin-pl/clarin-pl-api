const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ContainerSchema = new Schema({
    fileName: {
        type: String,
        required: true
    },
    txtFileName: {
        type: String,
        required: true,
    },
    owner: {
        type: Schema.Types.ObjectId,
        required: true,
    },
    size: {
        type: String,
        required: false
    },
    containerId: {
        type: Schema.Types.ObjectId,
        required: false,
    }
}, {timestamps: true});

module.exports = mongoose.model('TxtFile', ContainerSchema);