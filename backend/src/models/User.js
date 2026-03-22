// backend/src/models/User.js
const { Op } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: { msg: 'Debe ser un email válido' },
        notEmpty: { msg: 'El email no puede estar vacío' }
      }
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'La contraseña no puede estar vacía' }
      }
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'El nombre no puede estar vacío' }
      }
    },
    apellido: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'El apellido no puede estar vacío' }
      }
    },
    ci: {
      type: DataTypes.STRING(20),
      allowNull: true,
      unique: true,
      validate: {
        len: { args: [4, 20], msg: 'El CI debe tener entre 4 y 20 caracteres' }
      }
    },
    telefono: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    direccion: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    estado: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'true: activo, false: inactivo'
    },
    role_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'roles',
        key: 'id'
      }
    },
    last_login: {
      type: DataTypes.DATE,
      allowNull: true
    },
    avatar: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  }, {
    tableName: 'users',
    timestamps: true,
    underscored: true,
    paranoid: true,
    defaultScope: {
      attributes: { exclude: ['password'] }
    },
    scopes: {
      withPassword: {
        attributes: { include: ['password'] }
      },
      active: {
        where: { estado: true }
      },
      byRole: (roleId) => ({
        where: { role_id: roleId }
      })
    },
    indexes: [
      { unique: true, fields: ['email'] },
      { unique: true, fields: ['ci'], where: { ci: { [Op.ne]: null } } },
      { fields: ['role_id'] },
      { fields: ['estado'] }
    ]
  });

  User.associate = (models) => {
    User.belongsTo(models.Role, {
      foreignKey: 'role_id',
      as: 'role'
    });
    
    User.hasOne(models.Teacher, {
      foreignKey: 'user_id',
      as: 'teacher',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
    
    User.hasOne(models.Student, {
      foreignKey: 'user_id',
      as: 'student',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
    
    User.hasMany(models.Grade, {
      foreignKey: 'user_id',
      as: 'grades',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });
  };

  return User;
};