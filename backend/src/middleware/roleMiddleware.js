// backend/src/middleware/roleMiddleware.js
const { AuthorizationError } = require('../utils/errors');
const { User, Role } = require('../models');

const roleMiddleware = (allowedRoles = []) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw new AuthorizationError('Usuario no autenticado');
      }

      // Obtener el rol del usuario desde la base de datos
      const user = await User.findByPk(req.user.id, {
        include: [{ model: Role, as: 'role' }]
      });

      if (!user || !user.role) {
        throw new AuthorizationError('Rol de usuario no encontrado');
      }

      const userRole = user.role.nombre;

      // Verificar si el rol del usuario está permitido
      if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
        throw new AuthorizationError(`Acceso denegado. Se requiere uno de los siguientes roles: ${allowedRoles.join(', ')}`);
      }

      // Adjuntar información del rol al request
      req.userRole = userRole;
      req.userFull = user;

      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = roleMiddleware;