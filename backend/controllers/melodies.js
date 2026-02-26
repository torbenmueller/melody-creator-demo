const Melody = require('../models/melody');
const User = require('../models/user');
const MidiWriter = require('midi-writer-js');
const MelodyGenerator = require('../services/melodyGenerator');
const { 
    checkAndDowngradeExpiredPlan, 
    validateSettingsForPlan, 
    consumeCredit,
    errorResponses 
} = require('../utils/helpers');

// Generate melody on backend (works for both authenticated and anonymous users)
exports.generateMelody = async (req, res, next) => {
	try {
		const { settings } = req.body;
		if (!settings) {
			return errorResponses.badRequest(res, 'Settings are required');
		}

		let userPlan = null;
		
		// Check if user is authenticated
		if (req.userData?.userId) {
			const user = await User.findById(req.userData.userId);
			if (user) {
				await checkAndDowngradeExpiredPlan(user);
				userPlan = user.plan;
			}
		}
		
		// Validate settings
		const validationErrors = validateSettingsForPlan(settings, userPlan);
		if (validationErrors.length > 0) {
			return errorResponses.forbidden(res, `Invalid settings: ${validationErrors.join(', ')}`);
		}

		// Generate melody
		const generator = new MelodyGenerator();
		const result = generator.generateMelody(settings);
		
		// Consume credit if authenticated
		if (req.userData?.userId) {
			const user = await User.findById(req.userData.userId);
			if (user) {
				await consumeCredit(user);
			}
		}
		
		return res.status(200).json({
			melody: result.melody,
			scale: result.scale,
			settings: result.settings,
			intervals: result.intervals
		});
	} catch (error) {
		console.error('Generate melody error:', error);
		return res.status(500).json({
			message: 'Melody generation failed',
			error: error.message
		});
	}
};

exports.saveMelody = async (req, res, next) => {
	try {
		const user = await User.findById(req.userData.userId);
		if (!user) return errorResponses.notFound(res, 'User');
		
		await checkAndDowngradeExpiredPlan(user);
		
		// Check credits if consuming
		if (req.body.consumeCredit === true) {
			const availableCredits = user.plan === 'pro' || user.plan === 'enterprise'
				? user.creditsPermanent || 0
				: (user.creditsDaily || 0) + (user.creditsPermanent || 0);
			
			if (availableCredits < 1) {
				return errorResponses.insufficientCredits(res, availableCredits, 1);
			}
		}
		
		// Validate settings
		const validationErrors = validateSettingsForPlan(req.body.settings, user.plan);
		if (validationErrors.length > 0) {
			return errorResponses.forbidden(res, `Invalid settings: ${validationErrors.join(', ')}`);
		}
		
		const melody = new Melody({
			melody: req.body.melody,
			creator: req.userData.userId,
			settings: req.body.settings,
			plan: user.plan
		});
		
		if (!melody.settings.name) melody.settings.name = 'Melody';

		await melody.save();
		
		// Consume credit if requested
		if (req.body.consumeCredit === true) {
			await consumeCredit(user);
		}
		
		res.status(201).json({
			message: 'Melody saved successfully!'
		});
	} catch (error) {
		console.error('Save melody error:', error);
		res.status(500).json({
			message: 'Creating a melody failed!'
		});
	}
}

exports.loadMelodies = async (req, res, next) => {
	try {
		const pageSize = +req.query.pagesize;
		const currentPage = +req.query.page;
		const sortByType = req.query.sort_by_type;
		const order = parseInt(req.query.order) || -1;
		
		const sortOptions = {
			time: { time: order },
			license: { plan: order },
			name: { 'settings.name': order },
			key: { 'settings.key': order },
			bar: { 'settings.bar': order },
			complex: { 'settings.complex': order },
			beat: { 'settings.beat': order }
		};
		
		const query = { creator: req.userData.userId };
		let melodyQuery = Melody.find(query).lean().sort(sortOptions[sortByType] || { time: -1 });

		if (pageSize && currentPage) {
			melodyQuery.skip(pageSize * (currentPage - 1)).limit(pageSize);
		}
		
		const [melodies, count] = await Promise.all([
			melodyQuery.exec(),
			Melody.countDocuments(query)
		]);
		
		res.status(200).json({
			message: 'Melodies fetched successfully!',
			melodies,
			maxMelodies: count
		});
	} catch (error) {
		console.error('Load melodies error:', error);
		errorResponses.serverError(res, 'Fetching melodies failed!');
	}
}

