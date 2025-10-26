const fs = require('fs');
const path = require('path');

/**
 * Helper to load and inject event data into the HTML template
 */
const renderTemplate = (templateName, replacements) => {
	const templatePath = path.join(__dirname, '..', 'templates', `${templateName}.html`);
	let html = fs.readFileSync(templatePath, 'utf-8');

	for (const [key, value] of Object.entries(replacements)) {
		const regex = new RegExp(`{{${key}}}`, 'g');
		html = html.replace(regex, value ?? '');
	}

	return html;
};

/**
 * Send Event Creation Email
 */
exports.sendEventCreationEmail = async (user, event) => {
	try {
		const body = renderTemplate('eventCreated', {
			creatorName: user.name,
			title: event.title,
			description: event.description,
			date: new Date(event.date).toDateString(),
			startTime: event.startTime,
			endTime: event.endTime,
			year: new Date().getFullYear()
		});

		await fetch('https://api.useplunk.com/v1/send', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${process.env.PLUNK_API_KEY}`
			},
			body: JSON.stringify({
				to: user.email,
				subject: 'Event Creation',
				body: body
			})
		});
	} catch (err) {
		console.log("Event Created Successfully. Failed to send event creation email");
		// throw new CustomError("Event Created Successfully. Failed to send event creation email", 500);
	}
};

/**
 * Send Event Updated Email
 */
exports.sendEventUpdatedEmail = async (user, event) => {
	try {
		const body = renderTemplate('eventUpdated', {
			creatorName: user.name,
			title: event.title,
			description: event.description,
			date: new Date(event.date).toDateString(),
			startTime: event.startTime,
			endTime: event.endTime,
			year: new Date().getFullYear()
		});

		await fetch('https://api.useplunk.com/v1/send', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${process.env.PLUNK_API_KEY}`
			},
			body: JSON.stringify({
				to: user.email,
				subject: 'Event Updation',
				body: body
			})
		})
	} catch (err) {
		console.log("Event Created Successfully. Failed to send event updation email");
		// throw new CustomError("Event Edited Successfully. Failed to send event updation email", 500);
	}
};

exports.sendSignupEmail = async (user) => {
	try {
		const body = renderTemplate('signup', {
			name: user.name,
			email: user.email,
			signupDate: new Date().toDateString(),
			year: new Date().getFullYear()
		});

		await fetch('https://api.useplunk.com/v1/send', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${process.env.PLUNK_API_KEY}`
			},
			body: JSON.stringify({
				to: user.email,
				subject: 'Welcome to Zeelus!',
				body: body
			})
		});
	} catch (err) {
		console.log("Account created successfully. Failed to send welcome email");
	}
};

exports.sendLoginEmail = async (user) => {
	try {
		const body = renderTemplate('login', {
			name: user.name,
			email: user.email,
			loginTime: new Date().toLocaleString(),
			year: new Date().getFullYear()
		});

		await fetch('https://api.useplunk.com/v1/send', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${process.env.PLUNK_API_KEY}`
			},
			body: JSON.stringify({
				to: user.email,
				subject: 'Welcome Back to Zeelus!',
				body: body
			})
		});
	} catch (err) {
		console.log("Login successful. Failed to send login notification email");
	}
};
