// backend/src/services/userService.js
const BaseService = require('./baseService');
const userRepository = require('../repositories/userRepository');
const auditRepository = require('../repositories/auditRepository');
const bcrypt = require('bcrypt');
const { NotFoundError, ValidationError, AuthorizationError } = require('../utils/errors');
const logger = require('../utils/logger');
const config = require('../config/app_config');

class UserService extends BaseService {
  constructor() {
    super(userRepository);
  }

  async getAllUsers() {
    return await userRepository.findAllWithRole();
  }

  async getUserById(id) {
    const user = await userRepository.findWithProfile(id);
    if (!user) {
      throw new NotFoundError('Usuario');
    }
    return user;
  }

  async getUserByEmail(email) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new NotFoundError('Usuario');
    }
    return user;
  }

  async createUser(userData, ipAddress, userAgent, requestingUserId) {
    logger.info(`Creando usuario: ${userData.email}`);
    
    // Validar email único
    await userRepository.validateEmailUnique(userData.email);
    
    // Validar CI único
    if (userData.ci) {
      await userRepository.validateCIUnique(userData.ci);
    }
    
    // Validar que el rol existe
    const { Role } = require('../models');
    const role = await Role.findByPk(userData.role_id);
    if (!role) {
      throw new ValidationError('Rol no válido');
    }
    
    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(userData.password, config.bcryptRounds);
    
    const user = await userRepository.create({
      ...userData,
      password: hashedPassword
    });
    
    // Registrar auditoría
    await auditRepository.log(
      requestingUserId,
      null,
      'create',
      'user',
      user.id,
      null,
      { email: user.email, nombre: user.nombre, role_id: user.role_id },
      ipAddress,
      userAgent,
      201,
      null
    );
    
    logger.info(`Usuario creado: ${user.email} (ID: ${user.id}) por usuario ${requestingUserId}`);
    
    // Retornar sin contraseña
    const { password, ...userWithoutPassword } = user.toJSON();
    return userWithoutPassword;
  }

  async updateUser(id, userData, ipAddress, userAgent, requestingUserId) {
    logger.info(`Actualizando usuario ID: ${id}`);
    
    const user = await userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('Usuario');
    }
    
    // Guardar datos antiguos para auditoría
    const oldData = { ...user.toJSON() };
    delete oldData.password;
    
    // Validar email único excluyendo el actual
    if (userData.email && userData.email !== user.email) {
      await userRepository.validateEmailUnique(userData.email, id);
    }
    
    // Validar CI único excluyendo el actual
    if (userData.ci && userData.ci !== user.ci) {
      await userRepository.validateCIUnique(userData.ci, id);
    }
    
    // Si se actualiza contraseña, hashearla
    if (userData.password) {
      userData.password = await bcrypt.hash(userData.password, config.bcryptRounds);
    }
    
    const updatedUser = await userRepository.update(id, userData);
    
    // Registrar auditoría
    const newData = { ...updatedUser.toJSON() };
    delete newData.password;
    
    await auditRepository.log(
      requestingUserId,
      null,
      'update',
      'user',
      id,
      oldData,
      newData,
      ipAddress,
      userAgent,
      200,
      null
    );
    
    logger.info(`Usuario actualizado: ${updatedUser.email} (ID: ${id}) por usuario ${requestingUserId}`);
    
    const { password, ...userWithoutPassword } = updatedUser.toJSON();
    return userWithoutPassword;
  }

  async deleteUser(id, ipAddress, userAgent, requestingUserId) {
    logger.info(`Eliminando usuario ID: ${id}`);
    
    const user = await userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('Usuario');
    }
    
    // No permitir eliminar el propio usuario
    if (parseInt(id) === requestingUserId) {
      throw new AuthorizationError('No puede eliminar su propio usuario');
    }
    
    // Guardar datos para auditoría
    const userData = { ...user.toJSON() };
    delete userData.password;
    
    await userRepository.delete(id);
    
    // Registrar auditoría
    await auditRepository.log(
      requestingUserId,
      null,
      'delete',
      'user',
      id,
      userData,
      null,
      ipAddress,
      userAgent,
      200,
      null
    );
    
    logger.info(`Usuario eliminado: ${user.email} (ID: ${id}) por usuario ${requestingUserId}`);
    
    return true;
  }

  async changeUserStatus(id, estado, ipAddress, userAgent, requestingUserId) {
    logger.info(`Cambiando estado usuario ID: ${id} a ${estado}`);
    
    const user = await userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('Usuario');
    }
    
    // No permitir desactivar el propio usuario
    if (parseInt(id) === requestingUserId && estado === false) {
      throw new AuthorizationError('No puede desactivar su propio usuario');
    }
    
    const updatedUser = await userRepository.update(id, { estado });
    
    // Registrar auditoría
    await auditRepository.log(
      requestingUserId,
      null,
      'change_status',
      'user',
      id,
      { estado_anterior: user.estado },
      { estado_nuevo: estado },
      ipAddress,
      userAgent,
      200,
      null
    );
    
    logger.info(`Usuario ${estado ? 'activado' : 'desactivado'}: ${user.email} (ID: ${id})`);
    
    return updatedUser;
  }

  async changePassword(userId, currentPassword, newPassword, ipAddress, userAgent) {
    logger.info(`Cambio de contraseña para usuario ID: ${userId}`);
    
    const user = await userRepository.findById(userId, true);
    if (!user) {
      throw new NotFoundError('Usuario');
    }
    
    // Verificar contraseña actual
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      throw new ValidationError('Contraseña actual incorrecta');
    }
    
    // Validar nueva contraseña
    if (newPassword.length < 6) {
      throw new ValidationError('La nueva contraseña debe tener al menos 6 caracteres');
    }
    
    // Hashear nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, config.bcryptRounds);
    
    await userRepository.updatePassword(userId, hashedPassword);
    
    // Revocar todos los refresh tokens por seguridad
    const refreshTokenRepository = require('../repositories/refreshTokenRepository');
    await refreshTokenRepository.revokeAllUserTokens(userId);
    
    // Registrar auditoría
    await auditRepository.log(
      userId,
      user.email,
      'change_password',
      'user',
      userId,
      null,
      { cambio_realizado: true },
      ipAddress,
      userAgent,
      200,
      null
    );
    
    logger.info(`Contraseña actualizada para usuario ${user.email}`);
    
    return true;
  }

  async resetPassword(userId, newPassword, ipAddress, userAgent, requestingUserId) {
    logger.info(`Reset de contraseña para usuario ID: ${userId} por admin ${requestingUserId}`);
    
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('Usuario');
    }
    
    // Validar nueva contraseña
    if (newPassword.length < 6) {
      throw new ValidationError('La nueva contraseña debe tener al menos 6 caracteres');
    }
    
    // Hashear nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, config.bcryptRounds);
    
    await userRepository.updatePassword(userId, hashedPassword);
    
    // Revocar todos los refresh tokens por seguridad
    const refreshTokenRepository = require('../repositories/refreshTokenRepository');
    await refreshTokenRepository.revokeAllUserTokens(userId);
    
    // Registrar auditoría
    await auditRepository.log(
      requestingUserId,
      null,
      'reset_password',
      'user',
      userId,
      null,
      { usuario_afectado: user.email },
      ipAddress,
      userAgent,
      200,
      null
    );
    
    logger.info(`Contraseña reseteada para usuario ${user.email} por admin ${requestingUserId}`);
    
    return true;
  }

  async getUsersByRole(roleId) {
    return await userRepository.getUsersByRoleWithProfile(roleId);
  }

  async getActiveUsers() {
    return await userRepository.getActiveUsers();
  }

  async getRecentlyActiveUsers(limit = 10) {
    return await userRepository.findRecentlyActive(limit);
  }

  async getStatistics() {
    const { Role } = require('../models');
    
    const roles = await Role.findAll();
    const stats = [];
    
    for (const role of roles) {
      const count = await userRepository.countByRole(role.id);
      stats.push({
        role: role.nombre,
        count
      });
    }
    
    const totalUsers = stats.reduce((acc, curr) => acc + curr.count, 0);
    const activeUsers = (await userRepository.getActiveUsers()).length;
    
    return {
      total: totalUsers,
      active: activeUsers,
      inactive: totalUsers - activeUsers,
      by_role: stats
    };
  }

  async getAuditLogs(userId = null, limit = 50) {
    if (userId) {
      return await auditRepository.getByUser(userId, limit);
    }
    return await auditRepository.findAll({
      order: [['created_at', 'DESC']],
      limit
    });
  }
}

module.exports = new UserService();