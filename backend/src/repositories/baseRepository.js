// backend/src/repositories/baseRepository.js
const { sequelize } = require('../models');

class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  async findAll(options = {}) {
    return await this.model.findAll(options);
  }

  async findById(id, options = {}) {
    return await this.model.findByPk(id, options);
  }

  async findOne(where, options = {}) {
    return await this.model.findOne({ where, ...options });
  }

  async create(data, options = {}) {
    return await this.model.create(data, options);
  }

  async update(id, data, options = {}) {
    const instance = await this.findById(id);
    if (!instance) return null;
    return await instance.update(data, options);
  }

  async delete(id, options = {}) {
    const instance = await this.findById(id);
    if (!instance) return null;
    await instance.destroy(options);
    return true;
  }

  async count(where = {}) {
    return await this.model.count({ where });
  }

  async transaction(callback) {
    const transaction = await sequelize.transaction();
    try {
      const result = await callback(transaction);
      await transaction.commit();
      return result;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

module.exports = BaseRepository;
