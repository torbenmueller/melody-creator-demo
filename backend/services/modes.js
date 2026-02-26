// Musical modes and key calculations
// Ported from frontend modes.ts

class Modes {
	static SHARP_KEYS = ["G", "D", "A", "E", "B", "F#"];
	static CHROMATIC_SHARP_SCALE = ["G", "Ab", "A", "Bb", "B", "C", "Db", "D", "Eb", "E", "F", "F#"];
	static CHROMATIC_FLAT_SCALE = ["G", "Ab", "A", "Bb", "B", "C", "Db", "D", "Eb", "E", "F", "Gb"];

	static KEY_INDICES = {
		"Major": 0,
		"Dorian": -2,
		"Phrygian": -4,
		"Lydian": -5,
		"Mixolydian": +5,
		"Minor": +3,
		"Locrian": +1,
		"Pentatonic Major": 0,
		"Pentatonic Minor": +3,
		"Chromatic": 0,
		"Harmonic Minor": +3,
		"Melodic Minor": +3,
		"Whole Tone": 0
	};

	static getRootkey(key, mode) {
		const chromaticScale = Modes.SHARP_KEYS.includes(key) 
			? Modes.CHROMATIC_SHARP_SCALE 
			: Modes.CHROMATIC_FLAT_SCALE;
		const rootKey = chromaticScale.indexOf(key) + Modes.KEY_INDICES[mode];
		if (rootKey < 0) return chromaticScale[chromaticScale.length + rootKey];
		return chromaticScale[rootKey % chromaticScale.length];
	}
}

module.exports = Modes;
