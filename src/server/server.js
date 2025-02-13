const express = require('express');
const { exec } = require('child_process');
const path = require('path');

const app = express();
const port = process.env.PORT || 5000;

// Запуск бота
const startBot = () => {
  exec('node src/server/bot.js', (err, stdout, stderr) => {
    if (err) {
      console.error(`Ошибка запуска бота: ${err}`);
      return;
    }
    console.log(`Бот работает: ${stdout}`);
  });
};

// Запускаем бота сразу при старте сервера
startBot();

// Настроим сервер для обслуживания статического React-приложения
app.use(express.static(path.join(__dirname, 'client/build')));

// Роут для всех остальных страниц (если есть React-роутинг)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

// Запуск сервера
app.listen(port, () => {
  console.log(`Сервер работает на порту ${port}`);
});
