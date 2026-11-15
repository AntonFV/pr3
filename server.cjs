const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Pool } = require('pg');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());


const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});


pool.on('connect', () => {
    console.log('Подключение к PostgreSQL установлено');
});

pool.on('error', (err) => {
    console.error('Ошибка подключения к PostgreSQL:', err);
});


app.get('/api/test', (req, res) => {
    res.json({ message: 'API работает!', timestamp: new Date() });
});
app.get('/api/users', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT u.user_id, u.name, u.discount_percent, r.hisrole as role 
            FROM users u
            JOIN roles r ON u.role_id = r.role_id
            ORDER BY u.user_id
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Ошибка при получении пользователей:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/test-db', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW() as current_time');
        res.json({ 
            message: 'Подключение к БД работает!',
            current_time: result.rows[0].current_time
        });
    } catch (error) {
        console.error('Ошибка теста БД:', error);
        res.status(500).json({ error: error.message });
    }
});


app.get('/api/appointments/simple', async (req, res) => {
    try {
        console.log('Запрос к appointments...');
        const result = await pool.query('SELECT * FROM appointments LIMIT 5');
        console.log(`Найдено записей: ${result.rows.length}`);
        res.json(result.rows);
    } catch (error) {
        console.error('Ошибка запроса appointments:', error);
        res.status(500).json({ error: error.message });
    }
});
app.delete('/api/appointments/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM appointments WHERE appointments_id = $1', [id]);
        res.status(200).json({ message: 'Удалено' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/appointments', async (req, res) => {
    try {
        const { user_id } = req.query;
        
        
        let query = `
            SELECT 
                a.appointments_id,
                a.user_id,
                a.service_id,
                TO_CHAR(a.appointment_date, 'DD.MM.YYYY') as appointment_date,
                TO_CHAR(a.appointment_time, 'HH24:MI') as appointment_time,
                a.status,
                a.notes,
                TO_CHAR(a.created_at, 'DD.MM.YYYY HH24:MI') as created_at,
                s.title as service_name,
                s.serve_cost as base_price,
                s.discount_percent as service_discount,
                u.discount_percent as user_discount,
                -- Считаем итоговую цену: базовая * (1 - скидка услуги/100) * (1 - скидка юзера/100)
                ROUND(s.serve_cost * (1 - s.discount_percent / 100.0) * (1 - u.discount_percent / 100.0)) as final_price
            FROM appointments a
            JOIN services s ON a.service_id = s.service_id
            JOIN users u ON a.user_id = u.user_id
        `;
        
        let params = [];

        if (user_id) {
            query += ` WHERE a.user_id = $1`;
            params = [user_id];
        }

        query += ` ORDER BY a.appointment_date DESC, a.appointment_time DESC`;

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Ошибка при получении записей:', error);
        res.status(500).json({ error: error.message });
    }
});
app.post('/api/services', async (req, res) => {
    try {
        const { title, worktime, serve_cost, category_id } = req.body;
        
        const result = await pool.query(
            `INSERT INTO services (title, worktime, serve_cost, category_id) 
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [title, worktime, serve_cost, category_id || null]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Ошибка при создании услуги:', error);
        res.status(500).json({ error: error.message });
    }
});
app.get('/api/services', async (req, res) => {
    try {
        const query = `
            SELECT 
                s.service_id, 
                s.title, 
                s.worktime, 
                s.serve_cost, 
                s.discount_percent,
                s.category_id,
                c.title as category_name,  -- <--- Добавляем название категории
                COUNT(a.appointments_id) as order_count
            FROM services s
            LEFT JOIN appointments a ON s.service_id = a.service_id
            LEFT JOIN categories c ON s.category_id = c.category_id  -- <--- Джойним категории
            GROUP BY s.service_id, s.title, s.worktime, s.serve_cost, s.discount_percent, s.category_id, c.title
            ORDER BY s.service_id
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Ошибка при получении услуг:', error);
        res.status(500).json({ error: error.message });
    }
});
app.get('/api/payments/stats', async (req, res) => {
    try {
        const result = await pool.query('SELECT SUM(payment) as total_revenue FROM payments');
        const total = result.rows[0].total_revenue || 0;
        res.json({ total_revenue: parseInt(total) });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.post('/api/appointments', async (req, res) => {
    try {
        const { user_id, service_id, appointment_date, appointment_time, status, notes } = req.body;
        
        const result = await pool.query(
            `INSERT INTO appointments (user_id, service_id, appointment_date, appointment_time, status, notes, created_at) 
             VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *`,
            [user_id, service_id, appointment_date, appointment_time, status, notes]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Ошибка при создании записи:', error);
        res.status(500).json({ error: error.message });
    }
});
app.post('/api/register', async (req, res) => {
    try {
        const { name, password } = req.body;
        
        const userCheck = await pool.query('SELECT * FROM users WHERE name = $1', [name]);
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ error: 'Пользователь с таким именем уже существует' });
        }

        const result = await pool.query(
            `INSERT INTO users (name, password, role_id) 
             VALUES ($1, $2, (SELECT role_id FROM roles WHERE hisrole = 'Клиент' LIMIT 1)) 
             RETURNING user_id, name`,
            [name, password]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка сервера при регистрации' });
    }
});


app.post('/api/login', async (req, res) => {
    try {
        const { name, password } = req.body;
        const result = await pool.query(`
            SELECT u.user_id, u.name, u.discount_percent, r.hisrole as role 
            FROM users u
            JOIN roles r ON u.role_id = r.role_id
            WHERE u.name = $1 AND u.password = $2
        `, [name, password]);
        
        if (result.rows.length === 0) return res.status(401).json({ error: 'Неверное имя или пароль' });
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});
app.post('/api/payments', async (req, res) => {
    try {
        const { user_id, service_id, payment } = req.body;
        
        // Добавляем запись в таблицу payments
        await pool.query(
            'INSERT INTO payments (user_id, service_id, payment) VALUES ($1, $2, $3)',
            [user_id, service_id, payment]
        );
        
        res.status(201).json({ message: 'Оплата прошла успешно' });
    } catch (error) {
        console.error('Ошибка при создании платежа:', error);
        res.status(500).json({ error: error.message });
    }
});
app.put('/api/users/:id/discount', async (req, res) => {
    try {
        const { id } = req.params;
        const { discount_percent } = req.body;
        await pool.query('UPDATE users SET discount_percent = $1 WHERE user_id = $2', [discount_percent, id]);
        res.json({ message: 'OK' });
    } catch (error) {
        console.error('Ошибка при обновлении скидки пользователя:', error);
        res.status(500).json({ error: error.message });
    }
});
app.put('/api/services/:id/discount', async (req, res) => {
    try {
        const { id } = req.params;
        const { discount_percent } = req.body;
        await pool.query('UPDATE services SET discount_percent = $1 WHERE service_id = $2', [discount_percent, id]);
        res.json({ message: 'OK' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.put('/api/appointments/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        await pool.query('UPDATE appointments SET status = $1 WHERE appointments_id = $2', [status, id]);
        res.json({ message: 'Статус обновлен' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.get('/api/categories', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM categories ORDER BY category_id');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/categories', async (req, res) => {
    try {
        const { title } = req.body;
        const result = await pool.query('INSERT INTO categories (title) VALUES ($1) RETURNING *', [title]);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/services/:id/category', async (req, res) => {
    try {
        const { id } = req.params;
        const { category_id } = req.body;
        await pool.query('UPDATE services SET category_id = $1 WHERE service_id = $2', [category_id, id]);
        res.json({ message: 'OK' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.delete('/api/categories/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        await pool.query('UPDATE services SET category_id = NULL WHERE category_id = $1', [id]);
        
        await pool.query('DELETE FROM categories WHERE category_id = $1', [id]);
        
        res.status(200).json({ message: 'Категория удалена' });
    } catch (error) {
        console.error('Ошибка при удалении категории:', error);
        res.status(500).json({ error: error.message });
    }
});
app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
    console.log('Тестовые endpoints:');
    console.log(`1) http://localhost:${PORT}/api/test`);
    console.log(`2) http://localhost:${PORT}/api/test-db`);
    console.log(`3) http://localhost:${PORT}/api/appointments/simple`);
    console.log(`4) http://localhost:${PORT}/api/appointments`);
});