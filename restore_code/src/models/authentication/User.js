const mongoose = require("mongoose");

const options = { discriminatorKey: "role", timestamps: true };

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String }, // only for manual auth
  googleId: { type: String },
  token:{type:Number},
  isVerified: { type: Boolean, default: false },
  role: { type: String, enum: ["admin", "pilot", "consumer"], required: true },
  FormSubmitted: { type: Boolean, default: false },
}, options);

const User = mongoose.model("User", userSchema);

module.exports = User;