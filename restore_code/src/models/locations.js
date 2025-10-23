
const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
    department: { type: String, required: true }
});

const Location = mongoose.model('Location', locationSchema);
module.exports = Location;