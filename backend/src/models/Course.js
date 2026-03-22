// backend/src/models/Course.js
module.exports = (sequelize, DataTypes) => {
  const Course = sequelize.define('Course', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'El nombre del curso no puede estar vacío' }
      }
    },
    nivel: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Primaria, Secundaria, etc.'
    },
    grado: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '1ro, 2do, 3ro, etc.'
    },
    paralelo: {
      type: DataTypes.STRING(10),
      allowNull: true,
      comment: 'A, B, C, etc.'
    },
    gestion: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: { args: [2000], msg: 'La gestión debe ser mayor a 2000' },
        max: { args: [2100], msg: 'La gestión debe ser menor a 2100' }
      }
    },
    turno: {
      type: DataTypes.ENUM('mañana', 'tarde', 'noche'),
      defaultValue: 'mañana'
    },
    capacidad: {
      type: DataTypes.INTEGER,
      defaultValue: 30,
      validate: {
        min: { args: [1], msg: 'La capacidad debe ser al menos 1' },
        max: { args: [50], msg: 'La capacidad no puede exceder 50' }
      }
    },
    teacher_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'teachers',
        key: 'id'
      }
    },
    subject_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'subjects',
        key: 'id'
      }
    },
    estado: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'true: activo, false: inactivo'
    }
  }, {
    tableName: 'courses',
    timestamps: true,
    underscored: true,
    paranoid: false,
    indexes: [
      { unique: true, fields: ['grado', 'paralelo', 'gestion', 'subject_id'], name: 'unique_course_per_year' },
      { fields: ['teacher_id'] },
      { fields: ['subject_id'] },
      { fields: ['gestion'] },
      { fields: ['turno'] }
    ]
  });

  Course.associate = (models) => {
    Course.belongsTo(models.Teacher, {
      foreignKey: 'teacher_id',
      as: 'teacher',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });
    
    Course.belongsTo(models.Subject, {
      foreignKey: 'subject_id',
      as: 'subject',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE'
    });
    
    Course.hasMany(models.Enrollment, {
      foreignKey: 'course_id',
      as: 'enrollments',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
    
    Course.hasMany(models.Grade, {
      foreignKey: 'course_id',
      as: 'grades',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
  };

  return Course;
};