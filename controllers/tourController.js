const Tour = require('./../model/tourModel');
const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFactory');
const AppError = require('./../utils/appError');
const multer = require('multer');
const sharp = require('sharp');

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true)
    } else cb(new AppError('Not an image. Please upload only images', 400), false)
}

const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter
});

exports.uploadTourImages = upload.fields([
    {name: 'imageCover', maxCount: 1},
    {name: 'images', maxCount: 3}
]);

exports.resizeTourImages = catchAsync(async (req, res, next) => {
    if (!req.files.imageCover || !req.files.images) return next();
    req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
    await sharp(req.files.imageCover[0].buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({quality: 90})
        .toFile(`public/img/tours/${req.body.imageCover}`);

    req.body.images = [];
    await Promise.all(req.files.images.map(async (file, index) => {
        const fileName = `tour-${req.params.id}-${Date.now()}-${index + 1}.jpeg`;
        await sharp(file.buffer)
            .resize(2000, 1333)
            .toFormat('jpeg')
            .jpeg({quality: 90})
            .toFile(`public/img/tours/${fileName}`);
        req.body.images.push(fileName);
    }))
    next();
})

exports.getAllTours = factory.getAll(Tour);

exports.getTour = factory.getOne(Tour, {path: 'reviews'});

exports.createTour = factory.createOne(Tour);

exports.updateTour = factory.updateOne(Tour);

exports.deleteTour = factory.deleteOne(Tour);

exports.topTours = async (req, res, next) => {
    req.query.sort = '-ratingsAverage,price';
    req.query.limit = '5';
    req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
    next();
}

exports.getTourStats = catchAsync(async (req, res, next) => {
    const stats = await Tour.aggregate([
        {
            $match: {ratingsAverage: {$gte: 4.5}},
        },
        {
            $group: {
                _id: {$toUpper: '$difficulty'},
                numRatings: {$sum: '$ratingsQuantity'},
                numTours: {$sum: 1},
                avgRating: {$avg: '$ratingsAverage'},
                avgPrice: {$avg: '$price'},
                minPrice: {$min: '$price'},
                maxPPrice: {$max: '$price'},
                nameTours: {$push: '$name'}
            }
        },
        {
            $sort: {avgPrice: 1}
        }
    ])

    res
        .status(200)
        .json({
            status: 'success',
            data: {
                stats
            }
        })
})

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
    const year = req.params.year * 1;

    const plan = await Tour.aggregate([
        {
            $match: {
                startDates: {
                    $gte: new Date(`${year}-01-01`),
                    $lt: new Date(`${year + 1}-01-01`)
                }
            }
        },
        {
            $unwind: '$startDates'
        },
        {
            $group: {
                _id: {$month: '$startDates'},
                numTours: {$sum: 1},
                nameTours: {$push: '$name'}
            }
        },
        {
            $sort: {numTours: -1}
        },
        {
            $addFields: {month: '$_id'}
        },
        {
            $project: {
                _id: 0
            }
        }
    ])

    res
        .status(200)
        .json({
            status: 'success',
            data: {
                plan
            }
        })
})

exports.getToursWithin = catchAsync(async (req, res, next) => {
    const {distance, latlng, unit} = req.params;
    const [lat, lng] = latlng.split(',');
    console.log(distance, latlng, unit, lat, lng);
    if (!lat || !lng) return next(new AppError('Please provide latitude and longitude in the format lat,lng', 400));

    const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;
    const tours = await Tour.find({startLocation: {$geoWithin: {$centerSphere: [[lng, lat], radius]}}});

    res
        .status(200)
        .json({
            status: "success",
            results: tours.length,
            data: {
                data: tours
            }
        })
})

exports.getDistances = catchAsync(async (req, res, next) => {
    const {latlng, unit} = req.params;
    const [lat, lng] = latlng.split(',');

    const multiplier = unit === 'mi' ? 0.00061371 : 0.001;

    if (!lat || !lng) return next(new AppError('Please provide latitude and longitude in the format lat,lng', 400));
    const distances = await Tour.aggregate([
        {
            $geoNear: {
                near: {
                    type: 'Point',
                    coordinates: [lng * 1, lat * 1]
                },
                distanceField: 'distance',
                distanceMultiplier: multiplier
            }
        },
        {
            $project: {
                distance: 1,
                name: 1
            }
        }
    ])
    res
        .status(200)
        .json({
            status: "success",
            data: {
                data: distances
            }
        })
})
