const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  action: String,
  entity: String,
  entityId: mongoose.Schema.Types.ObjectId,
  changes: mongoose.Schema.Types.Mixed,
  ipAddress: String,
  userAgent: String,
  status: {
    type: String,
    enum: ['success', 'failure'],
    default: 'success'
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 7776000
  }
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
