const AppError = require('./../utils/appError');

const handleCastErrorDB = (error) => {
    const message = `Invalid ${error.path}: ${error.value}`;
    return new AppError(message, 400);
}

const handleDuplicateFieldsDB = error => {
    const message = `Tour name "${error.keyValue.name}" already exist`;
    return new AppError(message, 400);
}

const handleValidationErrorDB = error => {
    const errors = Object.values(error.errors).map(el => el.message);
    const message = `Invalid input data. ${errors.join('. ')}`;
    return new AppError(message, 400);
}

const handleJWTError = () => new AppError('Invalid token. Please login again', 401);

const handleJWTExpiredError = () => new AppError('Your token has  expired. Please, login again', 401);

const sendErrDev = (err, res) => {
    res
        .status(err.statusCode)
        .json({
            status: err.status,
            message: err.message,
            stack: err.stack,
            error: err
        })
};

 const sendErrProd = (err, res) => {
    if (err.isOperational) {
        res
            .status(err.statusCode)
            .json({
                status: err.status,
                message: err.message,
            })
    } else {
        //log err
        console.log('ERR', err);
        //generic message
        res
            .status(500)
            .json({
                status: "error",
                message: "Something went wrong"
            })
    }
};

exports.errController = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        sendErrDev(err, res);
    } else if (process.env.NODE_ENV === 'production') {
        let error = Object.create(err);
        if (error.name === 'CastError') error = handleCastErrorDB(error);
        if (error.code === 11000) error = handleDuplicateFieldsDB(error);
        if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
        if (error.name === 'JsonWebTokenError') error = handleJWTError();
        if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();
        sendErrProd(error, res);
    }
}