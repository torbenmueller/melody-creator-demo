const jwt = require('jsonwebtoken');
require('dotenv').config();

// Optional authentication - tries to authenticate but continues if token is missing/invalid
module.exports = (req, res, next) => {
	try {
		const authHeader = req.headers.authorization;
		if (authHeader) {
			const token = authHeader.split(' ')[1];
			const decodedToken = jwt.verify(token, process.env.JWT_KEY);
			req.userData = { email: decodedToken.email, userId: decodedToken.userId };
		}
		// Continue regardless of authentication status
		next();
	} catch (error) {
		// If token is invalid/expired, continue without setting req.userData
		next();
	}
};
