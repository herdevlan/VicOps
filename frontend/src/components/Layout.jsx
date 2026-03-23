import { Link, Outlet, useNavigate } from 'react-router-dom';
import api from '../api';

function Layout() {
  const navigate = useNavigate();
  const user = api.getUser();

  const handleLogout = () => {
    api.logout();
    navigate('/login');
  };

  // Definir menús según rol
  const role = user?.role?.nombre;
  
  const getMenus = () => {
    if (role === 'Administrador') {
      return [
        { to: '/dashboard', label: 'Dashboard', icon: '📊' },
        { to: '/students', label: 'Estudiantes', icon: '👨‍🎓' },
        { to: '/courses', label: 'Cursos', icon: '📚' },
        { to: '/grades', label: 'Calificaciones', icon: '📝' },
        { to: '/profile', label: 'Perfil', icon: '👤' }
      ];
    }
    if (role === 'Docente') {
      return [
        { to: '/dashboard', label: 'Dashboard', icon: '📊' },
        { to: '/students', label: 'Estudiantes', icon: '👨‍🎓' },
        { to: '/courses', label: 'Mis Cursos', icon: '📚' },
        { to: '/grades', label: 'Calificaciones', icon: '📝' },
        { to: '/profile', label: 'Perfil', icon: '👤' }
      ];
    }
    if (role === 'Estudiante') {
      return [
        { to: '/dashboard', label: 'Mi Dashboard', icon: '📊' },
        { to: '/my-grades', label: 'Mis Notas', icon: '📝' },
        { to: '/profile', label: 'Mi Perfil', icon: '👤' }
      ];
    }
    return [
      { to: '/dashboard', label: 'Dashboard', icon: '📊' },
      { to: '/profile', label: 'Perfil', icon: '👤' }
    ];
  };

  const menus = getMenus();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f3f4f6' }}>
      {/* Sidebar */}
      <div style={{
        width: '250px',
        background: 'white',
        boxShadow: '2px 0 4px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#2563eb' }}>Sistema Académico</h2>
          <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>Monitoreo de Desempeño</p>
        </div>

        <div style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: '32px',
              height: '32px',
              background: '#dbeafe',
              borderRadius: '9999px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ color: '#2563eb', fontWeight: 'bold' }}>
                {user?.nombre?.charAt(0)}{user?.apellido?.charAt(0)}
              </span>
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', fontWeight: '500' }}>{user?.nombre} {user?.apellido}</p>
              <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>{role}</p>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '1rem' }}>
          {menus.map((menu, i) => (
            <Link
              key={i}
              to={menu.to}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.5rem 0.75rem',
                marginBottom: '0.25rem',
                borderRadius: '0.375rem',
                color: '#374151',
                textDecoration: 'none',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.background = '#f3f4f6'}
              onMouseLeave={(e) => e.target.style.background = 'transparent'}
            >
              <span>{menu.icon}</span>
              <span>{menu.label}</span>
            </Link>
          ))}
        </nav>

        <div style={{ padding: '1rem', borderTop: '1px solid #e5e7eb' }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '0.5rem',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer'
            }}
          >
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '1.5rem' }}>
        <Outlet />
      </div>
    </div>
  );
}

export default Layout;