const express = require('express');

const tourController = require('./../controllers/tourController');
const reviewController = require('./../controllers/reviewController');
const authenticationController = require('../controllers/authenticationController');
const reviewRouter = require('./../routes/reviewRoutes');

router = express.Router();

router.use('/:tourId/reviews', reviewRouter);

router
    .route('/monthly-plan/:year')
    .get(authenticationController.protect, authenticationController.restrictTo('admin', 'lead-guide', 'guide'), tourController.getMonthlyPlan)

router
    .route('/tour-stats')
    .get(tourController.getTourStats)

router
    .route('/top-5-cheap')
    .get(tourController.topTours, tourController.getAllTours);

router
    .route('/distances/:latlng/unit/:unit')
    .get(tourController.getDistances)

router
    .route('/tour-within/:distance/center/:latlng/unit/:unit')
    .get(tourController.getToursWithin)

router
    .route('/')
    .get(tourController.getAllTours)
    .post(authenticationController.protect, authenticationController.restrictTo('admin', 'lead-guide'), tourController.createTour)

router
    .route('/:id')
    .get(tourController.getTour)
    .delete(authenticationController.protect, authenticationController.restrictTo('admin', 'lead-guide'), tourController.deleteTour)
    .patch(authenticationController.protect, authenticationController.restrictTo('admin', 'lead-guide'), tourController.updateTour)

module.exports = router;