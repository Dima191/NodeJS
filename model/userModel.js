const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const comparePasswords = function (checkPassword) {
    return validator.equals(checkPassword, this.password)
}


const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'A User must have a name']
    },
    email: {
        type: String,
        validate: [validator.isEmail, 'Please fill a valid email address'],
        trim: true,
        lowercase: true,
        required: [true, 'User mush have an email'],
        unique: [true, 'This email already used']
    },
    photo: {
        type: String,
    },
    role: {
        type: String,
        enum: ['user', 'guide', 'lead-guide', 'admin'],
        default: 'user'
    },
    password: {
        type: String,
        minlength: [8, 'A password must have at list 8 characters'],
        required: [true, 'User must have a password'],
        select: false
        // validate: [validator.isStrongPassword, 'Please create more safety password']
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Confirm your password'],
        validate: [comparePasswords, 'Passwords must be the same'],
        select: false
    },
    passwordChangeAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
        type: Boolean,
        default: true,
        select: false
    }
});

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    this.passwordConfirm = undefined;
    next();
})

userSchema.pre('save', async function (next) {
    if (!this.isModified('password') || this.isNew) return next();
    this.passwordChangeAt = Date.now() - 1000;
    next();
})

userSchema.pre(/^find/, async function (next) {
    this.find({active: true});
    next();
})

userSchema.methods.comparePassword = async function (unknownPassword, realPassword) {
    return await bcrypt.compare(unknownPassword, realPassword);
}

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
    if (this.passwordChangeAt)
        return this.passwordChangeAt.getTime() / 1000 > JWTTimestamp;

    return false;
}

userSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString('hex');

    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    return resetToken;
}


const User = mongoose.model('User', userSchema)

module.exports = User;