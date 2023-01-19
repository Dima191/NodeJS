const dotenv = require('dotenv');
const mongoose = require('mongoose');
dotenv.config({path: './config.env'});

process.on('uncaughtException', err => {
    console.log(err.name, err.message);
    console.log('uncaught Exception'.toUpperCase())
    process.exit(1);
})

const DB = process.env.DATABASE.replace('<password>', process.env.DATABASE_PASSWORD);

mongoose.connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
}).then(connection => {
    // console.log(connection.connections);
    console.log('DB connection successful');
});

const app = require('./app');

//START SERVER
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
    console.log(`App running on port ${port}...`);
})

process.on('unhandledRejection', err => {
    console.log(err.name, err.message);
    console.log('unhandled Rejection'.toUpperCase())
    server.close(() => {
        process.exit(1);
    });
})


