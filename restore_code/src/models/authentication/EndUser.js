
const mongoose = require("mongoose");
const User = require("./User");

const EndUserSchema = new mongoose.Schema({
  name: String,
  department: String,
  studentID: String,
  gender: String,
  contactNo: String,
  ratingAverage: { type: Number, default: 0 },
  totalRatings: { type: Number, default: 0 }
});

const EndUser = User.discriminator("consumer", EndUserSchema);
module.exports = EndUser;
