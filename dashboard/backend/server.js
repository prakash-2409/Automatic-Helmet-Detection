require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const violationsRoutes = require('./routes/violations');
const uploadRoutes = require('./routes/upload');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Static folder for uploaded files/evidence
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/violations', violationsRoutes);
app.use('/api/upload', uploadRoutes);

// Error Handler
app.use(errorHandler);

// Attempt MongoDB Connection, but don't crash if offline (fallback to dataStore)
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/helmet_detection';

mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 2000 })
  .then(() => {
    console.log('✅ Connected to MongoDB successfully.');
  })
  .catch((err) => {
    console.log('ℹ️  MongoDB not detected locally. Operating in standalone JSON storage mode.');
  })
  .finally(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Tamil Nadu Police E-Challan API Server running at http://localhost:${PORT}`);
    });
  });
