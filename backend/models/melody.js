const mongoose = require('mongoose');

const melodySchema = mongoose.Schema({
	melody: [{
		_id: false,
		note: String,
		time: String
	}],
	creator: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
	settings: {
		_id: false,
		bar: Number,
		complex: String,
		key: String,
		scale: String,
		beat: String,
		name: String,
		rootKey: String
	},
	time : { type: Date, default: Date.now },
	plan: { type: String, enum: ['free', 'pro', 'enterprise'], default: 'free' }
});

// Primary list query path: filter by creator and sort by date.
melodySchema.index({ creator: 1, time: -1 });

// Support creator-scoped sorting options used by the UI.
melodySchema.index({ creator: 1, plan: 1 });
melodySchema.index({ creator: 1, 'settings.name': 1 });
melodySchema.index({ creator: 1, 'settings.key': 1 });
melodySchema.index({ creator: 1, 'settings.bar': 1 });
melodySchema.index({ creator: 1, 'settings.complex': 1 });
melodySchema.index({ creator: 1, 'settings.beat': 1 });

module.exports = mongoose.model('Melody', melodySchema);
