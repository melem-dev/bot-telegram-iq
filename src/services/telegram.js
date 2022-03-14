if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const TelegramBot = require("node-telegram-bot-api");
const Services = require("../controllers/events");


const token = process.env.TELEGRAM_TOKEN;

const bot = new TelegramBot(token, { polling: true });

bot.on("message", (msg) => {
  Services.emit("telegram_message", msg);
});

module.exports = bot;
