const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Company = require('../models/Company');
const Job = require('../models/Job');
const Review = require('../models/Review');
const AuditLog = require('../models/AuditLog');
const authMiddleware = require('../middleware/auth');
const rbacMiddleware = require('../middleware/rbac');

// Get all companies for approval
router.get('/companies/pending', authMiddleware, rbacMiddleware(['admin']), async (req, res) => {
  try {
    const companies = await Company.find({ approvalStatus: 'pending' })
      .populate('owner', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, companies });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all users (admin)
router.get('/users', authMiddleware, rbacMiddleware(['admin']), async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search } = req.query;
    const query = {};

    if (role) query.role = role;
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Approve company
router.put('/companies/:id/approve', authMiddleware, rbacMiddleware(['admin']), async (req, res) => {
  try {
    const company = await Company.findByIdAndUpdate(
      req.params.id,
      { $set: { approvalStatus: 'approved', isVerified: true } },
      { new: true }
    );

    await AuditLog.create({
      user: req.user.userId,
      action: 'approve_company',
      entity: 'Company',
      entityId: company._id,
      status: 'success'
    });

    res.status(200).json({ success: true, company });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Reject company
router.put('/companies/:id/reject', authMiddleware, rbacMiddleware(['admin']), async (req, res) => {
  try {
    const company = await Company.findByIdAndUpdate(
      req.params.id,
      { $set: { approvalStatus: 'rejected' } },
      { new: true }
    );

    await AuditLog.create({
      user: req.user.userId,
      action: 'reject_company',
      entity: 'Company',
      entityId: company._id,
      status: 'success'
    });

    res.status(200).json({ success: true, company });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Suspend company
router.put('/companies/:id/suspend', authMiddleware, rbacMiddleware(['admin']), async (req, res) => {
  try {
    const company = await Company.findByIdAndUpdate(
      req.params.id,
      { $set: { isActive: false } },
      { new: true }
    );

    await AuditLog.create({
      user: req.user.userId,
      action: 'suspend_company',
      entity: 'Company',
      entityId: company._id,
      status: 'success'
    });

    res.status(200).json({ success: true, company });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Activate company
router.put('/companies/:id/activate', authMiddleware, rbacMiddleware(['admin']), async (req, res) => {
  try {
    const company = await Company.findByIdAndUpdate(
      req.params.id,
      { $set: { isActive: true } },
      { new: true }
    );

    await AuditLog.create({
      user: req.user.userId,
      action: 'activate_company',
      entity: 'Company',
      entityId: company._id,
      status: 'success'
    });

    res.status(200).json({ success: true, company });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get audit logs
router.get('/audit-logs', authMiddleware, rbacMiddleware(['admin']), async (req, res) => {
  try {
    const { page = 1, limit = 50, action, entity } = req.query;
    const query = {};

    if (action) query.action = action;
    if (entity) query.entity = entity;

    const logs = await AuditLog.find(query)
      .populate('user', 'firstName lastName email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await AuditLog.countDocuments(query);

    res.status(200).json({
      success: true,
      logs,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Suspend user
router.put('/users/:id/suspend', authMiddleware, rbacMiddleware(['admin']), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { isActive: false } },
      { new: true }
    ).select('-password');

    await AuditLog.create({
      user: req.user.userId,
      action: 'suspend_user',
      entity: 'User',
      entityId: user._id,
      status: 'success'
    });

    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get reported content (jobs/companies)
router.get('/reports', authMiddleware, rbacMiddleware(['admin']), async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate('company', 'name')
      .populate('reviewer', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, reports: reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
