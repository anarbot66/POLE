const TelegramBot = require('node-telegram-bot-api');

const bot = new TelegramBot('8117729038:AAF0Ue7su9aYK9-RzTrb1sljHKhj99D5iHI', { polling: true });

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  const inlineKeyboard = {
    inline_keyboard: [
      [
        {
          text: 'Открыть',
          web_app: { url: 'https://pole-cwd8.onrender.com/' }
        }
      ]
    ]
  };

  bot.sendMessage(chatId, 'Добро пожаловать в POLE! Твой проводник в статистику формулы-1 прямо в телеграмм!', {
    reply_markup: inlineKeyboard
  });
});
