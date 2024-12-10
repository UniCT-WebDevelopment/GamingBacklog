const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    profilePicture: {
        data: Buffer,
        contentType: String,
    },
    description: {
        type: String,
        default: 'No description provided'
    }
});

module.exports = mongoose.model('User', userSchema);
