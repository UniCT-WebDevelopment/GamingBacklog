const mongoose = require('mongoose');

const userGameSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    game: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Game',
        required: true,
    },
    rating: {
        type: Number,
        min: 0,
        max: 10,
        default: 0,
    },
    played: {
        type: Boolean,
        default: false,
    },
    wantToPlay: {
        type: Boolean,
        default: false,
    }
}, { timestamps: true });

const UserGame = mongoose.model('UserGame', userGameSchema);

module.exports = UserGame;
