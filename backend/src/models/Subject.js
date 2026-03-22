// backend/src/models/Subject.js
module.exports = (sequelize, DataTypes) => {
  const Subject = sequelize.define('Subject', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    codigo: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: { msg: 'El código de materia no puede estar vacío' }
      }
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'El nombre de la materia no puede estar vacío' }
      }
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    horas_academicas: {
      type: DataTypes.INTEGER,
      defaultValue: 80,
      validate: {
        min: { args: [1], msg: 'Las horas deben ser al menos 1' },
        max: { args: [200], msg: 'Las horas no pueden exceder 200' }
      }
    },
    area_conocimiento: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    grado: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Grado escolar: 1, 2, 3, 4, 5, 6'
    },
    estado: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'true: activa, false: inactiva'
    }
  }, {
    tableName: 'subjects',
    timestamps: true,
    underscored: true,
    paranoid: true,
    indexes: [
      { unique: true, fields: ['codigo'] },
      { fields: ['nombre'] },
      { fields: ['area_conocimiento'] },
      { fields: ['grado'] }
    ]
  });

  Subject.associate = (models) => {
    Subject.hasMany(models.Course, {
      foreignKey: 'subject_id',
      as: 'courses',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE'
    });
  };

  return Subject;
};