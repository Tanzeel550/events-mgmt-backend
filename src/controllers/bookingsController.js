const {catchAsync} = require("./errorController");
const Booking = require('./../models/bookingModel')
const CustomError = require('./../utils/customError')
const Event = require('./../models/eventModel')

exports.getMyBookings = catchAsync(async (req, res, next) => {
	const userId = req.user._id;

	const bookings = await Booking.find({ userId });

	return res.status(200).json({
		status: 'Success',
		message: 'Your bookings fetched successfully',
		results: bookings.length,
		data: {
			bookings
		}
	});
});

exports.createBooking = catchAsync(async (req, res, next) => {
	const { eventId } = req.body;
	const userId = req.user._id;

	// Check event existence
	const event = await Event.findById(eventId);
	if (!event) return next(new CustomError('Event not found', 404));

	// Prevent duplicate booking for the same event
	const existingBooking = await Booking.findOne({ userId, eventId });
	if (existingBooking) return next(new CustomError('You have already booked this event', 400));

	if (event.creator === userId) return next(new CustomError('You cannot book your own event', 404));

	const booking = await Booking.create({ userId, eventId });

	return res.status(201).json({
		status: 'Success',
		message: 'Booking created successfully',
		data: {
			booking
		}
	});
});

exports.deleteBooking = catchAsync(async (req, res, next) => {
	const booking = await Booking.findById(req.params.id);

	if (!booking) return next(new CustomError('No booking found with that ID', 404));

	// Only allow owner or admin
	if (!booking.userId._id.equals(req.user._id) && req.user.role !== 'admin') {
		return next(new CustomError('You are not authorized to delete this booking', 403));
	}

	await booking.deleteOne();

	return res.status(204).json({
		status: 'Success',
		message: 'Booking deleted successfully',
		data: null
	});
});

