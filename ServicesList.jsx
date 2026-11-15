import { useEffect, useState } from 'react';
import { getServices } from '../api/services';
import { createAppointment } from '../api/appointments';

export default function ServicesList({ onAdded, user }) {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);

    useEffect(() => {
        fetch('http://localhost:3001/api/categories')
            .then(res => res.json())
            .then(data => setCategories(data))
            .catch(err => console.error("Ошибка категорий", err));
    }, []);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await getServices();
                setServices(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const handleBook = async (service) => {
        if (!user) {
            alert('Пожалуйста, войдите в систему');
            return;
        }

        const appointmentData = {
            user_id: user.user_id, 
            service_id: service.service_id,
            appointment_date: new Date().toISOString().split('T')[0], 
            appointment_time: '12:00:00',
            status: 'Ожидает',
            notes: `Запись на услугу: ${service.title}`
        };

        try {
            await createAppointment(appointmentData);
            alert('Услуга успешно добавлена в записи!');
            if (onAdded) onAdded(); 
        } catch (err) {
            alert('Ошибка: ' + err.message);
        }
    };

    if (loading) return <div>Загрузка услуг...</div>;
    if (error) return <div style={{ color: 'red' }}>Ошибка: {error}</div>;

    const filteredServices = selectedCategory
        ? services.filter(s => s.category_id === selectedCategory)
        : services;

    return (
        <div style={{ display: 'flex' }}>
            {/* Боковая панель */}
            <div className="sidebar">
                <h3>Категории</h3>
                <ul>
                    <li 
                        className={selectedCategory === null ? 'active' : ''}
                        onClick={() => setSelectedCategory(null)}
                    >
                        Все услуги
                    </li>
                    {categories.map(cat => (
                        <li 
                            key={cat.category_id}
                            className={selectedCategory === cat.category_id ? 'active' : ''}
                            onClick={() => setSelectedCategory(cat.category_id)}
                        >
                            {cat.title}
                        </li>
                    ))}
                </ul>
            </div>

            {/* Каталог */}
            <div style={{ flex: 1, padding: '20px' }}>
                <h2 style={{ textAlign: 'center' }}>Каталог услуг</h2>
                <div className="services-grid">
                    {filteredServices.map(service => {
                        const userDiscount = user?.discount_percent || 0;
                        const serviceDiscount = service.discount_percent || 0;
                        const finalPrice = service.serve_cost * (1 - serviceDiscount / 100) * (1 - userDiscount / 100);

                        return (
                            <div key={service.service_id} className="service-card">
                                <h3>{service.title}</h3>
                                {service.category_name && (
                                    <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '10px' }}>
                                        {service.category_name}
                                    </div>
                                )}
                                <p><strong>Время:</strong> {service.worktime}</p>
                                
                                <div className="service-price">
                                    {Math.round(finalPrice)} руб.
                                    {serviceDiscount > 0 && (
                                        <del style={{ fontSize: '14px', color: '#888', marginLeft: '10px' }}>
                                            {service.serve_cost}
                                        </del>
                                    )}
                                </div>

                                <button onClick={() => handleBook(service)}>
                                    Записаться
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}