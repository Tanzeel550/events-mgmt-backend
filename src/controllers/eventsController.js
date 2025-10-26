const Event = require('../models/eventModel');
const {catchAsync} = require("./errorController");
const CustomError = require("./../utils/customError");
const {sendEventCreationEmail, sendEventUpdatedEmail} = require("./../utils/sendEmail");

const getAllEvents = catchAsync(async (req, res) => {
	const {
		title,
		start_date,
		end_date,
		start_time,
		end_time,
		limit = 10,
		page = 1,
	} = req.query;

	console.log({title, start_date, end_date, start_time, end_time, limit, page,})

	// Build dynamic query object
	const query = {isDeleted: false};

	if (title) query.title = {$regex: title, $options: "i"};
	if (start_time) query.startTime = {$gte: start_time};
	if (end_time) query.endTime = {$lte: end_time};
	if (start_date && end_date) {
		query.date = {
			$gte: new Date(start_date),
			$lte: new Date(end_date),
		};
	} else if (start_date) {
		query.date = {$gte: new Date(start_date)};
	} else if (end_date) {
		query.date = {$lte: new Date(end_date)};
	}

	// Convert pagination values to numbers
	const numericLimit = Math.max(parseInt(limit, 10), 1);
	const numericPage = Math.max(parseInt(page, 10), 1);

	// Pagination offset
	const skip = (numericPage - 1) * numericLimit;

	// Fetch events
	const events = await Event.find(query)
		.sort({date: 1, startTime: 1})
		.skip(skip)
		.limit(numericLimit)
		.lean();

	// Count total documents for pagination info
	const totalCount = await Event.countDocuments(query);
	const totalPages = Math.ceil(totalCount / numericLimit);

	// Response
	return res.status(200).json({
		status: "success",
		message: 'Events fetched successfully.',
		data: {
			events,
			pagination: {
				totalItems: totalCount,
				totalPages,
				currentPage: numericPage,
				limit: numericLimit,
			},
		},
	});
});

const getMyEvents = catchAsync(async (req, res) => {
	const userId = req.user._id;
	const events = await Event.find({creator: userId});
	return res.status(200).json({
		status: 'Success',
		message: 'Events fetched successfully',
		data: {
			events
		}
	})
});


const getEvent = catchAsync(async (req, res, next) => {
	const {id} = req.params;
	if (!id) return next(new CustomError("Please provide an id of the event", 404));
	const event = await Event.findById(id);

	if (!event) return next(new CustomError("Event not found", 404));

	res.status(201).json({
		status: "success",
		message: 'Event retrieved successfully.',
		data: {event},
	});

})

const createEvent = catchAsync(async (req, res, next) => {
	const {title, description, date, startTime, endTime} = req.body;

	const creator = req.user?._id;

	// Only check existence (not deep validation, schema already handles that)
	if (!title || !description || !date || !startTime || !endTime || !creator) {
		return next(CustomError('Missing required fields. Please provide all mandatory event details.', 400));
	}

	const event = await Event.create({
		title,
		description,
		date,
		startTime,
		endTime,
		creator,
	});

	await sendEventCreationEmail(req.user, event);

	res.status(201).json({
		status: "success",
		message: 'Event created successfully.',
		data: {event},
	});
});

const deleteEvent = catchAsync(async (req, res, next) => {
	const {id} = req.params;

	// Find event
	const event = await Event.findById(id);
	if (!event || event.isDeleted) return next(CustomError('Event not found or already deleted.', 404));

	// Soft delete
	event.isDeleted = true;
	await event.save();

	res.status(200).json({
		status: "success",
		message: 'Event deleted successfully.',
	});
})

const updateEvent = catchAsync(async (req, res, next) => {
	const {id} = req.params;
	const updates = req.body;

	// Find the event
	const event = await Event.findById(id);
	if (!event || event.isDeleted) return next(CustomError('Event not found or has been deleted.', 404));

	// Allowed fields to update
	const allowedFields = ['title', 'description', 'date', 'startTime', 'endTime'];
	let hasValidField = false;

	for (const field of allowedFields) {
		if (Object.prototype.hasOwnProperty.call(updates, field)) {
			event[field] = updates[field];
			hasValidField = true;
		}
	}

	if (!hasValidField) return next(CustomError('No valid fields provided for update.', 400));

	// Save triggers schema validation (date, time, etc.)
	await event.save();

	res.status(200).json({
		status: "success",
		message: 'Event updated successfully.',
		data: {event},
	});
	await sendEventUpdatedEmail(req.user, event);
});


module.exports = {getAllEvents, getEvent, getMyEvents, createEvent, deleteEvent, updateEvent};
