// backend/src/models/Student.js
module.exports = (sequelize, DataTypes) => {
  const Student = sequelize.define('Student', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    ci: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    apellido: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    // ✅ NUEVOS CAMPOS
    matricula: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true
    },
    grado: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    nivel: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    fecha_nacimiento: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    direccion: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    telefono: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    tutor_nombre: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    tutor_telefono: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    estado: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'students',
    timestamps: true,
    underscored: true,
    paranoid: false,
    indexes: [
      { unique: true, fields: ['ci'] },
      { unique: true, fields: ['matricula'] },
      { fields: ['user_id'] },
      { fields: ['grado', 'nivel'] }
    ]
  });

  Student.associate = (models) => {
    Student.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
    
    Student.hasMany(models.Grade, {
      foreignKey: 'student_id',
      as: 'grades'
    });
    
    Student.hasMany(models.Enrollment, {
      foreignKey: 'student_id',
      as: 'enrollments'
    });
  };

  return Student;
};