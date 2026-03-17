const express = require('express');
const app = express();
const port = 3000;
const mongoose = require('mongoose');
let compression = null;
try {
	compression = require('compression');
} catch (error) {
	compression = null;
}

const melodiesRoutes = require('./routes/melodies');
const userRoutes = require('./routes/user');
require('dotenv').config();

const connectToDatabase = async () => {
	try {
		await mongoose.connect('mongodb+srv://new-user:' + process.env.MONGO_ATLAS_PW + '@cluster0.76fy5.mongodb.net/myFirstDatabase?retryWrites=true&w=majority');
		console.log('Connected to database!');
	} catch (err) {
		console.log('Connection to database failed!', err);
	}
}

connectToDatabase();

app.disable('x-powered-by');

if (compression) {
	app.use(compression());
}

app.use(express.urlencoded({ extended: true, limit: '100kb' }));
app.use(express.json({ limit: '100kb' }));

app.use((req, res, next) => {
	res.setHeader('X-Content-Type-Options', 'nosniff');
	res.setHeader('X-Frame-Options', 'DENY');
	res.setHeader('Referrer-Policy', 'no-referrer');
	next();
});

app.use((req, res, next) => {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, PUT, OPTIONS');
	// Short-circuit CORS preflight requests
	if (req.method === 'OPTIONS') {
		return res.sendStatus(200);
	}
	next();
});

app.use('/api/melodies', melodiesRoutes);
app.use('/api/user', userRoutes);

app.listen(port, () => {
	console.log(`Melody Creator app listening at http://localhost:${port}`);
});
