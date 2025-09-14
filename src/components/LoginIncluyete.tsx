import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../public/logo.png';

const USER = 'carlos.aljure@datosyanalisis.com';
const PASS = 'incluyete-2025';

export default function LoginIncluyete({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email === USER && password === PASS) {
      setError('');
      localStorage.setItem('incluyete_logged', 'true');
      if (onLogin) onLogin();
      navigate('/mapa');
    } else {
      setError('Usuario o contraseña incorrectos');
    }
  };

  return (
    <div style={{ maxWidth: 350, margin: '80px auto', background: '#fff', borderRadius: 12, boxShadow: '0 2px 16px #0002', padding: 32 }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <img src={logo} alt="Incluyete+" style={{ width: 100, marginBottom: 8 }} />
        <h2 style={{ margin: 0, fontWeight: 700 }}>Iniciar sesión en InclúyeTE</h2>
        <p style={{ color: '#555', fontSize: 15 }}>Ingresa tu correo y contraseña para acceder a tu cuenta</p>
      </div>
      <form onSubmit={handleSubmit}>
        <label style={{ fontWeight: 500 }}>Correo electrónico</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={{ width: '100%', marginBottom: 16, padding: 8, borderRadius: 6, border: '1px solid #ccc' }} />
        <label style={{ fontWeight: 500 }}>Contraseña</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required style={{ width: '100%', marginBottom: 16, padding: 8, borderRadius: 6, border: '1px solid #ccc' }} />
        {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
        <button type="submit" style={{ width: '100%', background: '#f7b500', color: '#222', fontWeight: 700, padding: 10, borderRadius: 6, border: 'none', fontSize: 16 }}>Iniciar sesión</button>
      </form>
      <div style={{ textAlign: 'center', marginTop: 18, fontSize: 14, color: '#555' }}>
      
        <br />
        <span style={{ color: '#888', fontSize: 13 }}>Versión 1.0.2</span>
      </div>
    </div>
  );
}
