const TelegramBot = require('node-telegram-bot-api');

// Чтение токена из переменной окружения
const token = process.env.TELEGRAM_BOT_TOKEN;

// Создание экземпляра бота
const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  // Создаем обычную клавиатуру с кнопкой
  const keyboard = {
    keyboard: [
      [
        {
          text: 'Открыть POLE', // Текст кнопки
          web_app: { url: 'https://pole-cwd8.onrender.com/' } // Ссылка на Mini App
        }
      ]
    ],
    resize_keyboard: true,
    one_time_keyboard: false
  };

  bot.sendMessage(chatId, 'Привет я POLE, покажу тебе всю интересную статистику формулы-1!', {
    reply_markup: keyboard
  });
});
