const express = require('express');
const {
	getMyBookings,
	createBooking,
	deleteBooking
} = require('../controllers/bookingsController');
const {secure} = require('./../controllers/authController')

const router = express.Router();

// All routes are secured
router.use(secure);

router
	.route('/')
	.get(getMyBookings)
	.post(createBooking);

router.route('/:id')
	.delete(deleteBooking);

module.exports = router;
