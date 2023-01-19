const Tour = require('./../model/tourModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

exports.getOverview = catchAsync(async (req, res, next) => {
    const tours = await Tour.find();
    res
        .status(200)
        .render('overview', {
            title: 'All Tours',
            tours
        })
})

exports.getTour = catchAsync(async (req, res, next) => {
    const tour = await Tour.findOne({slug: req.params.slug}).populate({
        path: 'reviews',
        select: 'review rating user'
    });
    if (!tour)
        return next(new AppError('No such tour', 400));

    res
        .status(200)
        .render('tour', {
            title: `${tour.name} Tour`,
            tour
        })
})

// exports.getLoginForm = (req, res) => {
//     res
//         .status(200)
//         .render('login', {
//             title: 'Log into your account'
//         })
// }

exports.getLoginForm = (req, res) => {
    res
        .status(200)
        .set(
            'Content-Security-Policy',
            "connect-src 'self' https://cdnjs.cloudflare.com"
        )
        .render('login', {
            title: 'User Login',
        });
};