const express = require('express');
const router = express.Router();
const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');
const Notification = require('../models/Notification');
const authMiddleware = require('../middleware/auth');
const rbacMiddleware = require('../middleware/rbac');

// Apply for job
router.post('/', authMiddleware, rbacMiddleware(['job_seeker']), async (req, res) => {
  try {
    const { jobId, resume, coverLetter } = req.body;

    const job = await Job.findById(jobId).populate('company');
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    const existingApplication = await Application.findOne({
      job: jobId,
      applicant: req.user.userId
    });

    if (existingApplication) {
      return res.status(400).json({ success: false, message: 'Already applied for this job' });
    }

    const application = new Application({
      job: jobId,
      applicant: req.user.userId,
      company: job.company._id,
      resume,
      coverLetter
    });

    await application.save();

    await Job.findByIdAndUpdate(
      jobId,
      { $inc: { applicantCount: 1 }, $push: { applications: application._id } }
    );

    // Create notification for HR
    await Notification.create({
      recipient: job.postedBy,
      type: 'application_received',
      title: 'New Application',
      message: `New application received for ${job.title}`,
      data: { jobId, applicationId: application._id }
    });

    res.status(201).json({ success: true, application });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get applications for a job (HR)
router.get('/job/:jobId', authMiddleware, rbacMiddleware(['hr_manager', 'company_owner']), async (req, res) => {
  try {
    const applications = await Application.find({ job: req.params.jobId })
      .populate('applicant', 'firstName lastName email profile')
      .populate('job', 'title')
      .sort({ appliedAt: -1 });

    res.status(200).json({ success: true, applications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get my applications
router.get('/my-applications', authMiddleware, rbacMiddleware(['job_seeker']), async (req, res) => {
  try {
    const applications = await Application.find({ applicant: req.user.userId })
      .populate('job')
      .populate('company', 'name logo')
      .sort({ appliedAt: -1 });

    res.status(200).json({ success: true, applications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get application by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('job')
      .populate('applicant')
      .populate('company')
      .populate({
        path: 'interviews',
        populate: { path: 'interviewer', select: 'firstName lastName email' }
      });

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    res.status(200).json({ success: true, application });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update application status
router.put('/:id/status', authMiddleware, rbacMiddleware(['hr_manager', 'company_owner']), async (req, res) => {
  try {
    const { status, stage, feedback, notes } = req.body;

    const application = await Application.findByIdAndUpdate(
      req.params.id,
      { $set: { status, stage, feedback, notes, updatedAt: new Date() } },
      { new: true }
    ).populate('applicant');

    // Create notification
    await Notification.create({
      recipient: application.applicant._id,
      type: 'application_status',
      title: 'Application Status Updated',
      message: `Your application status has been updated to ${status}`,
      data: { applicationId: application._id }
    });

    res.status(200).json({ success: true, application });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Shortlist application
router.put('/:id/shortlist', authMiddleware, rbacMiddleware(['hr_manager', 'company_owner']), async (req, res) => {
  try {
    const application = await Application.findByIdAndUpdate(
      req.params.id,
      { $set: { status: 'shortlisted', shortlistedAt: new Date(), updatedAt: new Date() } },
      { new: true }
    ).populate('applicant');

    await Notification.create({
      recipient: application.applicant._id,
      type: 'application_status',
      title: 'Congratulations!',
      message: 'You have been shortlisted for the position',
      data: { applicationId: application._id }
    });

    res.status(200).json({ success: true, application });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Reject application
router.put('/:id/reject', authMiddleware, rbacMiddleware(['hr_manager', 'company_owner']), async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    const application = await Application.findByIdAndUpdate(
      req.params.id,
      { $set: { status: 'rejected', rejectedAt: new Date(), rejectionReason, updatedAt: new Date() } },
      { new: true }
    ).populate('applicant');

    await Notification.create({
      recipient: application.applicant._id,
      type: 'application_status',
      title: 'Application Status',
      message: 'Your application has been rejected',
      data: { applicationId: application._id }
    });

    res.status(200).json({ success: true, application });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
