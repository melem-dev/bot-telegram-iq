if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const TelegramBot = require("node-telegram-bot-api");
const Services = require("../controllers/events");

const token = process.env.TELEGRAM_TOKEN;
const ADMIN_ID = process.env.ADMIN_ID;

const bot = new TelegramBot(token, { polling: true });

bot.on("message", (msg) => {
  Services.emit("telegram_message", msg);
});

Services.on("chatbot_message", ({ from, text }) => {
  if (!from) {
    return bot.sendMessage(ADMIN_ID, text);
  }

  bot.sendMessage(from, text);
});

module.exports = bot;
