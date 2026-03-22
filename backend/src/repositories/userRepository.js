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
   * Obtener usuario por ID (con opción de incluir contraseña)
   * @param {number} id 
   * @param {boolean} includePassword 
   */
  async findById(id, includePassword = false) {
    // Si se necesita la contraseña, usar scope 'withPassword'
    if (includePassword) {
      const user = await User.scope('withPassword').findByPk(id, {
        include: [{ model: Role, as: 'role' }]
      });
      return user;
    }
    
    // Si no, excluir contraseña
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


  /**
   * Actualizar contraseña del usuario
   * @param {number} userId 
   * @param {string} newPasswordHash 
   */
  async updatePassword(userId, newPasswordHash) {
    return await User.update(
      { password: newPasswordHash },
      { where: { id: userId } }
    );
  }

  /**
   * Buscar usuario con su perfil según rol
   * @param {number} id 
   */
  async findWithProfile(id) {
    const user = await this.findWithRole(id);
    if (!user) return null;
    
    // Buscar perfil según rol
    const { Student, Teacher } = require('../models');
    
    if (user.role?.nombre === 'Estudiante') {
      const student = await Student.findOne({ where: { user_id: user.id } });
      return { ...user.toJSON(), profile: student };
    } else if (user.role?.nombre === 'Docente') {
      const teacher = await Teacher.findOne({ where: { user_id: user.id } });
      return { ...user.toJSON(), profile: teacher };
    }
    
    return user;
  }

  /**
   * Obtener usuarios por rol con su perfil
   * @param {number} roleId 
   */
  async getUsersByRoleWithProfile(roleId) {
    const users = await this.findByRole(roleId);
    const { Student, Teacher } = require('../models');
    
    const usersWithProfile = [];
    for (const user of users) {
      let profile = null;
      if (user.role?.nombre === 'Estudiante') {
        profile = await Student.findOne({ where: { user_id: user.id } });
      } else if (user.role?.nombre === 'Docente') {
        profile = await Teacher.findOne({ where: { user_id: user.id } });
      }
      usersWithProfile.push({ ...user.toJSON(), profile });
    }
    
    return usersWithProfile;
  }

  /**
   * Contar usuarios por rol
   * @param {number} roleId 
   */
  async countByRole(roleId) {
    return await this.model.count({ where: { role_id: roleId } });
  }

  /**
   * Obtener usuarios activos recientes
   * @param {number} limit 
   */
  async findRecentlyActive(limit = 10) {
    return await this.model.findAll({
      where: { 
        estado: true,
        last_login: { [Op.ne]: null }
      },
      order: [['last_login', 'DESC']],
      limit,
      include: [{ model: require('../models').Role, as: 'role' }],
      attributes: { exclude: ['password'] }
    });
  }
}

module.exports = new UserRepository();
