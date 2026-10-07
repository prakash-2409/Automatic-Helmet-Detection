const mongoose = require('mongoose');

const violationSchema = new mongoose.Schema({
  plateText: String,
  confidence: Number,
  violationType: { type: String, enum: ['no_helmet', 'triple_riding'] },
  status: { type: String, enum: ['pending_review', 'auto_fined', 'confirmed', 'dismissed'], default: 'pending_review' },
  fineAmount: { type: Number, default: 1000 },
  evidenceImagePath: String,
  detectedAt: { type: Date, default: Date.now },
  reviewedAt: Date,
  reviewedBy: String,
  location: String,
  vehicleTrackId: String,
  detectionDetails: {
    helmetConfidence: Number,
    plateConfidence: Number,
    ocrConfidence: Number,
    riderCount: Number,
  }
});

module.exports = mongoose.model('Violation', violationSchema);
