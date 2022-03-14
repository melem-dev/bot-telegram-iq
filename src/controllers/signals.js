const Signals = require("../model/signals");
const Ev = require("./events");

// const Ev = require("./events");
const SECONDS_TO_POLLING = 5;
let lastHour = new Date().getHours();
let isVerified = false;

const date_format_string = (number) => number.toString().padStart(2, "0");
const string_format_date = (date) => date.split(":").map((el) => parseInt(el));
const sort_by_time = (a, b) => {
  const [AHour, AMinute] = a.time.split(":").map((el) => parseInt(el));
  const [BHour, BMinute] = b.time.split(":").map((el) => parseInt(el));

  if (AHour > BHour) return 1;

  if (AHour < BHour) return -1;

  if (AMinute > BMinute) return 1;

  if (AMinute < BMinute) return -1;

  return 0;
};

const run = async () => {
  const actualDate = new Date();
  
  // Filtro para rodar somente 1 vez por hora
  if (lastHour === actualDate.getHours() && isVerified) {
    return;
  }
  
  // Atualiza os valores toda vez que rodar
  lastHour = actualDate.getHours();
  lastMinute = actualDate.getMinutes();
  isVerified = true;
  
  // Captura os sinais do dia
  const [day] = actualDate.toLocaleString("pt-br").split(" ");
  const signals = await Signals.find({ day });
  
  // Filtrar sinais válidos
  const validSignals = [];
  for (let signal of signals.sort(sort_by_time)) {
    const [hour, minute] = string_format_date(signal.time);

    if (hour < lastHour || (hour === lastHour && minute < lastMinute)) {
      continue;
    }


    if (validSignals.length === 0) {
      if (hour > lastHour) break;

      const { par, time, timeframe, action } = signal;
      validSignals.push({ par: par.split('/').join(''), time, timeframe, action });
      continue;
    }

    const lastSignal = validSignals[validSignals.length - 1];

    const [hourLastSignal, minutesLastSignal] = string_format_date(
      lastSignal.time,
    );

    const diff = hour * 60 + minute - (hourLastSignal * 60 + minutesLastSignal);

    if (diff > 60) {
      break;
    } else {
      const { par, time, timeframe, action } = signal;
      validSignals.push({ par: par.split('/').join(''), time, timeframe, action });
    }
  }

  // Enviar para o usuário as oportunidades
  // Agendar processo em Python
  if (validSignals.length > 0) {
    let sendMessage = `Próximas oportunidades ${day} \n\n`;

    for (let { par, time, timeframe, action } of validSignals) {
      sendMessage += `PAR: ${par.split('/').join('')}, HORA: ${time}, TF: ${timeframe}, OP: ${action}\n`;
    }

    Ev.emit("chatbot_message", { text: sendMessage });

    Ev.emit("signals_schedule", {
      time: validSignals[0].time,
      text: JSON.stringify(validSignals),
    });
  }
};


Ev.on('database_connected', () => {
  run()
})

setInterval(run, SECONDS_TO_POLLING * 1000);

const exec = () => {
  isVerified = false;
};

module.exports = exec;
