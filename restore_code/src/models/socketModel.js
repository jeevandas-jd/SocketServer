const mongoose = require('mongoose');

const socketSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    socketId: {
        type: String,
        required: true,
        unique: true
    },
    connectedAt: {
        type: Date,
        default: Date.now
    }
});

const Socket = mongoose.model('Socket', socketSchema);

module.exports = Socket;