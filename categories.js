const API_URL = 'http://localhost:3001/api/categories';

export async function getCategories() {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error('Ошибка при получении категорий');
    return await response.json();
}

export async function createCategory(title) {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
    });
    if (!response.ok) throw new Error('Ошибка при создании категории');
    return await response.json();
}