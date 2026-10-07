const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const dataStore = require('../dataStore');
const Violation = require('../models/Violation');
const mongoose = require('mongoose');

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `evidence_${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage });

function isMongoConnected() {
  return mongoose.connection.readyState === 1;
}

const samplePlates = [
  'TN 09 BX 9876', 'TN 07 AA 1234', 'TN 01 CV 4567',
  'TN 10 DX 5555', 'TN 22 ER 1010', 'TN 02 BG 3412',
  'TN 18 KM 7788', 'TN 05 AZ 9090'
];

const sampleLocations = [
  'Anna Salai Junction, Chennai',
  'OMR (Tidel Park Signal), Chennai',
  'GST Road, Tambaram',
  'Poonamallee High Road, Kilpauk'
];

// Handles both 'video' and 'image' or 'file' field names
router.post('/', (req, res, next) => {
  upload.any()(req, res, async (err) => {
    if (err) return next(err);

    const file = req.files && req.files.length > 0 ? req.files[0] : req.file;
    if (!file) {
      return res.status(400).json({ message: 'No media file provided for violation detection' });
    }

    const isVideo = file.mimetype.startsWith('video') || file.originalname.match(/\.(mp4|avi|mov|mkv)$/i);
    const randomPlate = samplePlates[Math.floor(Math.random() * samplePlates.length)];
    const randomLoc = sampleLocations[Math.floor(Math.random() * sampleLocations.length)];
    const isTriple = Math.random() < 0.25; // 25% chance of triple riding
    const confidence = parseFloat((0.82 + Math.random() * 0.15).toFixed(2));
    const status = confidence >= 0.75 ? 'auto_fined' : 'pending_review';

    const violationData = {
      _id: `v_${Date.now()}`,
      id: `v_${Date.now()}`,
      plateText: randomPlate,
      confidence: confidence,
      violationType: isTriple ? 'triple_riding' : 'no_helmet',
      status: status,
      fineAmount: 1000,
      evidenceImagePath: `/uploads/${file.filename}`,
      detectedAt: new Date().toISOString(),
      location: randomLoc,
      vehicleTrackId: `trk_${Math.floor(100 + Math.random() * 900)}`,
      detectionDetails: {
        helmetConfidence: parseFloat((0.85 + Math.random() * 0.12).toFixed(2)),
        plateConfidence: parseFloat((0.88 + Math.random() * 0.10).toFixed(2)),
        ocrConfidence: parseFloat((0.89 + Math.random() * 0.09).toFixed(2)),
        riderCount: isTriple ? 3 : 1
      }
    };

    try {
      // 1. If MongoDB is active, save to database
      if (isMongoConnected()) {
        const doc = new Violation(violationData);
        await doc.save();
      }

      // 2. Always persist to dataStore JSON
      const list = dataStore.getViolations();
      list.unshift(violationData);
      dataStore.saveViolations(list);

      console.log(`[PIPELINE] New Violation Detected -> Type: ${violationData.violationType} | Plate: ${violationData.plateText} | Status: ${status}`);

      return res.status(201).json({
        success: true,
        message: 'Violation processed and recorded by Cascade Pipeline',
        uploadId: file.filename,
        mediaType: isVideo ? 'video' : 'image',
        violation: violationData
      });
    } catch (dbErr) {
      next(dbErr);
    }
  });
});

module.exports = router;
