const mongoose = require("mongoose");
const bookingModel = require("./bookingModel")
const validator = require("validator");
const bcrypt = require("bcrypt");
const crypto = require("node:crypto");

const userSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: [true, "Name is required"],
			minLength: [3, "name can't be smaller than 3 characters"],
			maxLength: [40, "name can't be larger than 40 characters"]
		},
		email: {
			type: String,
			required: [true, "Email is required"],
			validate: {
				validator: validator.isEmail,
				message: (props) => `${props.value} is not a valid email address`
			},
			unique: true
		},
		dob: {
			type: Date,
			required: [true, 'Date is required'],
			validate: {
				validator: function(value) {
					return value < new Date();
				},
				message: 'Date of birth must be in the past'
			}
		},
		password: {
			type: String,
			required: [true, "Password is required"],
			minLength: [8, "Password can't be smaller than 8 characters"],
			select: false
		},
		confirmPassword: {
			type: String,
			select: false,
			default: 1,
			validate: {
				validator: function (value) {
					return this.password === value;
				},
				message: "Password and confirm password don't match"
			}
		},
		role: {
			type: String,
			enum: {
				values: ["admin", "user"],
				message: "role can one of the following: admin and user"
			},
			default: "user"
		},
		// SEND VERIFICATION EMAIL ON SIGNUP
		isVerified: {
			type: Boolean,
			default: false
		},
		profileImg: {
			type: String,
			default: "default"
		}
	},
	{
		toJSON: { virtuals: true },
		toObject: { virtuals: true }
	}
);

userSchema.virtual('bookings', {
	ref: 'bookings',
	localField: '_id',
	foreignField: 'userId'
});

// userSchema.pre(/^find/, function (next) {
// 	this.populate({
// 		path: 'bookings',
// 		populate: {
// 			path: 'eventId',
// 			select: 'title location date',
// 		},
// 	});
// 	next();
// });

userSchema.virtual("age").get(function () {
	const today = new Date(),	dateOfBirth = new Date(this.dob);
	let age = today.getFullYear() - dateOfBirth.getFullYear();
	const monthDifference = today.getMonth() - dateOfBirth.getMonth();

	if (
		monthDifference < 0 ||
		(monthDifference === 0 && today.getDate() < dateOfBirth.getDate())
	) {
		age--;
	}

	return age;
});

// TODO: ADD OTHER FIELDS
userSchema.pre('save', async function(next) {
	// Only run this function if password was actually modified
	if (!this.isModified('password')) return next();

	// Hash the password with cost of 12
	this.password = await bcrypt.hash(this.password, 12);

	// Delete confirmPassword field
	this.confirmPassword = undefined;
	next();
});


userSchema.methods.checkPassword = async function (password) {
	return await bcrypt.compare(password, this.password);
};

const userModel = mongoose.model("users", userSchema);

module.exports = userModel;
