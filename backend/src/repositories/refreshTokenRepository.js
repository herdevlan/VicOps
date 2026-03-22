// backend/src/repositories/refreshTokenRepository.js
const BaseRepository = require('./baseRepository');
const { RefreshToken } = require('../models');
const { Op } = require('sequelize');

class RefreshTokenRepository extends BaseRepository {
  constructor() {
    super(RefreshToken);
  }

  async findByToken(token) {
    return await RefreshToken.findOne({
      where: { token, revoked: false },
      include: ['user']
    });
  }

  async findByUser(userId) {
    return await RefreshToken.findAll({
      where: { user_id: userId, revoked: false },
      order: [['created_at', 'DESC']]
    });
  }

  async revokeToken(token) {
    return await RefreshToken.update(
      { revoked: true, revoked_at: new Date() },
      { where: { token } }
    );
  }

  async revokeAllUserTokens(userId) {
    return await RefreshToken.update(
      { revoked: true, revoked_at: new Date() },
      { where: { user_id: userId, revoked: false } }
    );
  }

  async deleteExpiredTokens() {
    return await RefreshToken.destroy({
      where: {
        expires_at: { [Op.lt]: new Date() }
      }
    });
  }

  async createToken(userId, token, expiresAt, userAgent, ipAddress) {
    try {
      console.log('📝 Creando refresh token con:', {
        userId,
        token: token.substring(0, 50) + '...',
        expiresAt,
        userAgent,
        ipAddress
      });
      
      const refreshToken = await RefreshToken.create({
        user_id: userId,
        token: token,
        expires_at: expiresAt,
        user_agent: userAgent,
        ip_address: ipAddress,
        revoked: false
      });
      
      console.log('✅ Refresh token creado ID:', refreshToken.id);
      return refreshToken;
    } catch (error) {
      console.error('❌ Error detallado al crear refresh token:', error);
      throw error;
    }
  }
}

module.exports = new RefreshTokenRepository();