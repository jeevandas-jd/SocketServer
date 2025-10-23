const mongoose = require("mongoose");
const User = require("./User");
const Counter=require("./counter")

const pilotSchema = new mongoose.Schema({
  pilotId: { type: String, unique: true }, // your custom ID
  name: String,
  department: String,
  studentID: String,
  gender: String,
  vehicleType: String,
  vehicleNumber: String,
  constactNo:String,
  isVerified: { type: Boolean, default: false, required: true },
  isApproved: { type: Boolean, default: false, required: true },
  isLive: { type: Boolean, default: false, required: true },

  ratingAverage: { type: Number, default: 0 },
  totalRatings: { type: Number, default: 0 },
  onBench: { type: Boolean, default: true },
});

// Auto-increment middleware for pilotId
pilotSchema.pre("save", async function (next) {
  if (this.isNew && !this.pilotId) {
    const counter = await Counter.findOneAndUpdate(
      { name: "pilot" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.pilotId = `PILOT${String(counter.seq).padStart(4, "0")}`;
  }
  next();
});

const Pilot = User.discriminator("pilot", pilotSchema);
module.exports = Pilot;
