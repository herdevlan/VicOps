// backend/src/repositories/auditRepository.js
const BaseRepository = require('./baseRepository');
const { AuditLog } = require('../models');

class AuditRepository extends BaseRepository {
  constructor() {
    super(AuditLog);
  }

  async log(userId, email, action, resource, resourceId, oldData, newData, ipAddress, userAgent, statusCode, duration) {
    return await AuditLog.create({
      user_id: userId,
      email,
      action,
      resource,
      resource_id: resourceId,
      old_data: oldData,
      new_data: newData,
      ip_address: ipAddress,
      user_agent: userAgent,
      status_code: statusCode,
      duration
    });
  }

  async getByUser(userId, limit = 50) {
    return await AuditLog.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
      limit
    });
  }

  async getByAction(action, limit = 50) {
    return await AuditLog.findAll({
      where: { action },
      order: [['created_at', 'DESC']],
      limit
    });
  }

  async getByResource(resource, resourceId = null, limit = 50) {
    const where = { resource };
    if (resourceId) {
      where.resource_id = resourceId;
    }
    
    return await AuditLog.findAll({
      where,
      order: [['created_at', 'DESC']],
      limit
    });
  }

  async getByDateRange(startDate, endDate) {
    const { Op } = require('sequelize');
    return await AuditLog.findAll({
      where: {
        created_at: {
          [Op.between]: [startDate, endDate]
        }
      },
      order: [['created_at', 'DESC']]
    });
  }
}

module.exports = new AuditRepository();