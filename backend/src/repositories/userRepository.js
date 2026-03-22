// backend/src/repositories/userRepository.js
const { User, Role } = require('../models');
const { Op } = require('sequelize');
const BaseRepository = require('./baseRepository');

class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  /**
   * Buscar usuario por email
   * @param {string} email 
   * @param {boolean} includePassword 
   */
  async findByEmail(email, includePassword = false) {
    if (includePassword) {
      return await User.scope('withPassword').findOne({ where: { email } });
    }
    return await User.findOne({ where: { email } });
  }

  /**
   * Buscar usuario por ID con su rol
   * @param {number} id 
   */
  async findWithRole(id) {
    return await User.findByPk(id, {
      include: [{ model: Role, as: 'role' }],
      attributes: { exclude: ['password'] }
    });
  }

  /**
   * Obtener todos los usuarios con su rol
   */
  async findAllWithRole() {
    return await User.findAll({
      include: [{ model: Role, as: 'role' }],
      attributes: { exclude: ['password'] },
      order: [['created_at', 'DESC']]
    });
  }

  /**
   * Obtener usuarios por rol
   * @param {number} roleId 
   */
  async findByRole(roleId) {
    return await User.findAll({
      where: { role_id: roleId },
      include: [{ model: Role, as: 'role' }],
      attributes: { exclude: ['password'] },
      order: [['created_at', 'DESC']]
    });
  }

  /**
   * Obtener usuarios activos
   */
  async getActiveUsers() {
    return await User.findAll({
      where: { estado: true },
      include: [{ model: Role, as: 'role' }],
      attributes: { exclude: ['password'] },
      order: [['created_at', 'DESC']]
    });
  }

  /**
   * Validar email único
   * @param {string} email 
   * @param {number} excludeId - ID a excluir para actualizaciones
   */
  async validateEmailUnique(email, excludeId = null) {
    const where = { email };
    if (excludeId) {
      where.id = { [Op.ne]: excludeId };
    }
    const existing = await User.findOne({ where });
    if (existing) {
      throw new Error('El email ya está registrado');
    }
  }

  /**
   * Validar CI único
   * @param {string} ci 
   * @param {number} excludeId - ID a excluir para actualizaciones
   */
  async validateCIUnique(ci, excludeId = null) {
    if (!ci) return;
    
    const where = { ci };
    if (excludeId) {
      where.id = { [Op.ne]: excludeId };
    }
    const existing = await User.findOne({ where });
    if (existing) {
      throw new Error('El CI ya está registrado');
    }
  }

  /**
   * Crear usuario con perfil (student o teacher)
   * @param {object} userData 
   * @param {object} profileData 
   * @param {string} profileType 
   */
  async createWithProfile(userData, profileData = {}, profileType = 'student') {
    const transaction = await User.sequelize.transaction();
    try {
      const user = await User.create(userData, { transaction });

      if (profileType === 'student') {
        await user.createStudent(profileData, { transaction });
      } else if (profileType === 'teacher') {
        await user.createTeacher(profileData, { transaction });
      }

      await transaction.commit();
      return { user };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Actualizar último login
   * @param {number} userId 
   */
  async updateLastLogin(userId) {
    return await User.update(
      { last_login: new Date() },
      { where: { id: userId } }
    );
  }

  /**
   * Obtener usuario por ID (sobrescribe método de BaseRepository)
   * @param {number} id 
   */
  async findById(id) {
    return await User.findByPk(id, {
      include: [{ model: Role, as: 'role' }],
      attributes: { exclude: ['password'] }
    });
  }

  /**
   * Crear usuario (sobrescribe método de BaseRepository)
   * @param {object} data 
   */
  async create(data) {
    return await User.create(data);
  }

  /**
   * Actualizar usuario (sobrescribe método de BaseRepository)
   * @param {number} id 
   * @param {object} data 
   */
  async update(id, data) {
    const user = await this.findById(id);
    if (!user) return null;
    return await user.update(data);
  }

  /**
   * Eliminar usuario (sobrescribe método de BaseRepository)
   * @param {number} id 
   */
  async delete(id) {
    const user = await this.findById(id);
    if (!user) return null;
    await user.destroy();
    return true;
  }
}

module.exports = new UserRepository();