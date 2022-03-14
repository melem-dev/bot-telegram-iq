const mongodb = require("mongoose");
const Events = require('../controllers/events')

const URI = `mongodb+srv://${process.env.DATABASE_USER}:${process.env.DATABASE_PWD}@cluster0.q36io.mongodb.net/gerinfo?retryWrites=true&w=majority`;

mongodb.connect(
  URI,
  { useNewUrlParser: true, useUnifiedTopology: true },
  (err) => {
    if (err) {
      throw err;
    }
    Events.emit('database_connected')
    console.log("Mongodb Connected!");
  }
);

module.exports = mongodb;
