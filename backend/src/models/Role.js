// backend/src/models/Role.js
module.exports = (sequelize, DataTypes) => {
  const Role = sequelize.define('Role', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    nombre: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: { msg: 'El nombre del rol no puede estar vacío' },
        len: { args: [2, 50], msg: 'El nombre debe tener entre 2 y 50 caracteres' }
      }
    },
    descripcion: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    permisos: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Permisos en formato JSON o lista separada por comas'
    },
    nivel: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      comment: 'Nivel de jerarquía: 1=admin, 2=director, 3=docente, 4=estudiante'
    }
  }, {
    tableName: 'roles',
    timestamps: true,
    underscored: true,
    paranoid: true,
    indexes: [
      { unique: true, fields: ['nombre'] }
    ]
  });

  Role.associate = (models) => {
    Role.hasMany(models.User, {
      foreignKey: 'role_id',
      as: 'users',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE'
    });
  };

  return Role;
};