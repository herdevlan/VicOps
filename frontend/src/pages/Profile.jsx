import api from '../api';

function Profile() {
  const user = api.getUser();

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Mi Perfil</h1>

      <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', maxWidth: '500px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{
            width: '60px',
            height: '60px',
            background: '#dbeafe',
            borderRadius: '9999px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <span style={{ fontSize: '1.5rem', color: '#2563eb' }}>
              {user?.nombre?.charAt(0)}{user?.apellido?.charAt(0)}
            </span>
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{user?.nombre} {user?.apellido}</h2>
            <p style={{ color: '#6b7280' }}>{user?.role?.nombre}</p>
          </div>
        </div>

        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}>
          <p><strong>Email:</strong> {user?.email}</p>
          <p><strong>CI:</strong> {user?.ci || 'No registrado'}</p>
          <p><strong>Teléfono:</strong> {user?.telefono || 'No registrado'}</p>
        </div>
      </div>
    </div>
  );
}

export default Profile;