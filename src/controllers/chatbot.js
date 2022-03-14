const Ev = require("./events");
const templates = require("../templates/chatbot.json");
const configs = require("../config.json");
const Signals = require("../model/signals");

const sort_by_time = (a, b) => {
  const [AHour, AMinute] = a.time.split(":").map((el) => parseInt(el));
  const [BHour, BMinute] = b.time.split(":").map((el) => parseInt(el));

  if (AHour > BHour) return 1;

  if (AHour < BHour) return -1;

  if (AMinute > BMinute) return 1;

  if (AMinute < BMinute) return -1;

  return 0;
};

module.exports = async (message) => {
  const from = message.chat.id;
  const send = (text) => Ev.emit("chatbot_message", { from, text });

  const msg = message.text.toString();

  if (msg.startsWith("!perfil")) {
    send(templates["!perfil"]);
    send(templates.hints.comandos);
    return;
  }

  if (msg.startsWith("!comandos")) {
    let sendMessage = "COMANDOS DISPONÍVEIS\n\n\n";

    for (let comando in templates) {
      if (comando.startsWith("!")) {
        sendMessage += comando + "\n";
      }
    }

    send(sendMessage);
  }

  if (msg.startsWith("!conectar")) {
  }

  if (msg.startsWith("!importar")) {
    const listConfigs = {
      tf: "",
      data: "",
      cb: "Sinais importados\n\n",
      signals: [],
    };

    if (from == configs.admin_id) {
      // Capturando timeframe
      if (msg.includes("M5")) listConfigs.tf = 5;
      else if (msg.includes("M15")) listConfigs.tf = 15;
      else listConfigs.tf = null;

      // transformando em linhas
      const lines = msg.split("\n");
      lines.forEach((element) => {
        // Capturando data
        if (element.includes("Sinais")) {
          const [, data] = element.split(" ");
          listConfigs.data = data;
        }

        // Capturando sinais
        if (element.includes("PUT") || element.includes("CALL")) {
          let [time, par, dir] = element.split(" ");

          dir = dir.includes("PUT") ? "PUT" : "CALL";

          listConfigs.signals.push({
            time,
            timeframe: listConfigs.tf,
            par,
            dir,
          });
          listConfigs.cb += `Par: ${par}, Hora: ${time}, TF: ${listConfigs.tf}, Op: ${dir}.\n`;
        }
      });

      send(listConfigs.cb);

      delete listConfigs.cb;
      delete listConfigs.tf;

      Ev.emit("bot_import_list", listConfigs);
    }
  }

  if (msg.startsWith("!lista")) {
    const data = new Date().toLocaleString("pt-br").split(" ")[0];
    let filter = (msg.split("!lista ")[1] || data).split("/");
    filter = `${filter[0]}/${filter[1]}/2022`;

    let sendMsg = "Lista de sinais: " + filter + "\n\n\n";

    Signals.find({ day: filter }).then((data) => {
      if (data.length === 0) {
        return send("Nenhum sinal cadastrado para esse dia!");
      }

      data.sort(sort_by_time).forEach((el) => {
        sendMsg += `${el.par}, ${el.time}, ${el.timeframe}, ${el.action}\n`;
      });

      return send(sendMsg);
    });
  }

  if (msg.startsWith("!deletar")){
    if (from == configs.admin_id){
      await Signals.deleteMany()
      return send('Deletado com sucesso!')
    }
  }
};
