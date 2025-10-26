const mongoose = require('mongoose');
const bookingModel = require("./bookingModel")
const CustomError = require("../utils/customError");

const eventSchema = new mongoose.Schema(
	{
		title: {
			type: String,
			required: [true, 'Event title is required.'],
			trim: true,
			minlength: [3, 'Event title must be at least 3 characters long.'],
			maxlength: [100, 'Event title cannot exceed 100 characters.'],
		},
		description: {
			type: String,
			required: [true, 'Event description is required.'],
			minlength: [10, 'Event description must be at least 10 characters long.'],
			maxlength: [1000, 'Event description cannot exceed 1000 characters.'],
		},
		date: {
			type: Date,
			required: [true, 'Event date is required.'],
			validate: {
				validator: function (value) {
					return value >= new Date().setHours(0, 0, 0, 0);
				},
				message: 'Event date cannot be in the past.',
			},
		},
		startTime: {
			type: String,
			required: [true, 'Event start time is required.'],
			validate: {
				validator: function (v) {
					return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
				},
				message: 'Start time must be in HH:mm format (24-hour).',
			},
		},
		endTime: {
			type: String,
			required: [true, 'Event end time is required.'],
			validate: {
				validator: function (v) {
					return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
				},
				message: 'End time must be in HH:mm format (24-hour).',
			},
		},
		isDeleted: {
			type: Boolean,
			default: false,
		},
		creator: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'users',
			required: [true, 'Event creator is required.'],
		},
	},
	{
		timestamps: true,
		toJSON: {virtuals: true},
		toObject: {virtuals: true}
	}
);

// eventSchema.virtual('bookings', {
// 	ref: 'bookings',
// 	localField: '_id',
// 	foreignField: 'eventId'
// });

eventSchema.pre(/^find/, function (next) {
	this.populate({
	// 	path: 'bookings',
	// 	populate: {
	// 		path: 'userId',
	// 		select: 'name email',
	// 	},
	// }).populate({
		path: 'creator',
		select: 'name email',
	});
	next();
});


// Ensure endTime > startTime
eventSchema.pre('save', function (next) {
	const [startHour, startMin] = this.startTime.split(':').map(Number);
	const [endHour, endMin] = this.endTime.split(':').map(Number);
	const start = startHour * 60 + startMin;
	const end = endHour * 60 + endMin;

	if (end <= start) {
		const err = new CustomError('End time must be later than start time.', 400);
		return next(err);
	}

	next();
});

// Custom error formatting for consistent response handling
eventSchema.post('save', function (error, doc, next) {
	if (error.name === 'ValidationError') {
		const formattedErrors = Object.values(error.errors).map((err) => err.message);
		const err = new CustomError(`Event validation failed: ${formattedErrors.join(', ')}`, 400);
		next(err);
	} else {
		next(error);
	}
});

const Event = mongoose.model('events', eventSchema);

module.exports = Event;
