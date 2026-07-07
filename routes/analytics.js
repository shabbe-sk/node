const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Company = require('../models/Company');
const Job = require('../models/Job');
const Application = require('../models/Application');
const authMiddleware = require('../middleware/auth');
const rbacMiddleware = require('../middleware/rbac');

// Admin analytics dashboard
router.get('/admin/dashboard', authMiddleware, rbacMiddleware(['admin']), async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalCompanies = await Company.countDocuments();
    const totalJobs = await Job.countDocuments();
    const totalApplications = await Application.countDocuments();

    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const usersGrowth = await User.countDocuments({ createdAt: { $gte: last30Days } });
    const companiesGrowth = await Company.countDocuments({ createdAt: { $gte: last30Days } });

    const jobSeekers = await User.countDocuments({ role: 'job_seeker' });
    const hrManagers = await User.countDocuments({ role: 'hr_manager' });
    const companyOwners = await User.countDocuments({ role: 'company_owner' });

    const approvedCompanies = await Company.countDocuments({ approvalStatus: 'approved' });
    const pendingCompanies = await Company.countDocuments({ approvalStatus: 'pending' });

    res.status(200).json({
      success: true,
      analytics: {
        totalUsers,
        totalCompanies,
        totalJobs,
        totalApplications,
        monthlyUserGrowth: usersGrowth,
        monthlyCompanyGrowth: companiesGrowth,
        userBreakdown: {
          jobSeekers,
          hrManagers,
          companyOwners
        },
        companyStatus: {
          approved: approvedCompanies,
          pending: pendingCompanies
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Company analytics
router.get('/company/:companyId', authMiddleware, rbacMiddleware(['company_owner', 'hr_manager']), async (req, res) => {
  try {
    const company = await Company.findById(req.params.companyId);

    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    const jobs = await Job.find({ company: req.params.companyId });
    const jobIds = jobs.map(j => j._id);
    
    const applications = await Application.find({ job: { $in: jobIds } });
    const hired = applications.filter(a => a.status === 'hired').length;
    const rejected = applications.filter(a => a.status === 'rejected').length;
    const shortlisted = applications.filter(a => a.status === 'shortlisted').length;

    const totalViews = jobs.reduce((sum, job) => sum + job.viewCount, 0);
    const totalSaved = jobs.reduce((sum, job) => sum + job.savedCount, 0);

    res.status(200).json({
      success: true,
      analytics: {
        totalJobs: jobs.length,
        totalApplications: applications.length,
        hired,
        rejected,
        shortlisted,
        totalJobViews: totalViews,
        totalJobSaves: totalSaved,
        avgApplicationsPerJob: jobs.length > 0 ? Math.round(applications.length / jobs.length) : 0,
        conversionRate: applications.length > 0 ? ((hired / applications.length) * 100).toFixed(2) : 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// User analytics (job seeker)
router.get('/user/profile', authMiddleware, rbacMiddleware(['job_seeker']), async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    const applications = await Application.find({ applicant: req.user.userId });

    const applicationStats = {
      total: applications.length,
      viewed: applications.filter(a => a.status !== 'submitted').length,
      shortlisted: applications.filter(a => a.status === 'shortlisted').length,
      rejected: applications.filter(a => a.status === 'rejected').length,
      offered: applications.filter(a => a.status === 'offered').length,
      hired: applications.filter(a => a.status === 'hired').length
    };

    res.status(200).json({
      success: true,
      analytics: {
        profileCompletion: calculateProfileCompletion(user),
        applicationStats,
        savedJobsCount: user.savedJobs.length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Job analytics
router.get('/job/:jobId', authMiddleware, async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId)
      .populate('applications');

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    const applications = job.applications || [];
    const shortlisted = applications.filter(a => a.status === 'shortlisted').length;
    const rejected = applications.filter(a => a.status === 'rejected').length;
    const hired = applications.filter(a => a.status === 'hired').length;

    res.status(200).json({
      success: true,
      analytics: {
        totalViews: job.viewCount,
        totalSaves: job.savedCount,
        totalApplications: job.applicantCount,
        shortlisted,
        rejected,
        hired,
        conversionRate: job.applicantCount > 0 ? ((shortlisted / job.applicantCount) * 100).toFixed(2) : 0,
        daysSincePosted: Math.floor((Date.now() - job.createdAt) / (1000 * 60 * 60 * 24))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Application funnel analytics
router.get('/funnel/:companyId', authMiddleware, rbacMiddleware(['company_owner', 'hr_manager']), async (req, res) => {
  try {
    const jobs = await Job.find({ company: req.params.companyId });
    const jobIds = jobs.map(j => j._id);
    
    const applications = await Application.find({ job: { $in: jobIds } });

    const funnel = {
      submitted: applications.filter(a => a.status === 'submitted').length,
      viewed: applications.filter(a => a.status === 'viewed').length,
      shortlisted: applications.filter(a => a.status === 'shortlisted').length,
      interview: applications.filter(a => a.status === 'interview_scheduled').length,
      offered: applications.filter(a => a.status === 'offered').length,
      hired: applications.filter(a => a.status === 'hired').length
    };

    res.status(200).json({
      success: true,
      funnel
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Helper function to calculate profile completion
const calculateProfileCompletion = (user) => {
  let completed = 0;
  const fields = [
    'firstName', 'lastName', 'email', 'phone',
    'profile.headline', 'profile.bio', 'profile.location',
    'profile.skills', 'profile.resume_url'
  ];

  fields.forEach(field => {
    const value = field.split('.').reduce((obj, key) => obj?.[key], user);
    if (value && (typeof value === 'string' || (Array.isArray(value) && value.length > 0))) {
      completed++;
    }
  });

  return Math.round((completed / fields.length) * 100);
};

module.exports = router;
