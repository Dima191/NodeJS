const express = require("express");

const authenticationController = require('./../controllers/authenticationController');
const userController = require('./../controllers/userController');

const router = express.Router();

router.post('/signup', authenticationController.signup);
router.post('/login', authenticationController.login);
router.post('/forgotPassword', authenticationController.forgotPassword);
router.patch('/resetPassword/:token', authenticationController.resetPassword);

router.use(authenticationController.protect);

router.get('/me', userController.getMe, userController.getUser)

router.patch('/updateMe', userController.updateMe);

router.delete('/deleteMe', userController.deleteMe);

router.patch('/updateMyPassword', authenticationController.updatePassword);


router.use(authenticationController.restrictTo('admin'))
router
    .route('/')
    .get(userController.getAllUsers)
// .post(userController.createUser)

router
    .route('/:id')
    .get(userController.getUser)
    // .post(userController.createUser)
    .patch(userController.updateUser)
    .delete(userController.deleteUser)

module.exports = router;