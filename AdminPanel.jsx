import { useEffect, useState } from 'react';
import { getServices } from '../api/services';
import { createService } from '../api/services';

export default function AdminPanel() {
    const [services, setServices] = useState([]);
    const [users, setUsers] = useState([]);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [categories, setCategories] = useState([]);
    const [newCategory, setNewCategory] = useState('');
    const [newService, setNewService] = useState({ title: '', worktime: '', serve_cost: '', category_id: '' });
    useEffect(() => {
        getServices().then(setServices);
        fetch('http://localhost:3001/api/users').then(res => res.json()).then(setUsers);
        fetch('http://localhost:3001/api/categories').then(res => res.json()).then(setCategories);
        fetch('http://localhost:3001/api/payments/stats')
            .then(res => res.json())
            .then(data => setTotalRevenue(data.total_revenue))
            .catch(err => console.error('Ошибка статистики:', err));
    }, []);
const handleCreateService = async (e) => {
    e.preventDefault();
    try {
        await createService({
            ...newService,
            serve_cost: parseInt(newService.serve_cost),
            category_id: newService.category_id ? parseInt(newService.category_id) : null
        });
        alert('Услуга успешно создана!');
        setNewService({ title: '', worktime: '', serve_cost: '', category_id: '' }); // Очистка
        const freshData = await getServices(); // Обновляем список услуг
        setServices(freshData);
    } catch (err) {
        alert('Ошибка: ' + err.message);
    }
};
    const handleCreateCategory = async () => {
        if (!newCategory.trim()) return;
        try {
            await fetch('http://localhost:3001/api/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: newCategory })
            });
            setNewCategory('');
            const res = await fetch('http://localhost:3001/api/categories');
            setCategories(await res.json());
        } catch (err) {
            alert('Ошибка при создании категории');
        }
    };

    const handleDeleteCategory = async (id, title) => {
        if (window.confirm(`Удалить категорию "${title}"? Услуги останутся без категории.`)) {
            try {
                await fetch(`http://localhost:3001/api/categories/${id}`, { method: 'DELETE' });
                const res = await fetch('http://localhost:3001/api/categories');
                setCategories(await res.json());
                const freshServices = await getServices();
                setServices(freshServices);
            } catch (err) {
                alert('Ошибка при удалении категории');
            }
        }
    };

    const handleServiceCategoryChange = async (serviceId, categoryId) => {
        await fetch(`http://localhost:3001/api/services/${serviceId}/category`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ category_id: categoryId ? parseInt(categoryId) : null })
        });
        const fresh = await getServices();
        setServices(fresh);
    };

    const handleServiceInputChange = (serviceId, newValue) => {
        setServices(prev => prev.map(s => s.service_id === serviceId ? { ...s, discount_percent: newValue } : s));
    };

    const handleSaveServiceDiscount = async (serviceId, discountValue) => {
        await fetch(`http://localhost:3001/api/services/${serviceId}/discount`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ discount_percent: parseInt(discountValue) || 0 })
        });
        alert('Скидка на услугу обновлена!');
        const freshData = await getServices();
        setServices(freshData);
    };

    const handleUserInputChange = (userId, newValue) => {
        setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, discount_percent: newValue } : u));
    };

    const handleSaveUserDiscount = async (userId, discountValue) => {
        await fetch(`http://localhost:3001/api/users/${userId}/discount`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ discount_percent: parseInt(discountValue) || 0 })
        });
        alert('Персональная скидка обновлена!');
        const res = await fetch('http://localhost:3001/api/users');
        const freshData = await res.json();
        setUsers(freshData);
    };

    return (
        <div style={{ padding: '20px' }}>
            <h2 style={{ color: 'white' }}>Панель администратора</h2>
<div style={{ marginBottom: '40px', padding: '20px', backgroundColor: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--accent-purple)' }}>
    <h3 style={{ color: 'white', marginTop: 0 }}>➕ Создать новую услугу</h3>
    <form onSubmit={handleCreateService} style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '400px' }}>
        <input 
            type="text" 
            placeholder="Название услуги" 
            value={newService.title} 
            onChange={(e) => setNewService({ ...newService, title: e.target.value })} 
            required 
            style={{ padding: '10px' }}
        />
        <input 
            type="text" 
            placeholder="Время выполнения (например, 12ч)" 
            value={newService.worktime} 
            onChange={(e) => setNewService({ ...newService, worktime: e.target.value })} 
            required 
            style={{ padding: '10px' }}
        />
        <input 
            type="number" 
            placeholder="Цена (руб.)" 
            value={newService.serve_cost} 
            onChange={(e) => setNewService({ ...newService, serve_cost: e.target.value })} 
            required 
            style={{ padding: '10px' }}
        />
        <select 
            value={newService.category_id} 
            onChange={(e) => setNewService({ ...newService, category_id: e.target.value })} 
            style={{ padding: '10px' }}
        >
            <option value="">Без категории</option>
            {categories.map(c => (
                <option key={c.category_id} value={c.category_id}>{c.title}</option>
            ))}
        </select>
        <button type="submit" style={{ padding: '10px', backgroundColor: 'var(--accent-green)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            Создать услугу
        </button>
    </form>
</div>
            <div style={{ 
                padding: '20px', backgroundColor: '#1e2127', borderRadius: '8px', 
                border: '1px solid var(--accent-green)', marginBottom: '30px', 
                display: 'inline-block', minWidth: '300px'
            }}>
                <h3 style={{ margin: '0 0 10px 0', color: 'var(--accent-green)' }}>Общая выручка</h3>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'white' }}>
                    {totalRevenue.toLocaleString('ru-RU')} ₽
                </div>
            </div>

            {/* Блок категорий */}
            <div style={{ marginBottom: '40px', padding: '20px', backgroundColor: 'var(--bg-card)', borderRadius: '8px' }}>
                <h3 style={{ color: 'white', marginTop: 0 }}>Управление категориями</h3>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                    {categories.map(cat => (
                        <li key={cat.category_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', padding: '10px', backgroundColor: '#1e2127', borderRadius: '4px', border: '1px solid #444' }}>
                            <span style={{ color: 'white' }}>{cat.title}</span>
                            <button className="btn-delete" onClick={() => handleDeleteCategory(cat.category_id, cat.title)}>Удалить</button>
                        </li>
                    ))}
                </ul>
                
                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                    <input 
                        value={newCategory} 
                        onChange={(e) => setNewCategory(e.target.value)} 
                        placeholder="Название новой категории" 
                        style={{ flex: 1, padding: '10px' }}
                    />
                    <button className="btn-clear" style={{ width: 'auto', backgroundColor: 'var(--accent-purple)', color: 'white' }} onClick={handleCreateCategory}>
                        Добавить
                    </button>
                </div>

                <h4 style={{ color: 'white', marginTop: '30px' }}>Привязка услуг к категориям:</h4>
                {services.map(s => (
                    <div key={s.service_id} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
                        <span style={{ minWidth: '200px', color: 'white' }}>{s.title}</span>
                        <select 
                            value={s.category_id || ''} 
                            onChange={(e) => handleServiceCategoryChange(s.service_id, e.target.value)}
                            style={{ padding: '8px', width: '200px' }}
                        >
                            <option value="">Без категории</option>
                            {categories.map(c => (
                                <option key={c.category_id} value={c.category_id}>{c.title}</option>
                            ))}
                        </select>
                    </div>
                ))}
            </div>

            {/* Блок скидок на услуги */}
            <div style={{ marginBottom: '40px' }}>
                <h3 style={{ color: 'white' }}>Управление скидками на услуги</h3>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                    {services.map(s => (
                        <li key={s.service_id} style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px', color: 'white' }}>
                            <span style={{ minWidth: '200px' }}>{s.title} (Базовая цена: {s.serve_cost} руб.)</span>
                            <label>Скидка:</label>
                            <input 
                                type="number" 
                                value={s.discount_percent || 0} 
                                onChange={(e) => handleServiceInputChange(s.service_id, e.target.value)}
                                style={{ width: '80px', padding: '5px' }}
                            /> 
                            <span>%</span>
                            <button 
                                className="btn-delete" 
                                style={{ backgroundColor: 'var(--accent-green)' }}
                                onClick={() => handleSaveServiceDiscount(s.service_id, s.discount_percent)}
                            >
                                Сохранить
                            </button>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Блок персональных скидок */}
            <div>
                <h3 style={{ color: 'white' }}>Управление персональными скидками пользователей</h3>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                    {users.map(u => (
                        <li key={u.user_id} style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px', color: 'white' }}>
                            <span style={{ minWidth: '200px' }}>
                                {u.name} <span style={{ fontSize: '12px', color: '#aaa' }}>({u.role})</span>
                            </span>
                            <label>Скидка:</label>
                            <input 
                                type="number" 
                                value={u.discount_percent || 0} 
                                onChange={(e) => handleUserInputChange(u.user_id, e.target.value)}
                                style={{ width: '80px', padding: '5px' }}
                            /> 
                            <span>%</span>
                            <button 
                                className="btn-delete" 
                                style={{ backgroundColor: 'var(--accent-purple)' }}
                                onClick={() => handleSaveUserDiscount(u.user_id, u.discount_percent)}
                            >
                                Сохранить
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}