const API_URL = 'http://localhost:3001/api/services';

export async function getServices() {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error('Ошибка при получении услуг');
    return await response.json();
}
export async function createService(serviceData) {
    const response = await fetch('http://localhost:3001/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serviceData),
    });
    if (!response.ok) throw new Error('Ошибка при создании услуги');
    return await response.json();
}