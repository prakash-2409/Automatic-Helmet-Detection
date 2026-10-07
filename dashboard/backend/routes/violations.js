const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Violation = require('../models/Violation');
const dataStore = require('../dataStore');

function isMongoConnected() {
  return mongoose.connection.readyState === 1;
}

// GET all violations with filters and pagination
router.get('/', async (req, res, next) => {
  try {
    const { status, type, page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    if (isMongoConnected()) {
      const query = {};
      if (status) query.status = status;
      if (type) query.violationType = type;

      const violations = await Violation.find(query)
        .sort({ detectedAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum);
      
      const total = await Violation.countDocuments(query);
      return res.json({
        violations,
        totalPages: Math.ceil(total / limitNum) || 1,
        currentPage: pageNum,
        total
      });
    }

    // Local JSON fallback
    let list = dataStore.getViolations();
    if (status) {
      list = list.filter(v => v.status === status);
    }
    if (type) {
      list = list.filter(v => v.violationType === type);
    }

    list.sort((a, b) => new Date(b.detectedAt) - new Date(a.detectedAt));
    const total = list.length;
    const paginated = list.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    res.json({
      violations: paginated,
      totalPages: Math.ceil(total / limitNum) || 1,
      currentPage: pageNum,
      total
    });
  } catch (err) {
    next(err);
  }
});

// GET stats
router.get('/stats', async (req, res, next) => {
  try {
    if (isMongoConnected()) {
      const total = await Violation.countDocuments();
      const pending = await Violation.countDocuments({ status: 'pending_review' });
      const autoFined = await Violation.countDocuments({ status: 'auto_fined' });
      const confirmed = await Violation.countDocuments({ status: 'confirmed' });
      const dismissed = await Violation.countDocuments({ status: 'dismissed' });
      const noHelmet = await Violation.countDocuments({ violationType: 'no_helmet' });
      const tripleRiding = await Violation.countDocuments({ violationType: 'triple_riding' });

      return res.json({
        total,
        pending,
        autoFined,
        confirmed,
        dismissed,
        byType: { noHelmet, tripleRiding }
      });
    }

    // Local JSON fallback
    const list = dataStore.getViolations();
    const total = list.length;
    const pending = list.filter(v => v.status === 'pending_review').length;
    const autoFined = list.filter(v => v.status === 'auto_fined').length;
    const confirmed = list.filter(v => v.status === 'confirmed').length;
    const dismissed = list.filter(v => v.status === 'dismissed').length;
    const noHelmet = list.filter(v => v.violationType === 'no_helmet').length;
    const tripleRiding = list.filter(v => v.violationType === 'triple_riding').length;

    res.json({
      total,
      pending,
      autoFined,
      confirmed,
      dismissed,
      byType: { noHelmet, tripleRiding }
    });
  } catch (err) {
    next(err);
  }
});

// GET single violation
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (isMongoConnected()) {
      const violation = await Violation.findById(id);
      if (!violation) return res.status(404).json({ message: 'Not found' });
      return res.json(violation);
    }

    const list = dataStore.getViolations();
    const violation = list.find(v => (v._id === id || v.id === id));
    if (!violation) return res.status(404).json({ message: 'Not found' });
    res.json(violation);
  } catch (err) {
    next(err);
  }
});

// PATCH update status
router.patch('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, reviewedBy } = req.body;

    if (isMongoConnected()) {
      const violation = await Violation.findByIdAndUpdate(
        id,
        { status, reviewedBy, reviewedAt: new Date() },
        { new: true }
      );
      if (!violation) return res.status(404).json({ message: 'Not found' });
      return res.json(violation);
    }

    const list = dataStore.getViolations();
    const item = list.find(v => (v._id === id || v.id === id));
    if (!item) return res.status(404).json({ message: 'Not found' });

    item.status = status;
    item.reviewedBy = reviewedBy || 'Officer Admin';
    item.reviewedAt = new Date().toISOString();
    dataStore.saveViolations(list);

    res.json(item);
  } catch (err) {
    next(err);
  }
});

// POST new violation
router.post('/', async (req, res, next) => {
  try {
    if (isMongoConnected()) {
      const violation = new Violation(req.body);
      await violation.save();
      return res.status(201).json(violation);
    }

    const list = dataStore.getViolations();
    const newRecord = {
      _id: `v_${Date.now()}`,
      id: `v_${Date.now()}`,
      detectedAt: new Date().toISOString(),
      ...req.body
    };
    list.unshift(newRecord);
    dataStore.saveViolations(list);

    res.status(201).json(newRecord);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
