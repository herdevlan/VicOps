// backend/src/repositories/subjectRepository.js
const BaseRepository = require('./baseRepository');
const { Subject, Course } = require('../models');
const { Op } = require('sequelize');

class SubjectRepository extends BaseRepository {
  constructor() {
    super(Subject);
  }

  async findByCodigo(codigo) {
    return await Subject.findOne({ where: { codigo } });
  }

  async findWithCourses(id) {
    return await Subject.findByPk(id, {
      include: [{ model: Course, as: 'courses' }]
    });
  }

  async findAllWithCourses(options = {}) {
    return await Subject.findAll({
      include: [{ model: Course, as: 'courses' }],
      order: [['nombre', 'ASC']],
      ...options
    });
  }

  async findByArea(areaConocimiento) {
    return await Subject.findAll({
      where: { area_conocimiento: areaConocimiento },
      order: [['nombre', 'ASC']]
    });
  }

  async findByGrado(grado) {
    return await Subject.findAll({
      where: { grado, estado: true },
      order: [['nombre', 'ASC']]
    });
  }

  async getActiveSubjects() {
    return await Subject.findAll({
      where: { estado: true },
      order: [['nombre', 'ASC']]
    });
  }

  async validateCodigoUnique(codigo, excludeId = null) {
    const where = { codigo };
    if (excludeId) {
      where.id = { [Op.ne]: excludeId };
    }
    
    const existing = await Subject.findOne({ where });
    if (existing) {
      throw new Error(`El código ${codigo} ya está registrado`);
    }
  }

  async countCourses(id) {
    return await Course.count({ where: { subject_id: id } });
  }
}

module.exports = new SubjectRepository();