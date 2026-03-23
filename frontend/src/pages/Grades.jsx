import { useState, useEffect } from 'react';
import api from '../api';

function Grades() {
  const [cursos, setCursos] = useState([]);
  const [estudiantes, setEstudiantes] = useState([]);
  const [cursoId, setCursoId] = useState('');
  const [estudianteId, setEstudianteId] = useState('');
  const [nota, setNota] = useState('');
  const [evaluacion, setEvaluacion] = useState(1);
  const [tipo, setTipo] = useState('primer_parcial');
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  const tiposEvaluacion = [
    { valor: 'primer_parcial', texto: 'Primer Parcial' },
    { valor: 'segundo_parcial', texto: 'Segundo Parcial' },
    { valor: 'tercer_parcial', texto: 'Tercer Parcial' },
    { valor: 'final', texto: 'Evaluación Final' },
    { valor: 'trabajo', texto: 'Trabajo Práctico' },
    { valor: 'examen', texto: 'Examen' }
  ];

  useEffect(() => {
    cargarCursos();
  }, []);

  const cargarCursos = async () => {
    try {
      const res = await api.get('/courses');
      if (res.success) {
        setCursos(res.data || []);
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const cargarEstudiantes = async (idCurso) => {
    setCargando(true);
    try {
      const res = await api.get(`/courses/${idCurso}/students`);
      let lista = [];
      if (res.success && Array.isArray(res.data)) {
        if (res.data.length > 0 && res.data[0].student) {
          lista = res.data.map(e => e.student);
        } else {
          lista = res.data;
        }
      }
      setEstudiantes(lista);
    } catch (err) {
      console.error('Error:', err);
      setEstudiantes([]);
    } finally {
      setCargando(false);
    }
  };

  const handleCursoChange = (e) => {
    const id = e.target.value;
    setCursoId(id);
    setEstudianteId('');
    setMensaje('');
    if (id) {
      cargarEstudiantes(id);
    } else {
      setEstudiantes([]);
    }
  };

  const guardarNota = async (e) => {
    e.preventDefault();
    
    if (!cursoId || !estudianteId || !nota) {
      setMensaje('❌ Complete todos los campos');
      return;
    }

    const notaNum = parseFloat(nota);
    if (isNaN(notaNum) || notaNum < 0 || notaNum > 100) {
      setMensaje('❌ La nota debe ser un número entre 0 y 100');
      return;
    }

    setCargando(true);
    try {
      const res = await api.post('/grades', {
        student_id: parseInt(estudianteId),
        course_id: parseInt(cursoId),
        nota: notaNum,
        tipo_evaluacion: tipo,
        evaluacion_numero: evaluacion
      });

      if (res.success) {
        setMensaje('✅ Calificación guardada exitosamente');
        setNota('');
      } else {
        setMensaje(`❌ Error: ${res.error || 'No se pudo guardar'}`);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message;
      setMensaje(`❌ Error: ${errorMsg}`);
    } finally {
      setCargando(false);
    }
  };

  const nombreCurso = () => {
    const c = cursos.find(c => c.id == cursoId);
    return c ? `${c.nombre} (${c.grado}° ${c.paralelo})` : '';
  };

  const nombreEstudiante = () => {
    const e = estudiantes.find(e => e.id == estudianteId);
    return e ? `${e.nombre} ${e.apellido}` : '';
  };

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto' }}>
      <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
          Registrar Calificación
        </h1>
        <p style={{ color: '#6b7280', marginBottom: '24px', fontSize: '14px' }}>
          Sistema de 6 evaluaciones por materia
        </p>

        <form onSubmit={guardarNota}>
          {/* Curso */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Curso</label>
            <select
              value={cursoId}
              onChange={handleCursoChange}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ccc',
                borderRadius: '8px',
                fontSize: '14px'
              }}
              required
            >
              <option value="">-- Seleccione un curso --</option>
              {cursos.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nombre} - {c.subject?.nombre} ({c.grado}° {c.paralelo})
                </option>
              ))}
            </select>
          </div>

          {/* Estudiante */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Estudiante</label>
            <select
              value={estudianteId}
              onChange={(e) => setEstudianteId(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ccc',
                borderRadius: '8px',
                fontSize: '14px',
                backgroundColor: cursoId ? 'white' : '#f3f4f6'
              }}
              disabled={!cursoId}
              required
            >
              <option value="">-- Seleccione un estudiante --</option>
              {estudiantes.map(e => (
                <option key={e.id} value={e.id}>
                  {e.ci} - {e.nombre} {e.apellido}
                </option>
              ))}
            </select>
            {cursoId && estudiantes.length === 0 && !cargando && (
              <p style={{ color: '#f59e0b', fontSize: '12px', marginTop: '4px' }}>
                ⚠️ No hay estudiantes inscritos en este curso
              </p>
            )}
          </div>

          {/* Evaluación y Tipo */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Evaluación</label>
              <select
                value={evaluacion}
                onChange={(e) => setEvaluacion(parseInt(e.target.value))}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ccc',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              >
                <option value={1}>Evaluación 1</option>
                <option value={2}>Evaluación 2</option>
                <option value={3}>Evaluación 3</option>
                <option value={4}>Evaluación 4</option>
                <option value={5}>Evaluación 5</option>
                <option value={6}>Evaluación 6</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Tipo</label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ccc',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              >
                {tiposEvaluacion.map(t => (
                  <option key={t.valor} value={t.valor}>{t.texto}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Nota */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Calificación (0-100)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ccc',
                borderRadius: '8px',
                fontSize: '14px'
              }}
              placeholder="Ej: 85.5"
              required
            />
          </div>

          {/* Mensaje */}
          {mensaje && (
            <div style={{
              marginBottom: '16px',
              padding: '10px',
              borderRadius: '8px',
              backgroundColor: mensaje.includes('✅') ? '#d1fae5' : '#fee2e2',
              color: mensaje.includes('✅') ? '#065f46' : '#dc2626',
              fontSize: '14px',
              textAlign: 'center'
            }}>
              {mensaje}
            </div>
          )}

          {/* Botón */}
          <button
            type="submit"
            disabled={cargando || !cursoId || !estudianteId}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: 'pointer',
              opacity: (cargando || !cursoId || !estudianteId) ? 0.6 : 1
            }}
          >
            {cargando ? 'Guardando...' : 'Guardar Calificación'}
          </button>
        </form>

        {/* Resumen */}
        {cursoId && estudianteId && nota && (
          <div style={{
            marginTop: '20px',
            padding: '12px',
            backgroundColor: '#f3f4f6',
            borderRadius: '8px',
            fontSize: '13px'
          }}>
            <strong>Resumen:</strong><br />
            Curso: {nombreCurso()}<br />
            Estudiante: {nombreEstudiante()}<br />
            Evaluación: {evaluacion} - {tiposEvaluacion.find(t => t.valor === tipo)?.texto}<br />
            Calificación: {nota}%
          </div>
        )}
      </div>
    </div>
  );
}

export default Grades;