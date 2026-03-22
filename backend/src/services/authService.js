// backend/src/services/authService.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const userRepository = require('../repositories/userRepository');
const refreshTokenRepository = require('../repositories/refreshTokenRepository');
const { AuthenticationError } = require('../utils/errors');
const config = require('../config/app_config');
const logger = require('../utils/logger');

class AuthService {
  async hashPassword(password) {
    const saltRounds = config.bcryptRounds;
    return await bcrypt.hash(password, saltRounds);
  }

  async comparePassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  generateAccessToken(user) {
    const payload = {
      id: user.id,
      email: user.email,
      role_id: user.role_id,
      role_name: user.role?.nombre,
      type: 'access'
    };
    
    return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
  }

  generateRefreshToken(userId, userAgent, ipAddress) {
    const payload = {
      id: userId,
      type: 'refresh',
      jti: crypto.randomBytes(32).toString('hex')
    };
    
    const token = jwt.sign(payload, config.jwtRefreshSecret, { expiresIn: config.jwtRefreshExpiresIn });
    
    // Calcular fecha de expiración
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 días
    
    return { token, expiresAt };
  }

  verifyAccessToken(token) {
    try {
      const decoded = jwt.verify(token, config.jwtSecret);
      if (decoded.type !== 'access') {
        throw new AuthenticationError('Tipo de token inválido');
      }
      return decoded;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new AuthenticationError('Token de acceso expirado');
      }
      throw new AuthenticationError('Token de acceso inválido');
    }
  }

  verifyRefreshToken(token) {
    try {
      const decoded = jwt.verify(token, config.jwtRefreshSecret);
      if (decoded.type !== 'refresh') {
        throw new AuthenticationError('Tipo de token inválido');
      }
      return decoded;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new AuthenticationError('Token de refresco expirado');
      }
      throw new AuthenticationError('Token de refresco inválido');
    }
  }

  async login(email, password, userAgent, ipAddress) {
    logger.info(`Intento de login para: ${email} desde ${ipAddress}`);
    
    // Buscar usuario con contraseña y rol
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

    // Actualizar último login
    await userRepository.updateLastLogin(user.id);

    // Obtener usuario con rol para el token
    const userWithRole = await userRepository.findWithRole(user.id);
    
    // Generar tokens
    const accessToken = this.generateAccessToken(userWithRole);
    const { token: refreshToken, expiresAt } = this.generateRefreshToken(
      userWithRole.id,
      userAgent,
      ipAddress
    );
    
    // Guardar refresh token en base de datos
    await refreshTokenRepository.createToken(
      userWithRole.id,
      refreshToken,
      expiresAt,
      userAgent,
      ipAddress
    );
    
    // Eliminar tokens expirados periódicamente
    await refreshTokenRepository.deleteExpiredTokens();
    
    logger.info(`Login exitoso: ${email} (${userWithRole.role?.nombre}) desde ${ipAddress}`);
    
    return {
      accessToken,
      refreshToken,
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

  async refreshAccessToken(refreshToken, userAgent, ipAddress) {
    logger.info(`Intento de refresco de token desde ${ipAddress}`);
    
    // Verificar token
    const decoded = this.verifyRefreshToken(refreshToken);
    
    // Buscar token en base de datos
    const storedToken = await refreshTokenRepository.findByToken(refreshToken);
    
    if (!storedToken) {
      logger.warn(`Refresh token no encontrado en BD`);
      throw new AuthenticationError('Token de refresco inválido');
    }
    
    if (storedToken.revoked) {
      logger.warn(`Refresh token revocado para usuario ${storedToken.user_id}`);
      throw new AuthenticationError('Token de refresco revocado');
    }
    
    if (new Date() > storedToken.expires_at) {
      logger.warn(`Refresh token expirado para usuario ${storedToken.user_id}`);
      await refreshTokenRepository.revokeToken(refreshToken);
      throw new AuthenticationError('Token de refresco expirado');
    }
    
    // Verificar que el usuario aún existe y está activo
    const user = await userRepository.findWithRole(storedToken.user_id);
    if (!user || !user.estado) {
      logger.warn(`Usuario ${storedToken.user_id} no existe o está inactivo`);
      throw new AuthenticationError('Usuario no válido');
    }
    
    // Generar nuevo access token
    const newAccessToken = this.generateAccessToken(user);
    
    // Opcional: rotar refresh token (generar nuevo)
    // Revocar el actual
    await refreshTokenRepository.revokeToken(refreshToken);
    
    // Generar nuevo refresh token
    const { token: newRefreshToken, expiresAt } = this.generateRefreshToken(
      user.id,
      userAgent,
      ipAddress
    );
    
    // Guardar nuevo refresh token
    await refreshTokenRepository.createToken(
      user.id,
      newRefreshToken,
      expiresAt,
      userAgent,
      ipAddress
    );
    
    logger.info(`Refresh token exitoso para usuario ${user.email}`);
    
    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    };
  }

  async logout(refreshToken) {
    if (refreshToken) {
      await refreshTokenRepository.revokeToken(refreshToken);
      logger.info(`Logout: refresh token revocado`);
    }
    return true;
  }

  async logoutAll(userId) {
    await refreshTokenRepository.revokeAllUserTokens(userId);
    logger.info(`Logout all: todos los tokens revocados para usuario ${userId}`);
    return true;
  }

  async register(userData, profileData, profileType) {
    logger.info(`Registro de nuevo usuario: ${userData.email} (${profileType})`);
    
    // Validar email único
    await userRepository.validateEmailUnique(userData.email);
    
    // Validar CI único si se proporciona
    if (userData.ci) {
      await userRepository.validateCIUnique(userData.ci);
    }
    
    // Hashear contraseña
    const hashedPassword = await this.hashPassword(userData.password);
    
    // Crear usuario con perfil
    const result = await userRepository.createWithProfile(
      { ...userData, password: hashedPassword },
      profileData,
      profileType
    );
    
    // Obtener usuario con rol para el token
    const userWithRole = await userRepository.findWithRole(result.user.id);
    
    const accessToken = this.generateAccessToken(userWithRole);
    const { token: refreshToken, expiresAt } = this.generateRefreshToken(
      userWithRole.id,
      null,
      null
    );
    
    // Guardar refresh token
    await refreshTokenRepository.createToken(
      userWithRole.id,
      refreshToken,
      expiresAt,
      null,
      null
    );
    
    logger.info(`Registro exitoso: ${userData.email} (ID: ${result.user.id})`);
    
    return {
      accessToken,
      refreshToken,
      user: {
        id: userWithRole.id,
        email: userWithRole.email,
        nombre: userWithRole.nombre,
        apellido: userWithRole.apellido,
        role: userWithRole.role
      }
    };
  }

  async getUserById(id) {
    return await userRepository.findWithRole(id);
  }
}

module.exports = new AuthService();