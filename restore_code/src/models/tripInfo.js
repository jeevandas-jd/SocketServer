
const mongoose = require('mongoose');


const tripInfoSchema = new mongoose.Schema({
      tripId: {
    type: String,
    unique: true,
    default: () => `TRIP-${Date.now()}-${Math.floor(Math.random() * 10000)}`
  },
    pickupLocation: { type: String, required: true },
    dropLocation: { type: String, required: true },
    passengerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    pilotId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    status: { type: String, enum: ['requested', 'accepted', 'in_progress', 'completed', 'cancelled'], default: 'requested' },
    fare: { type: Number, required: true },
    requestedAt: { type: Date, default: Date.now },
    acceptedAt: { type: Date },
    completedAt: { type: Date },
    cancelledAt: { type: Date }
});

const TripInfo = mongoose.model('TripInfo', tripInfoSchema);
module.exports = TripInfo;