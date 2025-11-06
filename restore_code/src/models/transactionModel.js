const mongoose = require('mongoose');
const Pilot = require('./authentication/PilotUser');


const transactionSchema = new mongoose.Schema({
    transactionId: {
    type: String,
    unique: true,
    default: () => `TXN-${Date.now()}-${Math.floor(Math.random() * 10000)}`
  },
    tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'TripInfo', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    PilotId: { type: mongoose.Schema.Types.ObjectId, ref: 'PilotUser', required: true },
    amount: { type: Number, required: true },
    paymentMethod: { type: String, enum: ['credit_card', 'debit_card', 'paypal', 'wallet'], required: true },
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
    createdAt: { type: Date, default: Date.now },

});

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;