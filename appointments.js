const API_URL = 'http://localhost:3001/api/appointments';


export async function getAppointments(userId) {
    const url = userId ? `${API_URL}?user_id=${userId}` : API_URL;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Ошибка при получении записей');
    return await response.json();
}


export async function getAppointmentById(id) {
  const response = await fetch(`${API_URL}/${id}`);
  if (!response.ok) throw new Error('Ошибка при получении записи');
  return await response.json();
}

// Создать новую запись
export async function createAppointment(appointment) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(appointment),
  });
  if (!response.ok) throw new Error('Ошибка при создании записи');
  return await response.json();
}

// Обновить запись
export async function updateAppointment(id, appointment) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(appointment),
  });
  if (!response.ok) throw new Error('Ошибка при обновлении записи');
}

// Удалить запись
export async function deleteAppointment(id) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Ошибка при удалении записи');
}