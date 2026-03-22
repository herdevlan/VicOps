// backend/src/models/Enrollment.js
module.exports = (sequelize, DataTypes) => {
  const Enrollment = sequelize.define('Enrollment', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    student_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'students',
        key: 'id'
      }
    },
    course_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'courses',
        key: 'id'
      }
    },
    fecha_inscripcion: {
      type: DataTypes.DATEONLY,
      defaultValue: DataTypes.NOW,
      allowNull: false
    },
    estado: {
      type: DataTypes.ENUM('activo', 'retirado', 'aprobado', 'reprobado', 'trasladado'),
      defaultValue: 'activo',
      comment: 'Estado de la inscripción en el curso'
    },
    nota_final: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      validate: {
        min: { args: [0], msg: 'La nota final no puede ser menor a 0' },
        max: { args: [100], msg: 'La nota final no puede ser mayor a 100' }
      }
    },
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    fecha_retiro: {
      type: DataTypes.DATEONLY,
      allowNull: true
    }
  }, {
    tableName: 'enrollments',
    timestamps: true,
    underscored: true,
    indexes: [
      { unique: true, fields: ['student_id', 'course_id'], name: 'unique_student_course' },
      { fields: ['student_id'] },
      { fields: ['course_id'] },
      { fields: ['estado'] }
    ]
  });

  Enrollment.associate = (models) => {
    Enrollment.belongsTo(models.Student, {
      foreignKey: 'student_id',
      as: 'student',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
    
    Enrollment.belongsTo(models.Course, {
      foreignKey: 'course_id',
      as: 'course',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
  };

  return Enrollment;
};