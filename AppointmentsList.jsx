import { useEffect, useState } from 'react';
import { getAppointments, deleteAppointment } from '../api/appointments';

export default function AppointmentsList({ user }) {
    const [appointments, setAppointments] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [paymentModal, setPaymentModal] = useState(null);

    const loadAppointments = async () => {
        try {
            setLoading(true);
            const data = await getAppointments(user.user_id);
            setAppointments(data);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAppointments();
    }, []);

    const handleRefresh = () => {
        loadAppointments();
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '20px' }}>Загрузка записей...</div>;
    if (error) return <div style={{ color: 'red', padding: '20px' }}>Ошибка: {error}</div>;

    if (!appointments.length) {
        return (
            <div style={{ textAlign: 'center', padding: '20px' }}>
                <div>Записей не найдено</div>
                <button className="btn-clear" onClick={handleRefresh} style={{ maxWidth: '200px', margin: '10px auto' }}>
                    Обновить
                </button>
            </div>
        );
    }

    const serviceCounts = appointments.reduce((acc, curr) => {
        acc[curr.service_id] = (acc[curr.service_id] || 0) + 1;
        return acc;
    }, {});

    const totalSum = appointments.reduce((acc, curr) => {
        if (curr.status !== 'Оплачено') {
            return acc + (Number(curr.final_price) || 0);
        }
        return acc;
    }, 0);

    return (
        <div className="cart-container">
            

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', marginTop: '20px' }}>
                <h2>Мои записи ({appointments.length})</h2>
                <button className="btn-delete" onClick={handleRefresh} style={{ backgroundColor: '#6c757d' }}>
                    Обновить
                </button>
            </div>

            <div style={{ display: 'grid', gap: '15px' }}>
                {appointments.map(a => (
                    <div key={a.appointments_id} className="service-card" style={{ textAlign: 'left', padding: '20px' }}>
                        <div style={{ fontSize: '20px', color: 'var(--accent-purple)', fontWeight: 'bold', marginBottom: '15px' }}>
                            {a.service_name}
                        </div>

                        <div style={{ marginBottom: '8px' }}><strong>Дата:</strong> {a.appointment_date}</div>
                        <div style={{ marginBottom: '8px' }}><strong>Создано:</strong> {a.created_at}</div>
                        
                        <div style={{ marginBottom: '15px' }}>
                            <strong>Статус:</strong>
                            <span style={{
                                marginLeft: '8px', padding: '4px 8px', borderRadius: '4px',
                                backgroundColor: a.status === 'Оплачено' ? '#155724' : '#721c24',
                                color: 'white'
                            }}>
                                {a.status}
                            </span>
                        </div>

                        <div style={{ marginBottom: '15px', fontSize: '12px', color: '#aaa' }}>
                            Заказано: {serviceCounts[a.service_id]} раз(а)
                        </div>

                        <div style={{ marginBottom: '15px', fontSize: '18px' }}>
                            <strong>Стоимость:</strong>
                            <span style={{ marginLeft: '8px', color: 'var(--accent-green)', fontWeight: 'bold' }}>
                                {a.final_price} руб.
                            </span>
                            {a.base_price !== a.final_price && (
                                <del style={{ marginLeft: '8px', color: '#888', fontSize: '14px' }}>
                                    {a.base_price} руб.
                                </del>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                className="btn-delete"
                                onClick={async () => {
                                    if (window.confirm('Удалить запись?')) {
                                        await deleteAppointment(a.appointments_id);
                                        handleRefresh();
                                    }
                                }}
                            >
                                Удалить
                            </button>

                            {a.status !== 'Оплачено' && (
                                <button
                                    className="btn-delete"
                                    style={{ backgroundColor: 'var(--accent-green)' }}
                                    onClick={() => setPaymentModal(a)}
                                >
                                    Оплатить ({a.final_price} руб.)
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Блок статистики */}
            <div style={{ display: 'flex', gap: '20px', marginTop: '30px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, padding: '20px', backgroundColor: '#1e2127', borderRadius: '8px', border: '1px solid var(--accent-purple)', textAlign: 'center' }}>
                    <div style={{ fontSize: '14px', color: '#aaa' }}>Всего услуг заказано</div>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--accent-purple)' }}>{appointments.length}</div>
                </div>

                <div style={{ flex: 1, padding: '20px', backgroundColor: '#1e2127', borderRadius: '8px', border: '1px solid var(--accent-green)', textAlign: 'center' }}>
                    <div style={{ fontSize: '14px', color: '#aaa' }}>К оплате</div>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--accent-green)' }}>{totalSum.toLocaleString('ru-RU')} ₽</div>
                </div>
            </div>

            {/* Модальное окно оплаты */}
            {paymentModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div style={{ backgroundColor: '#282c34', padding: '30px', borderRadius: '12px', width: '400px', textAlign: 'center', border: '1px solid var(--accent-purple)' }}>
                        <h2>Оплата услуги</h2>
                        <p><strong>{paymentModal.service_name}</strong></p>
                        <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--accent-green)', margin: '20px 0' }}>
                            {paymentModal.final_price} ₽
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px' }}>
                            <button className="btn-delete" onClick={() => setPaymentModal(null)} style={{ backgroundColor: '#6c757d' }}>Отмена</button>
                            <button className="btn-delete" style={{ backgroundColor: 'var(--accent-green)' }} onClick={async () => {
                                await fetch('http://localhost:3001/api/payments', {
                                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ user_id: paymentModal.user_id, service_id: paymentModal.service_id, payment: paymentModal.final_price })
                                });
                                await fetch(`http://localhost:3001/api/appointments/${paymentModal.appointments_id}/status`, {
                                    method: 'PUT', headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ status: 'Оплачено' })
                                });
                                setPaymentModal(null);
                                handleRefresh();
                            }}>Подтвердить</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}