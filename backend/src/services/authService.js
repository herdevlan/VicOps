// backend/src/services/authService.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');
const { AuthenticationError } = require('../utils/errors');
const config = require('../config/app_config');
const logger = require('../utils/logger');

class AuthService {
  async hashPassword(password) {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  }

  async comparePassword(password, hash) {
    if (!hash) return false;
    return await bcrypt.compare(password, hash);
  }

  generateToken(user) {
    const payload = {
      id: user.id,
      email: user.email,
      role_id: user.role_id,
      role_name: user.role?.nombre
    };
    return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, config.jwtSecret);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new AuthenticationError('Token expirado');
      }
      throw new AuthenticationError('Token inválido');
    }
  }

  async login(email, password) {
    logger.info(`Intento de login para: ${email}`);
    
    const user = await userRepository.findByEmail(email, true);

    if (!user) {
      logger.warn(`Login fallido: usuario no encontrado - ${email}`);
      throw new AuthenticationError('Credenciales incorrectas');
    }

    if (!user.estado) {
      logger.warn(`Login fallido: usuario inactivo - ${email}`);
      throw new AuthenticationError('Usuario inactivo. Contacte al administrador');
    }

    const isValidPassword = await this.comparePassword(password, user.password);
    if (!isValidPassword) {
      logger.warn(`Login fallido: contraseña incorrecta - ${email}`);
      throw new AuthenticationError('Credenciales incorrectas');
    }

    await userRepository.updateLastLogin(user.id);

    const userWithRole = await userRepository.findWithRole(user.id);
    const token = this.generateToken(userWithRole);

    logger.info(`Login exitoso: ${email} (${userWithRole.role?.nombre})`);

    return {
      token,
      user: {
        id: userWithRole.id,
        email: userWithRole.email,
        nombre: userWithRole.nombre,
        apellido: userWithRole.apellido,
        ci: userWithRole.ci,
        role: userWithRole.role
      }
    };
  }

  async register(userData, profileData, profileType) {
    logger.info(`Registro de nuevo usuario: ${userData.email} (${profileType})`);

    await userRepository.validateEmailUnique(userData.email);

    if (userData.ci) {
      await userRepository.validateCIUnique(userData.ci);
    }

    const hashedPassword = await this.hashPassword(userData.password);

    const result = await userRepository.createWithProfile(
      { ...userData, password: hashedPassword },
      profileData,
      profileType
    );

    const userWithRole = await userRepository.findWithRole(result.user.id);
    const token = this.generateToken(userWithRole);

    logger.info(`Registro exitoso: ${userData.email} (ID: ${result.user.id})`);

    return {
      token,
      user: {
        id: userWithRole.id,
        email: userWithRole.email,
        nombre: userWithRole.nombre,
        apellido: userWithRole.apellido,
        role: userWithRole.role
      }
    };
  }

  ///api/auth/me
  async getUserById(id) {
    const user = await userRepository.findWithRole(id);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }
    return user;
  }
}

module.exports = new AuthService();