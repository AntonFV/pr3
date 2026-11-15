import { useState } from 'react';
import AppointmentsList from './components/AppointmentsList';
import ServicesList from './components/ServicesList';
import Auth from './components/Auth'; 
import './App.css';
import AdminPanel from './components/AdminPanel';

function App() {
    
    
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('user');
        return savedUser ? JSON.parse(savedUser) : null;
    });
    const [activeTab, setActiveTab] = useState('services');
    const isAdmin = user?.role === 'Админ';
   
    if (!user) {
        return <Auth onLogin={setUser} />; 
    }

    return (
        <div className="app">
            <header className="app-header">
    <h1 style={{ margin: 0, fontSize: '24px' }}>Сервисный центр</h1>
    <nav className="app-nav">
        <button 
            className={activeTab === 'services' ? 'active' : ''}
            onClick={() => setActiveTab('services')}
        >
            Услуги
        </button>
        <button 
            className={activeTab === 'appointments' ? 'active' : ''}
            onClick={() => setActiveTab('appointments')}
        >
            Мои записи
        </button>
        {isAdmin && (
            <button onClick={() => setActiveTab('admin')}>Админ-панель</button>
        )}
    </nav>
    <button 
        className="btn-logout"
        onClick={() => { localStorage.removeItem('user'); setUser(null); }}
    >
        Выйти ({user.name})
    </button>
</header>

            <main className="app-main">
                {activeTab === 'services' && <ServicesList user={user} />}
                {activeTab === 'appointments' && <AppointmentsList user={user} />}  
                {activeTab === 'admin' && isAdmin && <AdminPanel />}
            </main>
        </div>
    );
}

export default App;