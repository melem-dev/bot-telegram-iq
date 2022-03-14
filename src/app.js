if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

require("./configs/mongoose");

const _Signals = require("./controllers/signals");
const Events = require("./controllers/events");
const Bot = require("./services/telegram");
const ChatBot = require("./controllers/chatbot");
const Signals = require("./model/signals");
const IqOption = require("./services/iqoption");
const configs = require("./config.json");
const schedules = require("node-schedule");

Events.on("telegram_message", ChatBot);

Events.on("chatbot_message", ({ from, text }) => {
  if (!from) {
    return Bot.sendMessage(configs.admin_id, text);
  }

  Bot.sendMessage(from, text);
});

Events.on("python_message", (data) => {
  console.log(data);

  if (data.toLowerCase().includes("resultado:")) {
    const [resultado, profit] = data.toLowerCase().split("/");

    const [, result, , gale] = resultado.split(" ");
    const [, amount] = profit.split(" ");

    Bot.sendMessage(
      configs.admin_id,
      `Resultado: ${result}, Gale: ${gale}, Profit: ${amount}`,
    );
  }

  if (data.includes("finished")) {
    IqOption.disconnect();
  }
});

Events.on("bot_import_list", async (data) => {
  data.signals.forEach(async (element) => {
    element.day = data.data;
    element.action = element.dir;
    await Signals.create(element);
    _Signals();
  });
});

Events.on("order-close", (data) => {
  Bot.sendMessage(configs.admin_id, JSON.stringify({ data }));
});

Events.on("python_process", ({ text }) => {
  console.log("Executando Python");
  console.log(text);
  IqOption.connect(text);
});

Events.on("signals_schedule", ({ time, text }) => {
  const [day] = new Date().toLocaleString("en-US").split(" ");
  let [hour, minute] = time.split(":");
  hour = minute - 2 < 0 ? (hour - 1 < 0 ? 23 : hour - 1) : hour;
  minute = minute - 2 < 0 ? 58 : minute - 2;
  const scheduleTime = new Date(`${day} ${hour}:${minute}:00`);

  console.log(time, scheduleTime.toLocaleString());
  console.log("Agendado!");

  const job = schedules.scheduleJob(scheduleTime, () => {
    Events.emit("python_process", { text });
  });
});
