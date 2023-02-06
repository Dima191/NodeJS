const express = require('express');

const viewController = require('./../controllers/viewController');
const authenticationController = require('./../controllers/authenticationController');
const bookingController = require('./../controllers/bookingController');

const router = express.Router();

router.get('/login', viewController.getLoginForm)

router.use(authenticationController.isLoggedIn);

router.get('/', bookingController.createBookingCheckout, viewController.getOverview)

router.get('/tour/:slug', viewController.getTour)

router.get('/me', authenticationController.protect, viewController.getAccount);

router.post('/submit-user-data', authenticationController.protect, viewController.updateUserData);

router.get('/my-tours', authenticationController.protect, viewController.getMyTours)

module.exports = router;