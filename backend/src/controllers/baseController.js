// backend/src/controllers/baseController.js
class BaseController {
  constructor(service) {
    this.service = service;
  }

  // Enviar respuesta exitosa
  success(res, data, message = 'Operación exitosa', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data
    });
  }

  // Enviar respuesta con paginación
  paginated(res, data, page, limit, total, message = 'Operación exitosa') {
    return res.json({
      success: true,
      message,
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  }

  // CORREGIDO: Método error que maneja diferentes formatos
  error(res, error, statusCode = 400) {
    let errorMessage = 'Error desconocido';
    
    if (typeof error === 'string') {
      errorMessage = error;
    } else if (error && error.message) {
      errorMessage = error.message;
    } else if (error && error.msg) {
      errorMessage = error.msg;
    }
    
    return res.status(statusCode).json({
      success: false,
      error: errorMessage
    });
  }

  // Método base para obtener todos
  async getAll(req, res, next) {
    try {
      const data = await this.service.getAll();
      return this.success(res, data);
    } catch (error) {
      next(error);
    }
  }

  // Método base para obtener por ID
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const data = await this.service.getById(id);
      return this.success(res, data);
    } catch (error) {
      next(error);
    }
  }

  // Método base para crear
  async create(req, res, next) {
    try {
      const data = await this.service.create(req.body);
      return this.success(res, data, 'Creado exitosamente', 201);
    } catch (error) {
      next(error);
    }
  }

  // Método base para actualizar
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const data = await this.service.update(id, req.body);
      return this.success(res, data, 'Actualizado exitosamente');
    } catch (error) {
      next(error);
    }
  }

  // Método base para eliminar
  async delete(req, res, next) {
    try {
      const { id } = req.params;
      await this.service.delete(id);
      return this.success(res, null, 'Eliminado exitosamente');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = BaseController;