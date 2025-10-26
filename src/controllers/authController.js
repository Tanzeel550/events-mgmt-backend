const {catchAsync} = require("./errorController");
const userModel = require("../models/userModel");
const jwt = require("jsonwebtoken");
const CustomError = require("../utils/customError");
const {sendLoginEmail, sendSignupEmail} = require('./../utils/sendEmail')

const createToken = (id) => {
	return jwt.sign({id}, process.env.PWD_TOKEN_SECRET, {
		algorithm: "HS256", expiresIn: process.env.PWD_TOKEN_EXPIRTY
	});
};

const cookieOptions = {
	expires: new Date(Date.now() + parseInt(process.env.JWT_COOKIE_EXPIRES_IN) * 24 * 60 * 60 * 1000),
	httpOnly: true,
	secure: process.env.NODE_ENV === 'production'
};

exports.signup = catchAsync(async (req, res, next) => {
	const {name, email, age, dob, password, confirmPassword, role} = req.body;
	const user = await userModel.create({
		name, email, age, dob, password, confirmPassword, role
	});

	user.password = undefined;
	const token = `Bearer ${createToken(user._id)}`;

	res.status(200).cookie("token", token).send({
		status: "success", token, message: "Signup successful", data: {user}
	});
	await sendSignupEmail(user);
});

exports.login = catchAsync(async (req, res, next) => {
	const {email, password} = req.body;

	if (!email || !password) {
		return next(new CustomError("Please provide email and password", 404));
	}
	const user = await userModel.findOne({email}).select("+password");

	if (!user || !(await user.checkPassword(password))) {
		return next(new CustomError("Incorrect email or password", 404));
	}

	user.password = undefined;
	const token = `Bearer ${createToken(user._id)}`;

	res.status(200).cookie("token", token).send({
		status: "success", token, message: "Login successful", data: {user}
	});
	await sendLoginEmail(user);
});

exports.secure = catchAsync(async (req, res, next) => {
	let token = req.headers.authorization || req.cookies.token;

	if (!token || !token.startsWith("Bearer ")) return next(new CustomError('You are not authorized to access this request'), 401);

	token = token.split(" ")[1];
	const decoded = await jwt.verify(token, process.env.PWD_TOKEN_SECRET);
	if (!decoded || !decoded.id) return next(new CustomError("You'll have to login again", 404));

	const user = await userModel.findById(decoded.id)

	if (!user) return next(new CustomError(`The user doesn't exist`, 404));
	req.user = user;
	req.token = token;
	next();
});

exports.getMe = catchAsync(async (req, res, next) => {
	const user = req.user;
	const token = req.token;
	res.status(200).cookie("token", `Bearer ${token}`).send({
		status: "success", token, message: "Profile retrieval successful", data: {user}
	});
});

// TODO: make cookies signed and httpOnly

/*
const crypto = require('node:crypto');
const sendEmail = require('../utils/sendEmail');

exports.restrictTo = (...prescribedRoles) => {
  return catchAsync(async (req, res, next) => {
    if (!req.user) throw new CustomError('User does not exist');
    let role = req.user.role;
    for (let i = 0; i < prescribedRoles.length; i++) {
      if (prescribedRoles[i] === role) {
        return next();
      }
    }

    next(new CustomError('You are not allowed to access this route', 404));
  });
};

const createHash = token => crypto.createHash('SHA-256').
  update(token).
  digest('hex');


exports.forgotPassword = catchAsync(async (req, res, next) => {
	const { email } = req.body;
	if (!email) return next(new CustomError('Please provide a valid email'), 401);
	const user = await userModel.findOne({ email });
	if (!user) return next(new CustomError('Please provide a valid email'), 401);

	let rawToken = crypto.randomBytes(32).toString('hex');

	user.passwordResetToken = createHash(rawToken);
	user.passwordResetExpires = Date.now() + process.env.EMAIL_EXPIRY_DURATION *
		60 * 1000;

	await user.save();

	await sendEmail(email, rawToken);

	res.status(200).send({
		status: 'success',
		data: {
			message: 'A password reset email has been sent successfully to your mail.' +
				' Please check you email.'
		}
	});
});

exports.resetPassword = catchAsync(async (req, res, next) => {
	const { token: rawToken } = req.params;
	if (!rawToken) {
		return next(new CustomError('Please provide a valid token'),
			401);
	}
	const hashedToken = createHash(rawToken);
	const user = await userModel.findOne({ passwordResetToken: hashedToken }).
	select('+passwordResetExpires');

	if (!user) {
		return next(new CustomError('Please provide a valid token'), 401);
	}

	if (user.passwordResetExpires < Date.now()) {
		return next(new CustomError('Sorry, this token has been expired', 401));
	}

	const { password, confirmPassword } = req.body;
	if (!password || !confirmPassword) {
		return next(new CustomError('Please provide password and confirm password'),
			401);
	}

	user.password = password;
	user.confirmPassword = confirmPassword;
	user.passwordResetExpires = undefined;
	user.passwordResetToken = undefined;
	user.passwordChangedAt = Date.now();
	await user.save();

	user.password = undefined;
	user.passwordChangedAt = undefined;

	const token = createToken(user._id);

	res.status(200).cookie('token', `Bearer ${token}`).send({
		status: 'success',
		token,
		data: { user }
	});
});
*/
