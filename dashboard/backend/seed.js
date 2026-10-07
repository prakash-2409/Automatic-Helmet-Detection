const mongoose = require('mongoose');
const Violation = require('./models/Violation');
const dataStore = require('./dataStore');

const statuses = ['pending_review', 'auto_fined', 'confirmed', 'dismissed'];
const types = ['no_helmet', 'triple_riding'];
const plates = ['TN 07 AA 1234', 'TN 09 BX 9876', 'TN 01 CV 4567', 'TN 10 DX 5555', 'TN 22 ER 1010'];
const locations = ['Anna Salai, Chennai', 'OMR (IT Corridor)', 'GST Road, Tambaram', 'Poonamallee High Road'];

const seedDB = async () => {
  // Always seed JSON storage
  const initial = dataStore.generateInitialData();
  dataStore.saveViolations(initial);
  console.log(`✅ Seeded ${initial.length} violations into local dataStore (JSON).`);

  // Attempt MongoDB seeding if available
  try {
    await mongoose.connect('mongodb://localhost:27017/helmet_detection', { serverSelectionTimeoutMS: 2000 });
    console.log('Connected to MongoDB for seeding...');
    await Violation.deleteMany({});
    await Violation.insertMany(initial);
    console.log('✅ MongoDB seeded successfully.');
    await mongoose.connection.close();
  } catch (err) {
    console.log('ℹ️  MongoDB offline; local JSON dataStore seeded and ready.');
  }
  process.exit(0);
};

seedDB();
