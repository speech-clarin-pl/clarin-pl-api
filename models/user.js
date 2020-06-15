const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        default: 'user',
    },
    name: {
        type: String,
        required: true
    },
    status: {
        type: String,
        default: 'new user'
    },
    projects: [
        {
            type: Schema.Types.ObjectId,
            ref: 'ProjectEntry'
        }
    ]
}, {timestamps: true});

module.exports = mongoose.model('User', userSchema);