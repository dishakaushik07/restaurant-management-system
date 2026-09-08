const mongoose = require('mongoose');
const tableSchema = new mongoose.Schema({
  number: { type: Number, required: true },
  capacity: { type: Number, required: true },
  status: { type: String, enum: ['available', 'occupied', 'reserved', 'cleaning'], default: 'available' },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true }
});
module.exports = mongoose.model('Table', tableSchema);