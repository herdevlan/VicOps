// backend/src/models/Teacher.js
module.exports = (sequelize, DataTypes) => {
  const Teacher = sequelize.define('Teacher', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      unique: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    ci: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: { msg: 'El CI no puede estar vacío' },
        len: { args: [4, 20], msg: 'El CI debe tener entre 4 y 20 caracteres' }
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
    especialidad: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    titulo: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    telefono: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        isEmail: { msg: 'Debe ser un email válido' }
      }
    },
    fecha_contratacion: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    estado: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'true: activo, false: inactivo'
    }
  }, {
    tableName: 'teachers',
    timestamps: true,
    underscored: true,
    paranoid: true,
    indexes: [
      { unique: true, fields: ['ci'] },
      { fields: ['user_id'] },
      { fields: ['especialidad'] }
    ]
  });

  Teacher.associate = (models) => {
    Teacher.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });
    
    Teacher.hasMany(models.Course, {
      foreignKey: 'teacher_id',
      as: 'courses',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });
  };

  return Teacher;
};