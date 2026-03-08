const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 3000;

// Подключение к базе
const db = new sqlite3.Database('./database.sqlite', (err) => {
  if (err) console.error(err.message);
  else console.log('Connected to SQLite database.');
});

// Создаем таблицу, если её нет
db.run(`CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  contact TEXT,
  date TEXT,
  time TEXT,
  comment TEXT
)`);

// Настройка сервера
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Получение всех заявок
app.get('/api/bookings', (req, res) => {
  db.all('SELECT * FROM bookings ORDER BY date, time', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Добавление новой заявки
app.post('/api/bookings', (req, res) => {
  const { name, contact, date, time, comment } = req.body;
  db.run(
    'INSERT INTO bookings (name, contact, date, time, comment) VALUES (?, ?, ?, ?, ?)',
    [name, contact, date, time, comment],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});