const jwt = require('jsonwebtoken');
const {promisify} = require('util');
const crypto = require('crypto');

const User = require('./../model/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const Email = require('./../utils/email');

const signToken = id => jwt.sign({id}, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
})

const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);

    const cookieOptions = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
        httpOnly: true
    }

    if (process.env.NODE_ENV === "production")
        cookieOptions.secure = true;

    res.cookie('jwt', token, cookieOptions);

    res
        .status(statusCode)
        .json({
            status: "success",
            token
        })
}

exports.signup = catchAsync(async (req, res, next) => {
    const user = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm
    });
    const url = `${req.protocol}://${req.get('host')}/me`;
    console.log(url);
    await new Email(user, url).sendWelcome();

    createSendToken(user, 201, res);
})

exports.login = catchAsync(async (req, res, next) => {
    const {email, password} = req.body;

    if (!email || !password) return next(new AppError('Please provide your email and password', 400));

    const user = await User.findOne({email}).select('+password');

    if (!user || !(await user.comparePassword(password, user.password))) return next(new AppError('Invalid email or password', 400));

    createSendToken(user, 200, res);
})

exports.protect = catchAsync(async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer'))
        token = req.headers.authorization.split(' ')[1];
    else if (req.cookies.jwt) token = req.cookies.jwt;
    if (!token) return next(new AppError('Please, login', 401));
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);

    if (!user) return next(new AppError('The user belonging to this token does no longer exist', 401));

    if (user.changedPasswordAfter(decoded.iat))
        return next(new AppError('Password was changed. Please, login again', 401));
    req.user = user;
    next();

})

exports.restrictTo = function (...roles) {
    return catchAsync(async (req, res, next) => {
        if (!roles.includes(req.user.role))
            return next(new AppError('You have do not have permission to perform this action', 403))
        next();
    })
}

exports.forgotPassword = catchAsync(async (req, res, next) => {
    if (!req.body.email) return next(new AppError('Provide your email', 401));
    const user = await User.findOne({email: req.body.email});
    if (!user)
        return next(new AppError('There is no user with this email', 404));

    const resetToken = user.createPasswordResetToken();
    await user.save({validateBeforeSave: false});

    //resetPassword
    try {
        const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
        await new Email(user, resetURL).sendPasswordReset();
        res
            .status(200)
            .json({
                status: "success",
                message: "Token sent to email"
            })
    } catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        return next(new AppError('There was an error sending the email. Try again later', 500));
    }
})

exports.resetPassword = catchAsync(async (req, res, next) => {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({passwordResetToken: hashedToken, passwordResetExpires: {$gte: Date.now()}});

    if (!user) return next(new AppError('Token is invalid or has expired', 400));

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    createSendToken(user, 200, res);
})

exports.updatePassword = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.user._id).select("+password");

    if (!req.body.password) return next(new AppError('Provide your password', 401));
    if (!(await user.comparePassword(req.body.passwordCurrent, user.password))) return next(new AppError('Your current password is wrong', 401));

    if (!req.body.password || !req.body.passwordConfirm) return next(new AppError('Create new password', 400))

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;

    await user.save();

    createSendToken(user, 200, res);

})

exports.isLoggedIn = async (req, res, next) => {
    try {
        let token;
        if (req.cookies.jwt)
            token = req.cookies.jwt;
        if (!token) return next();

        const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id);

        if (!user) return next();
        if (user.changedPasswordAfter(decoded.iat))
            return next(new AppError('Password was changed. Please, login again', 401));

        res.locals.user = user;
        return next();
    } catch (err) {
        return next();
    }


}

exports.logout = async (req, res) => {
    res.cookie('jwt', 'logged out', {
        expires: new Date(Date.now() + 1),
        httpOnly: true
    })
    res
        .status(200)
        .json({
            status: "success"
        })
}