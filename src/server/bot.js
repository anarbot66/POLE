const TelegramBot = require('node-telegram-bot-api');

// Замените на ваш API Token, полученный от BotFather
const bot = new TelegramBot('8117729038:AAF0Ue7su9aYK9-RzTrb1sljHKhj99D5iHI', { polling: true });

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  // Кнопка для открытия вашего мини-приложения
  const inlineKeyboard = {
    inline_keyboard: [
      [
        {
          text: 'Открыть',
          web_app: { url: 'https://pole-cwd8.onrender.com/' }  // Используйте URL вашего развернутого приложения на Render
        }
      ]
    ]
  };

  // Отправка сообщения с кнопкой
  bot.sendMessage(chatId, 'Добро пожаловать в POLE! Твой проводник в статистику формулы-1 прямо в телеграмм!', {
    reply_markup: inlineKeyboard
  });
});
