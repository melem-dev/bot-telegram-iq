const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const Events = require("../controllers/events");

let pid;

function connect(json) {
  const pathFile = path.resolve(path.dirname(""), "src", "process", "index.py");

  const ls = spawn("python3.10", [pathFile, json]);

  pid = ls.pid;

  console.log(pid)

  ls.stdout.on("data", (data) => {
    const msg = data.toString();

    Events.emit("python_message", msg);
  });

  ls.stderr.on("data", (data) => {
    console.log(data.toString());
  });
}

function disconnect(json) {
  process.kill(pid);
}

module.exports = {
  connect,
  disconnect,
};