exports.deleteMelody = async (req, res, next) => {
	try {
		const result = await Melody.deleteOne({ _id: req.params.id, creator: req.userData.userId });
		if (result.deletedCount === 0) {
			return errorResponses.notFound(res, 'Melody');
		}
		res.status(200).json({ message: 'Melody deleted!' });
	} catch (error) {
		console.error('Delete melody error:', error);
		errorResponses.serverError(res, 'Deleting melody failed!');
	}
}

exports.updateMelodyName = async (req, res, next) => {
	try {
		const { name } = req.body;
		
		if (!name?.trim()) {
			return errorResponses.badRequest(res, 'Melody name is required');
		}

		const melody = await Melody.findOne({ 
			_id: req.params.id,
			creator: req.userData.userId 
		});
		
		if (!melody) return errorResponses.notFound(res, 'Melody');

		melody.settings.name = name.trim();
		await melody.save();

		res.status(200).json({ message: 'Melody name updated successfully' });
	} catch (error) {
		console.error('Update melody name error:', error);
		errorResponses.serverError(res, 'Updating melody name failed');
	}
}

exports.getModes = async (req, res, next) => {
	try {
		const melodies = await Melody.find({ creator: req.userData.userId })
			.select('settings.scale')
			.lean()
			.exec();
		
		const modes = getAllDifferentModes(melodies);
		res.status(200).json({
			message: 'Modes fetched successfully!',
			modes
		});
	} catch (error) {
		console.error('Get modes error:', error);
		errorResponses.serverError(res, 'Fetching modes failed!');
	}
}

exports.getMidiFile = async (req, res, next) => {
	try {
		const melody = await Melody.findOne({ 
			_id: req.params.id,
			creator: req.userData.userId 
		}).lean().exec();
		
		if (!melody) return errorResponses.notFound(res, 'Melody');
		
		const writer = createNewMidiFile(melody);
		const name = melody.settings.name || 'melody';
		
		res.set('Content-Type', 'audio/midi');
		res.set('Content-Disposition', `attachment; filename="${name}.mid"`);
		res.send(Buffer.from(writer.buildFile()));
	} catch (error) {
		console.error('Get MIDI file error:', error);
		errorResponses.serverError(res, 'Generating MIDI file failed!');
	}
}

const getAllDifferentModes = (documents) => {
	const modeValues = {};
	let maxValue = 0;

	for (let i = 0; i < documents.length; i++) {
		const value = documents[i].settings.scale;
		if (modeValues[value]) {
			modeValues[value]++;
		} else {
			modeValues[value] = 1;
		}
		if (modeValues[value] > maxValue) {
			maxValue = modeValues[value];
		}
	}

	const modeData = {
		modeValues: modeValues, 
		maxValue: maxValue
	};

	return modeData;
};

const createNewMidiFile = (result) => {
	const beat = result.settings.beat;
	const firstChar = +beat.charAt(0);
	const lastChar = +beat.charAt(beat.length -1);
	const track = new MidiWriter.Track();
	track.setTempo(120);
	track.setTimeSignature(firstChar, lastChar);

	const ticks = {
		'2n': '2',
		'4n': '4',
		'8n': '8'
	}

	for (const obj of result.melody) {
		track.addEvent(new MidiWriter.NoteEvent({ pitch: [obj.note], duration: ticks[obj.time] }));
	}

	const writer = new MidiWriter.Writer([track]);

	return writer;
};
