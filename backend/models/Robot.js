const mongoose = require('mongoose');
const robotSchema = new mongoose.Schema({
  name: { type: String, required: true },
  macAddress: { type: String, required: true, unique: true },
  apiKey: { type: String, required: true },
  status: { type: String, enum: ['idle', 'delivering', 'returning', 'charging', 'offline'], default: 'offline' },
  batteryLevel: { type: Number, default: 100 },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true }
});
module.exports = mongoose.model('Robot', robotSchema);