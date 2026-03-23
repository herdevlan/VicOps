import { useState, useEffect } from 'react';
import api from '../api';

function Students() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    ci: '',
    nombre: '',
    apellido: '',
    fecha_nacimiento: '',
    telefono: '',
    email: '',
    tutor_nombre: '',
    tutor_telefono: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      setLoading(true);
      console.log('Cargando estudiantes...');
      const res = await api.get('/students');
      console.log('Respuesta estudiantes:', res);
      
      let studentsList = [];
      if (res.success && Array.isArray(res.data)) {
        studentsList = res.data;
      }
      
      // Calcular promedio para cada estudiante
      const studentsWithAverage = await Promise.all(
        studentsList.map(async (student) => {
          try {
            const avgRes = await api.get(`/grades/student/${student.id}/average`);
            const average = avgRes.success && avgRes.data ? avgRes.data.average || 0 : 0;
            return { ...student, average: parseFloat(average).toFixed(2) };
          } catch (err) {
            console.error(`Error al obtener promedio de ${student.id}:`, err);
            return { ...student, average: '0.00' };
          }
        })
      );
      
      // Ordenar por promedio (mayor a menor)
      studentsWithAverage.sort((a, b) => parseFloat(b.average) - parseFloat(a.average));
      
      setStudents(studentsWithAverage);
    } catch (err) {
      console.error('Error cargando estudiantes:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.ci || !formData.nombre || !formData.apellido) {
      alert('❌ Complete los campos obligatorios: CI, Nombre y Apellido');
      return;
    }
    
    setSaving(true);
    try {
      const res = await api.post('/students', formData);
      if (res.success) {
        alert('✅ Estudiante creado exitosamente');
        setShowForm(false);
        setFormData({
          ci: '',
          nombre: '',
          apellido: '',
          fecha_nacimiento: '',
          telefono: '',
          email: '',
          tutor_nombre: '',
          tutor_telefono: ''
        });
        loadStudents(); // Recargar lista
      } else {
        alert('❌ Error: ' + (res.error || 'No se pudo crear el estudiante'));
      }
    } catch (err) {
      console.error('Error creando estudiante:', err);
      const errorMsg = err.response?.data?.error || err.message;
      alert('❌ Error al crear el estudiante: ' + errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const getRendimientoInfo = (average) => {
    const avg = parseFloat(average);
    if (avg >= 85) return { label: 'Excelente', color: '#10b981', bg: '#d1fae5' };
    if (avg >= 70) return { label: 'Muy Bueno', color: '#3b82f6', bg: '#dbeafe' };
    if (avg >= 60) return { label: 'Bueno', color: '#f59e0b', bg: '#fef3c7' };
    if (avg >= 51) return { label: 'Suficiente', color: '#8b5cf6', bg: '#ede9fe' };
    return { label: 'Reprobado', color: '#ef4444', bg: '#fee2e2' };
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <p>Cargando estudiantes...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div style={{ background: '#fee2e2', color: '#dc2626', padding: '1rem', borderRadius: '8px' }}>
        Error: {error}
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Estudiantes</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            background: '#2563eb',
            color: 'white',
            padding: '0.5rem 1rem',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontWeight: '500'
          }}
        >
          <span style={{ fontSize: '1.2rem' }}>+</span> 
          {showForm ? 'Cancelar' : 'Nuevo Estudiante'}
        </button>
      </div>

      {/* Formulario para crear estudiante */}
      {showForm && (
        <div style={{ 
          background: 'white', 
          borderRadius: '12px', 
          padding: '1.5rem', 
          marginBottom: '1.5rem', 
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          border: '1px solid #e5e7eb'
        }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1f2937' }}>
            Registrar Nuevo Estudiante
          </h2>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>
                CI *
              </label>
              <input
                type="text"
                name="ci"
                value={formData.ci}
                onChange={handleInputChange}
                required
                style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem' }}
                placeholder="12345678"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>
                Nombre *
              </label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                required
                style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem' }}
                placeholder="Juan"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>
                Apellido *
              </label>
              <input
                type="text"
                name="apellido"
                value={formData.apellido}
                onChange={handleInputChange}
                required
                style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem' }}
                placeholder="Perez"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>
                Fecha Nacimiento
              </label>
              <input
                type="date"
                name="fecha_nacimiento"
                value={formData.fecha_nacimiento}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>
                Teléfono
              </label>
              <input
                type="text"
                name="telefono"
                value={formData.telefono}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem' }}
                placeholder="71234567"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem' }}
                placeholder="juan@email.com"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>
                Nombre del Tutor
              </label>
              <input
                type="text"
                name="tutor_nombre"
                value={formData.tutor_nombre}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem' }}
                placeholder="María Perez"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>
                Teléfono Tutor
              </label>
              <input
                type="text"
                name="tutor_telefono"
                value={formData.tutor_telefono}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem' }}
                placeholder="71234568"
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button
                type="submit"
                disabled={saving}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  opacity: saving ? 0.6 : 1
                }}
              >
                {saving ? 'Guardando...' : 'Guardar Estudiante'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabla de estudiantes */}
      <div style={{ background: 'white', borderRadius: '8px', overflow: 'auto', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '500px' }}>
          <thead style={{ background: '#f9fafb' }}>
            <tr>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>#</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>CI</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Nombre Completo</th>
              <th style={{ padding: '0.75rem', textAlign: 'center' }}>Promedio</th>
              <th style={{ padding: '0.75rem', textAlign: 'center' }}>Rendimiento</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s, idx) => {
              const rendimiento = getRendimientoInfo(s.average);
              return (
                <tr key={s.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '0.75rem' }}>{idx + 1}</td>
                  <td style={{ padding: '0.75rem' }}>{s.ci}</td>
                  <td style={{ padding: '0.75rem' }}>{s.nombre} {s.apellido}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 'bold' }}>
                    {s.average}%
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    <span style={{
                      background: rendimiento.bg,
                      color: rendimiento.color,
                      padding: '0.25rem 0.75rem',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: '500'
                    }}>
                      {rendimiento.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {students.length === 0 && (
          <p style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
            No hay estudiantes registrados. Crea uno nuevo.
          </p>
        )}
        
        {students.length > 0 && (
          <p style={{ padding: '1rem', textAlign: 'center', color: '#6b7280', fontSize: '0.875rem' }}>
            Total: {students.length} estudiantes | Ordenados por promedio (mayor a menor)
          </p>
        )}
      </div>
    </div>
  );
}

export default Students;