// backend/src/services/baseService.js
class BaseService {
  constructor(repository) {
    this.repository = repository;
  }

  async getAll() {
    return await this.repository.findAll();
  }

  async getById(id) {
    return await this.repository.findById(id);
  }

  async create(data) {
    return await this.repository.create(data);
  }

  async update(id, data) {
    return await this.repository.update(id, data);
  }

  async delete(id) {
    return await this.repository.delete(id);
  }

  // Método para manejar errores comunes
  handleError(error, context) {
    const { ValidationError, NotFoundError } = require('../utils/errors');
    
    if (error.name === 'SequelizeValidationError') {
      throw new ValidationError('Error de validación', error.errors);
    }
    if (error.name === 'SequelizeUniqueConstraintError') {
      throw new ValidationError('El registro ya existe', error.errors);
    }
    throw error;
  }
}

module.exports = BaseService;