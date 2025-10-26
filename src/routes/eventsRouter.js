const express = require('express');
const {
	getAllEvents,
	createEvent,
	updateEvent,
	deleteEvent,
	getEvent,
	getMyEvents
} = require('../controllers/eventsController');
const {secure} = require("./../controllers/authController");
const router = express.Router();

// Base route: /api/events
router
	.route('/')
	.get(getAllEvents)    // GET /api/events?creator={id}&date={date}&start_time={time}&...
	.post(secure, createEvent);   // POST /api/events

router
	.route('/get-my-events')
	.get(secure, getMyEvents);

router
	.route('/:id')
	.get(getEvent)
	.put(secure, updateEvent)     // PUT /api/events/:id
	.delete(secure, deleteEvent); // DELETE /api/events/:id


module.exports = router;
