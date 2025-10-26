const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
	userId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'user',
		required: true
	},
	eventId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Event',
		required: true
	}
}, {
	timestamps: true,
	toJSON: {virtuals: true},
	toObject: {virtuals: true}
});

bookingSchema.pre(/^find/, function (next) {
	this.populate({
		path: 'userId',
		model: 'users',
		select: 'name email', // only include limited fields, no recursion
	}).populate({
		path: 'eventId',
		model: 'events',
		select: 'title description date startTime endTime creator',
	});
	next();
});

const Booking = mongoose.model('bookings', bookingSchema);

module.exports = Booking;
