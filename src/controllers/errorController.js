exports.catchAsync = (fn) => {
	return async (req, res, next) => {
		try {
			await fn(req, res, next);
		} catch (e) {
			next(e);
		}
	};
};

const sendError = (code, message, res, e) =>
	res.status(code).send({
		status: "error",
		message: message,
		error: e
	});

exports.errorController = (err, req, res, next) => {
	if (err.customError) return sendError(err.code, err.message, res);

	// TODO: IF THERE ARE MULTIPLE ERRORS, SEND ERRORS IN THE FORM OF AN ARRAY
	if (err.name === "CastError") {
		return sendError(404, "Please give a valid id", res, err);
	}

	if (err.code === 11000) {
		return sendError(
			404,
			`${Object.keys(err.keyValue).join(" and ")} already exists. Try again.`,
			res,
			err
		);
	}

	if (err.name === "ValidationError") {
		const val = Object.values(err.errors)[0];

		if (val.name === "CastError") {
			return sendError(
				404,
				`${val.path} should be a ${val.kind} instead of ${val.valueType}`,
				res,
				err
			);
		} else if (val.name === "ValidatorError") {
			return sendError(404, val.message, res, err);
		}
	}

	if (err.name === "TokenExpiredError") {
		return sendError(
			400,
			"This token is expired. You'll have to login again.",
			res,
			err
		);
	}

	if (err.name === "JsonWebTokenError") {
		console.log(err.stack);
		return sendError(400, "You'll have to login.", res, err);
	}

	console.error(err);
	sendError(500, "Internal Server Error", res, err);
};
