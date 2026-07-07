const express = require('express');
const router = express.Router();
const Company = require('../models/Company');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const rbacMiddleware = require('../middleware/rbac');

// Create company (Company Owner)
router.post('/', authMiddleware, rbacMiddleware(['company_owner']), async (req, res) => {
  try {
    const { name, description, website, industry, companySize, headquarters } = req.body;

    let company = await Company.findOne({ name });
    if (company) {
      return res.status(400).json({ success: false, message: 'Company already exists' });
    }

    company = new Company({
      name,
      slug: name.toLowerCase().replace(/\s+/g, '-'),
      description,
      website,
      industry,
      companySize,
      headquarters,
      owner: req.user.userId
    });

    await company.save();

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { company: company._id },
      { new: true }
    );

    res.status(201).json({ success: true, company });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all companies (public)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, industry } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (industry) {
      query.industry = industry;
    }

    const companies = await Company.find(query)
      .populate('owner', 'firstName lastName email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Company.countDocuments(query);

    res.status(200).json({
      success: true,
      companies,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get company by ID
router.get('/:id', async (req, res) => {
  try {
    const company = await Company.findById(req.params.id)
      .populate('owner', 'firstName lastName email')
      .populate('hrManagers', 'firstName lastName email');

    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    res.status(200).json({ success: true, company });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update company profile
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);

    if (company.owner.toString() !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const updatedCompany = await Company.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    res.status(200).json({ success: true, company: updatedCompany });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add HR manager to company
router.post('/:id/hr-manager', authMiddleware, async (req, res) => {
  try {
    const { hrManagerId } = req.body;
    const company = await Company.findById(req.params.id);

    if (company.owner.toString() !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const updatedCompany = await Company.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { hrManagers: hrManagerId } },
      { new: true }
    ).populate('hrManagers', 'firstName lastName email');

    res.status(200).json({ success: true, company: updatedCompany });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
