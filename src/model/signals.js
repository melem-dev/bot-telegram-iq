const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    par: String,
    time: String,
    day: String,
    timeframe: String,
    action: String,
  },
  { timestamp: true }
);

module.exports = mongoose.model("gerinfo-signals", schema);
