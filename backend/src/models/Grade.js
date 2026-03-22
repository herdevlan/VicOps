// backend/src/models/Grade.js
module.exports = (sequelize, DataTypes) => {
  const Grade = sequelize.define('Grade', {
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
    nota: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      validate: {
        min: { args: [0], msg: 'La nota no puede ser menor a 0' },
        max: { args: [100], msg: 'La nota no puede ser mayor a 100' }
      }
    },
    tipo_evaluacion: {
      type: DataTypes.ENUM('primer_parcial', 'segundo_parcial', 'tercer_parcial', 'final', 'trabajo', 'examen', 'recuperatorio'),
      allowNull: false
    },
    porcentaje: {
      type: DataTypes.INTEGER,
      defaultValue: 100,
      validate: {
        min: { args: [0], msg: 'El porcentaje no puede ser menor a 0' },
        max: { args: [100], msg: 'El porcentaje no puede ser mayor a 100' }
      },
      comment: 'Porcentaje que representa esta nota en la evaluación final'
    },
    fecha: {
      type: DataTypes.DATEONLY,
      defaultValue: DataTypes.NOW,
      allowNull: false
    },
    observacion: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    bimestre: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: { args: [1], msg: 'El bimestre debe ser entre 1 y 4' },
        max: { args: [4], msg: 'El bimestre debe ser entre 1 y 4' }
      }
    }
  }, {
    tableName: 'grades',
    timestamps: true,
    underscored: true,
    paranoid: false,  // ✅ CAMBIADO: deshabilitar paranoid porque no existe deleted_at
    indexes: [
      { fields: ['student_id'] },
      { fields: ['course_id'] },
      { fields: ['user_id'] },
      { fields: ['tipo_evaluacion'] },
      { fields: ['fecha'] },
      { fields: ['student_id', 'course_id'] }
    ]
  });

  Grade.associate = (models) => {
    Grade.belongsTo(models.Student, {
      foreignKey: 'student_id',
      as: 'student',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
    
    Grade.belongsTo(models.Course, {
      foreignKey: 'course_id',
      as: 'course',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
    
    Grade.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'registeredBy',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });
  };

  return Grade;
};