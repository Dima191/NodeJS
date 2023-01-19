const fs = require('fs');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Tour = require('./model/tourModel');
const User = require('./model/userModel');
const Review = require('./model/reviewModel');

dotenv.config({path: './config.env'});

const DB = process.env.DATABASE.replace('<password>', process.env.DATABASE_PASSWORD);

const tours = JSON.parse(fs.readFileSync('./dev-data/data/tours.json'));
const users = JSON.parse(fs.readFileSync('./dev-data/data/users.json'));
const reviews = JSON.parse(fs.readFileSync('./dev-data/data/reviews.json'));

mongoose.connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
});

const loadData = async () => {
    try {
        await Tour.create(tours, {validateBeforeSave: false});
        await User.create(users, {validateBeforeSave: false});
        await Review.create(reviews, {validateBeforeSave: false});
    } catch (err) {
        console.log(err);
    }
}

const deleteData = async () => {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
}

loadData();
// deleteData();