import { useState, useEffect } from 'react';
import api from '../api';

function Courses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [formData, setFormData] = useState({
    nombre: '',
    grado: '',
    paralelo: '',
    gestion: new Date().getFullYear(),
    turno: 'mañana',
    subject_id: '',
    teacher_id: null
  });

  // Cargar cursos y materias
  useEffect(() => {
    loadCourses();
    loadSubjects();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const res = await api.get('/courses');
      console.log('Cursos:', res);
      if (res.success) {
        // Ordenar por fecha de creación (más recientes primero)
        const sortedCourses = (res.data || []).sort((a, b) => {
          return new Date(b.created_at) - new Date(a.created_at);
        });
        setCourses(sortedCourses);
      } else {
        setCourses([]);
      }
    } catch (err) {
      console.error('Error cargando cursos:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadSubjects = async () => {
    try {
      const res = await api.get('/subjects');
      if (res.success) {
        setSubjects(res.data || []);
      }
    } catch (err) {
      console.error('Error cargando materias:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Para teacher_id, manejar como null si está vacío
    if (name === 'teacher_id') {
      setFormData({
        ...formData,
        [name]: value === '' ? null : parseInt(value)
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validaciones básicas
    if (!formData.nombre.trim()) {
      alert('El nombre del curso es requerido');
      return;
    }
    if (!formData.grado) {
      alert('El grado es requerido');
      return;
    }
    if (!formData.paralelo.trim()) {
      alert('El paralelo es requerido');
      return;
    }
    if (!formData.subject_id) {
      alert('Debe seleccionar una materia');
      return;
    }
    
    // Preparar datos para enviar
    const dataToSend = {
      nombre: formData.nombre.trim(),
      grado: parseInt(formData.grado),
      paralelo: formData.paralelo.trim().toUpperCase(),
      gestion: parseInt(formData.gestion),
      turno: formData.turno,
      subject_id: parseInt(formData.subject_id)
    };
    
    // Solo incluir teacher_id si tiene valor válido
    if (formData.teacher_id && formData.teacher_id !== '' && !isNaN(formData.teacher_id)) {
      dataToSend.teacher_id = parseInt(formData.teacher_id);
    }
    
    console.log('Enviando curso:', dataToSend);
    
    try {
      const res = await api.post('/courses', dataToSend);
      if (res.success) {
        alert('Curso creado exitosamente');
        setShowForm(false);
        setFormData({
          nombre: '',
          grado: '',
          paralelo: '',
          gestion: new Date().getFullYear(),
          turno: 'mañana',
          subject_id: '',
          teacher_id: null
        });
        loadCourses(); // Recargar lista
      } else {
        alert('Error: ' + (res.error || 'No se pudo crear el curso'));
      }
    } catch (err) {
      console.error('Error creando curso:', err);
      console.log('Respuesta del servidor:', err.response?.data);
      
      // Mostrar mensaje de error específico
      const errorMsg = err.response?.data?.error || err.response?.data?.message || 'No se pudo crear el curso';
      alert('Error: ' + errorMsg);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este curso?')) return;
    try {
      const res = await api.delete(`/courses/${id}`);
      if (res.success) {
        alert('Curso eliminado');
        loadCourses();
      } else {
        alert('Error al eliminar');
      }
    } catch (err) {
      console.error('Error eliminando curso:', err);
      alert('Error al eliminar el curso');
    }
  };

  // Formatear fecha para mostrar
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) return <p>Cargando cursos...</p>;
  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Cursos</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            background: '#2563eb',
            color: 'white',
            padding: '0.5rem 1rem',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {showForm ? 'Cancelar' : '+ Nuevo Curso'}
        </button>
      </div>

      {/* Formulario para crear curso */}
      {showForm && (
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem' }}>Nuevo Curso</h2>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Nombre del Curso *</label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                required
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                placeholder="Ej: Matemáticas 1° A"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Grado *</label>
              <input
                type="number"
                name="grado"
                value={formData.grado}
                onChange={handleInputChange}
                required
                min="1"
                max="12"
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                placeholder="1-12"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Paralelo *</label>
              <input
                type="text"
                name="paralelo"
                value={formData.paralelo}
                onChange={handleInputChange}
                required
                maxLength="10"
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                placeholder="A, B, C"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Gestión *</label>
              <input
                type="number"
                name="gestion"
                value={formData.gestion}
                onChange={handleInputChange}
                required
                min="2000"
                max="2100"
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Turno *</label>
              <select
                name="turno"
                value={formData.turno}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
              >
                <option value="mañana">Mañana</option>
                <option value="tarde">Tarde</option>
                <option value="noche">Noche</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Materia *</label>
              <select
                name="subject_id"
                value={formData.subject_id}
                onChange={handleInputChange}
                required
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
              >
                <option value="">Seleccione una materia</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.nombre} ({s.codigo})</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button
                type="submit"
                style={{
                  background: '#10b981',
                  color: 'white',
                  padding: '0.5rem 1rem',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  width: '100%'
                }}
              >
                Guardar Curso
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabla de cursos - SIN COLUMNA ID */}
      <div style={{ background: 'white', borderRadius: '8px', overflow: 'auto', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
          <thead style={{ background: '#f9fafb' }}>
            <tr>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Nombre</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Grado</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Paralelo</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Materia</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Gestión</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Turno</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Creado</th>
              <th style={{ padding: '0.75rem', textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((c) => (
              <tr key={c.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                <td style={{ padding: '0.75rem' }}>{c.nombre}</td>
                <td style={{ padding: '0.75rem' }}>{c.grado}°</td>
                <td style={{ padding: '0.75rem' }}>{c.paralelo}</td>
                <td style={{ padding: '0.75rem' }}>{c.subject?.nombre || '-'}</td>
                <td style={{ padding: '0.75rem' }}>{c.gestion}</td>
                <td style={{ padding: '0.75rem' }}>{c.turno}</td>
                <td style={{ padding: '0.75rem', fontSize: '0.75rem', color: '#6b7280' }}>{formatDate(c.created_at)}</td>
                <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                  <button
                    onClick={() => handleDelete(c.id)}
                    style={{
                      background: '#ef4444',
                      color: 'white',
                      padding: '0.25rem 0.75rem',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.75rem'
                    }}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {courses.length === 0 && (
          <p style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
            No hay cursos registrados. Crea uno nuevo.
          </p>
        )}
        {courses.length > 0 && (
          <p style={{ padding: '1rem', textAlign: 'center', color: '#6b7280', fontSize: '0.875rem' }}>
            Total: {courses.length} cursos
          </p>
        )}
      </div>
    </div>
  );
}

export default Courses;