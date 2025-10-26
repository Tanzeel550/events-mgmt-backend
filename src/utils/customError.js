class CustomError extends Error {
	constructor(message, code) {
		super(message || "Something went wrong");
		this.code = code || 500;
		this.customError = true;
	}
}

module.exports = CustomError;
