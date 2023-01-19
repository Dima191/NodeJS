const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const path = require('path');


const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');
const AppError = require('./utils/appError');
const errorController = require('./controllers/errorController');

const app = express()

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'))


//MIDDLEWARES
app.use(express.static(path.join(__dirname, 'public')));
//SET SECURITY HTTP HEADERS
// app.use(helmet());
app.use(helmet());
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: ["'self'"],
            baseUri: ["'self'"],
            fontSrc: ["'self'", 'https:', 'data:'],
            scriptSrc: ["'self'", 'https://cdnjs.cloudflare.com/ajax/libs/axios/1.2.3/axios.min.js'],
            objectSrc: ["'none'"],
            styleSrc: ["'self'", 'https:', 'unsafe-inline'],
            upgradeInsecureRequests: [],
        },
    })
);
if (process.env.NODE_ENV === 'development')
    app.use(morgan('dev'));

const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: "To many request from this IP. Please, try again in an hour "
});

app.use('/api', limiter);

app.use(express.json({
    limit: '10kb'
}));

//Data sanitization against NoSQL query injections
app.use(mongoSanitize());

//Data sanitization against XSS
app.use(xss());

//Prevent parameter pollution
app.use(hpp({
    whitelist: ['duration', 'ratingsQuantity', 'ratingsAverage', 'maxGroupSize', 'difficulty', 'price']
}));

//ROUTES

app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

app.all('*', (req, res, next) => {
    next(new AppError(`Couldn't find ${req.originalUrl}`, 404));
})

app.use(errorController.errController);

module.exports = app;
