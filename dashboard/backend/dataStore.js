const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'violations.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const statuses = ['pending_review', 'auto_fined', 'confirmed', 'dismissed'];
const types = ['no_helmet', 'triple_riding'];
const plates = [
  'TN 07 AA 1234', 'TN 09 BX 9876', 'TN 01 CV 4567', 
  'TN 10 DX 5555', 'TN 22 ER 1010', 'TN 02 BG 3412',
  'TN 18 KM 7788', 'TN 05 AZ 9090'
];
const locations = ['Anna Salai, Chennai', 'OMR (IT Corridor)', 'GST Road, Tambaram', 'Poonamallee High Road'];

function generateInitialData() {
  const list = [];
  for (let i = 1; i <= 24; i++) {
    const status = statuses[i % statuses.length];
    const type = types[i % types.length];
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(i / 3));
    date.setHours(8 + (i * 2) % 12, (i * 17) % 60);

    list.push({
      _id: `v_${i}`,
      id: `v_${i}`,
      plateText: plates[i % plates.length],
      confidence: parseFloat((0.72 + (i % 25) * 0.01).toFixed(2)),
      violationType: type,
      status: status,
      fineAmount: 1000,
      evidenceImagePath: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&auto=format&fit=crop&q=80',
      detectedAt: date.toISOString(),
      reviewedAt: status === 'pending_review' ? null : new Date().toISOString(),
      reviewedBy: status === 'pending_review' ? null : 'Sub-Inspector TN-402',
      location: locations[i % locations.length],
      vehicleTrackId: `trk_${100 + i}`,
      detectionDetails: {
        helmetConfidence: parseFloat((0.82 + (i % 15) * 0.01).toFixed(2)),
        plateConfidence: parseFloat((0.86 + (i % 12) * 0.01).toFixed(2)),
        ocrConfidence: parseFloat((0.89 + (i % 10) * 0.01).toFixed(2)),
        riderCount: type === 'triple_riding' ? 3 : 2
      }
    });
  }
  return list;
}

function getViolations() {
  if (!fs.existsSync(DATA_FILE)) {
    const initial = generateInitialData();
    fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    const initial = generateInitialData();
    fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }
}

function saveViolations(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

module.exports = {
  getViolations,
  saveViolations,
  generateInitialData
};
