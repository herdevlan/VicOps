// backend/src/services/userService.js
const BaseService = require('./baseService');
const userRepository = require('../repositories/userRepository');
const bcrypt = require('bcrypt');
const { NotFoundError, ValidationError } = require('../utils/errors');
const logger = require('../utils/logger');

class UserService extends BaseService {
  constructor() {
    super(userRepository);
  }

  async getAllUsers() {
    return await userRepository.findAllWithRole();
  }

  async getUserById(id) {
    const user = await userRepository.findWithRole(id);
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

  async createUser(userData) {
    logger.info(`Creando usuario: ${userData.email}`);
    
    // Validar email único
    await userRepository.validateEmailUnique(userData.email);
    
    // Validar CI único
    if (userData.ci) {
      await userRepository.validateCIUnique(userData.ci);
    }
    
    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const user = await userRepository.create({
      ...userData,
      password: hashedPassword
    });
    
    logger.info(`Usuario creado: ${user.email} (ID: ${user.id})`);
    
    // Retornar sin contraseña
    const userJSON = user.toJSON();
    const { password, ...userWithoutPassword } = userJSON;
    return userWithoutPassword;
  }

  async updateUser(id, userData) {
    logger.info(`Actualizando usuario ID: ${id}`);
    
    const user = await userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('Usuario');
    }
    
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
      userData.password = await bcrypt.hash(userData.password, 10);
    }
    
    const updatedUser = await userRepository.update(id, userData);
    
    if (!updatedUser) {
      throw new NotFoundError('Usuario');
    }
    
    logger.info(`Usuario actualizado: ${updatedUser.email} (ID: ${id})`);
    
    const userJSON = updatedUser.toJSON();
    const { password, ...userWithoutPassword } = userJSON;
    return userWithoutPassword;
  }

  async deleteUser(id) {
    logger.info(`Eliminando usuario ID: ${id}`);
    
    const user = await userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('Usuario');
    }
    
    await userRepository.delete(id);
    logger.info(`Usuario eliminado: ${user.email} (ID: ${id})`);
    
    return true;
  }

  async changeUserStatus(id, estado) {
    logger.info(`Cambiando estado usuario ID: ${id} a ${estado}`);
    
    const user = await userRepository.update(id, { estado });
    if (!user) {
      throw new NotFoundError('Usuario');
    }
    
    return user;
  }

  async getUsersByRole(roleId) {
    return await userRepository.findByRole(roleId);
  }

  async getActiveUsers() {
    return await userRepository.getActiveUsers();
  }
}

module.exports = new UserService();