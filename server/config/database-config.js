require('dotenv').config()
const mongoose = require("mongoose");
const CONNECTION_ESTABLISHED = "Database connection established"

module.exports = function initializeDatabase() {
    mongoose.set('strictQuery', true);
    mongoose.connect(process.env.DATABASE_URI, {
        useUnifiedTopology: true,
        useNewUrlParser: true,
    })
        .then(() => console.log(CONNECTION_ESTABLISHED))
        .catch(err => console.log(err))

    mongoose.Promise = global.Promise;

    process.on("SIGINT", cleanup);
    process.on("SIGTERM", cleanup);
    process.on("SIGHUP", cleanup);
};

function cleanup() {
    mongoose.connection.close();
}