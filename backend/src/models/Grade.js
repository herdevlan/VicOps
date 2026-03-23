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
      type: DataTypes.ENUM(
        'primer_parcial', 
        'segundo_parcial', 
        'tercer_parcial', 
        'final', 
        'trabajo', 
        'examen', 
        'recuperatorio',
        'evaluacion_1',
        'evaluacion_2',
        'evaluacion_3',
        'evaluacion_4',
        'evaluacion_5',
        'evaluacion_6'
      ),
      allowNull: false,
      defaultValue: 'evaluacion_1'
    },
    evaluacion_numero: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: { args: [1], msg: 'El número de evaluación debe ser al menos 1' },
        max: { args: [12], msg: 'El número de evaluación no puede ser mayor a 12' }
      },
      comment: 'Número de evaluación (1, 2, 3, 4, 5, 6, etc.)'
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
    }
  }, {
    tableName: 'grades',
    timestamps: true,
    underscored: true,
    paranoid: false,
    indexes: [
      { fields: ['student_id'] },
      { fields: ['course_id'] },
      { fields: ['user_id'] },
      { fields: ['tipo_evaluacion'] },
      { fields: ['evaluacion_numero'] },
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