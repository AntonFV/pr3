import { useState } from 'react';

export default function Auth({ onLogin }) {
    const [isRegister, setIsRegister] = useState(false);
    const [formData, setFormData] = useState({ name: '', password: '' });
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        const endpoint = isRegister ? 'register' : 'login';
        
        try {
            const response = await fetch(`http://localhost:3001/api/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Ошибка авторизации');

            
            localStorage.setItem('user', JSON.stringify(data));
            onLogin(data); 
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
            <h2>{isRegister ? 'Регистрация' : 'Вход'}</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input 
                    type="text" 
                    placeholder="Имя пользователя" 
                    value={formData.name} 
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                    required 
                    style={{ padding: '8px' }}
                />
                <input 
                    type="password" 
                    placeholder="Пароль" 
                    value={formData.password} 
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
                    required 
                    style={{ padding: '8px' }}
                />
                <button type="submit" style={{ padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}>
                    {isRegister ? 'Зарегистрироваться' : 'Войти'}
                </button>
            </form>
            <p style={{ textAlign: 'center', marginTop: '10px' }}>
                {isRegister ? 'Уже есть аккаунт?' : 'Нет аккаунта?'} 
                <button 
                    onClick={() => setIsRegister(!isRegister)} 
                    style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer' }}
                >
                    {isRegister ? 'Войти' : 'Зарегистрироваться'}
                </button>
            </p>
        </div>
    );
}