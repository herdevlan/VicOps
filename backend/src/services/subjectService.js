// backend/src/services/subjectService.js
const BaseService = require('./baseService');
const subjectRepository = require('../repositories/subjectRepository');
const auditRepository = require('../repositories/auditRepository');
const { NotFoundError, ValidationError } = require('../utils/errors');
const logger = require('../utils/logger');

class SubjectService extends BaseService {
  constructor() {
    super(subjectRepository);
  }

  async getAllSubjects() {
    return await subjectRepository.findAllWithCourses();
  }

  async getSubjectById(id) {
    const subject = await subjectRepository.findWithCourses(id);
    if (!subject) {
      throw new NotFoundError('Materia');
    }
    return subject;
  }

  async createSubject(subjectData, ipAddress, userAgent, requestingUserId) {
    logger.info(`Creando materia: ${subjectData.nombre}`);
    
    // Validar código único
    await subjectRepository.validateCodigoUnique(subjectData.codigo);
    
    const subject = await subjectRepository.create(subjectData);
    
    await auditRepository.log(
      requestingUserId,
      null,
      'create',
      'subject',
      subject.id,
      null,
      { codigo: subject.codigo, nombre: subject.nombre },
      ipAddress,
      userAgent,
      201,
      null
    );
    
    logger.info(`Materia creada: ${subject.codigo} - ${subject.nombre}`);
    return subject;
  }

  async updateSubject(id, subjectData, ipAddress, userAgent, requestingUserId) {
    logger.info(`Actualizando materia ID: ${id}`);
    
    const subject = await subjectRepository.findById(id);
    if (!subject) {
      throw new NotFoundError('Materia');
    }
    
    const oldData = { ...subject.toJSON() };
    
    // Validar código único excluyendo el actual
    if (subjectData.codigo && subjectData.codigo !== subject.codigo) {
      await subjectRepository.validateCodigoUnique(subjectData.codigo, id);
    }
    
    const updatedSubject = await subjectRepository.update(id, subjectData);
    
    await auditRepository.log(
      requestingUserId,
      null,
      'update',
      'subject',
      id,
      oldData,
      updatedSubject.toJSON(),
      ipAddress,
      userAgent,
      200,
      null
    );
    
    logger.info(`Materia actualizada: ID ${id}`);
    return updatedSubject;
  }

  async deleteSubject(id, ipAddress, userAgent, requestingUserId) {
    logger.info(`Eliminando materia ID: ${id}`);
    
    const subject = await subjectRepository.findById(id);
    if (!subject) {
      throw new NotFoundError('Materia');
    }
    
    // Verificar si tiene cursos asociados
    const courseCount = await subjectRepository.countCourses(id);
    if (courseCount > 0) {
      throw new ValidationError(`No se puede eliminar la materia porque tiene ${courseCount} cursos asociados`);
    }
    
    const subjectData = { ...subject.toJSON() };
    
    await subjectRepository.delete(id);
    
    await auditRepository.log(
      requestingUserId,
      null,
      'delete',
      'subject',
      id,
      subjectData,
      null,
      ipAddress,
      userAgent,
      200,
      null
    );
    
    logger.info(`Materia eliminada: ID ${id}`);
    return true;
  }

  async getSubjectsByArea(area) {
    return await subjectRepository.findByArea(area);
  }

  async getSubjectsByGrado(grado) {
    return await subjectRepository.findByGrado(grado);
  }

  async getActiveSubjects() {
    return await subjectRepository.getActiveSubjects();
  }
}

module.exports = new SubjectService();