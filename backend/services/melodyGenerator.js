// Melody Generation Algorithm

const Modes = require('./modes');

class MelodyGenerator {
	// Class-level constants (shared across all instances)
	static WHOLE_RANGE_SHARP = [
		"E3", "F3", "F#3", "G3", "G#3", "A3", "A#3", "B3", "C4", "C#4", "D4", "D#4", "E4", "F4", "F#4", "G4", "G#4", "A4",
		"A#4", "B4", "C5", "C#5", "D5", "D#5", "E5", "F5", "F#5", "G5", "G#5", "A5", "A#5", "B5", "C6", "C#6", "D6"
	];

	static WHOLE_RANGE_FLAT = [
		"E3", "F3", "Gb3", "G3", "Ab3", "A3", "Bb3", "B3", "C4", "Db4", "D4", "Eb4", "E4", "F4", "Gb4", "G4", "Ab4", "A4",
		"Bb4", "B4", "C5", "Db5", "D5", "Eb5", "E5", "F5", "Gb5", "G5", "Ab5", "A5", "Bb5", "B5", "C6", "Db6", "D6"
	];

	static HARMONIC_MINOR_MODIFICATIONS = {
		'Db': {'C3': 'B#3', 'C4': 'B#4', 'C5': 'B#5'},
		'D': {'Db3': 'C#3', 'Db4': 'C#4', 'Db5': 'C#5'},
		'F#': {'F3': 'E#3', 'F4': 'E#4', 'F5': 'E#5'},
		'Gb': {'F3': 'E#3', 'F4': 'E#4', 'F5': 'E#5'},
		'G': {'Gb3': 'F#3', 'Gb4': 'F#4', 'Gb5': 'F#5'},
		'Ab': {'F#3': 'F##3', 'F#4': 'F##4', 'F#5': 'F##5'}
	};

	// 0 starts at G3
	static SCALE_INDICES = {
		major: [3, 5, 7, 8, 10, 12, 13, 15, 17, 19, 20, 22],
		minor: [3, 4, 6, 8, 10, 11, 13, 15, 16, 18, 20, 22],
		pentatonicmajor: [0, 3, 5, 8, 10, 12, 15, 17, 20],
		pentatonicminor: [1, 3, 6, 8, 11, 13, 15, 18, 20],
		dorian: [3, 5, 6, 8, 10, 11, 13, 15, 17, 18, 20, 22],
		phrygian: [3, 4, 6, 8, 9, 11, 13, 15, 16, 18, 20, 21],
		lydian: [3, 5, 7, 8, 10, 12, 14, 15, 17, 19, 20, 22],
		mixolydian: [3, 5, 6, 8, 10, 12, 13, 15, 17, 18, 20, 22],
		locrian: [2, 4, 6, 8, 9, 11, 13, 14, 16, 18, 20, 21],
		chromatic: [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23],
		harmonicminor: [3, 4, 7, 8, 10, 11, 13, 15, 16, 19, 20, 22],
		melodicminor: [3, 5, 7, 8, 10, 11, 13, 15, 17, 19, 20, 22],
		wholetone: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20]
	};

	/* static NOTE_LENGTH = ["2n", "4n", "8n", "8n.", "16n", "16n.", "32n", "8t"]; */
	static NOTE_LENGTH = ["2n", "4n", "8n", "16n", "8n.", "8t"];
	static NAMES_OF_SCALES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

	constructor() {
		// Instance state for current melody generation
		this.melody = [];
		this.intervalCheck = [];
		this.settings = null;
		this.scale = null;
		this.rootKey = '';
		this.melodyIndex = -1;
		this.noteIndex = 0;
		this.difference = 0;
		this.bars = 0;
		this.complexity = 0;
	}

	// Main entry point
	generateMelody(settings) {
		this.melody = [];
		this.intervalCheck = [];
		this.settings = settings;

		let nameIndex = MelodyGenerator.NAMES_OF_SCALES.indexOf(this.settings.key);
		if (this.settings.key === "F#") nameIndex = 6;
		let mode = settings.scale.toLowerCase().replace(/\s/g, '');
		let newIndexes = this.generateScaleIndexes(nameIndex, mode);
		this.scale = this.generateScale(newIndexes);
		this.createMelody();
		
		return {
			melody: this.melody,
			scale: this.scale,
			settings: this.settings,
			intervals: this.getIntervals()
		};
	}

	generateScaleIndexes(index, mode) {
		return MelodyGenerator.SCALE_INDICES[mode].map(x => x + index);
	}

	generateScale(indices) {
		let scale = [];
		let wholeRange = this.crossOrBKey();

		indices.forEach(element => {
			scale.push(wholeRange[element]);
		});

		// F# replacements
		if (this.rootKey === "F#") {
			const replacements = { "F3": "E#3", "F4": "E#4", "F5": "E#5" };
			scale = scale.map(item => replacements[item] || item);
		}

		// Gb replacements
		if (this.rootKey === "Gb") {
			const replacements = { "B3": "Cb3", "B4": "Cb4", "B5": "Cb5" };
			scale = scale.map(item => replacements[item] || item);
		}

		// Harmonic Minor replacements
		if (this.settings.scale === 'Harmonic Minor' && MelodyGenerator.HARMONIC_MINOR_MODIFICATIONS[this.settings.key]) {
			scale = scale.map(item => MelodyGenerator.HARMONIC_MINOR_MODIFICATIONS[this.settings.key][item] || item);
		}

		return scale;
	}

	crossOrBKey() {
		this.rootKey = Modes.getRootkey(this.settings.key, this.settings.scale);
		this.settings.rootKey = this.rootKey;
		if (this.rootKey.includes('b') || this.rootKey === 'F') return MelodyGenerator.WHOLE_RANGE_FLAT;
		return MelodyGenerator.WHOLE_RANGE_SHARP;
	}

	createMelody() {
		this.melodyIndex = -1;
		this.noteIndex = 0;
		this.difference = 0;
		this.bars = this.settings.bar;
		this.complexity = this.settings.complex === 'Low' ? 2 : this.settings.complex === 'Medium' ? 3 : 4;
		this.createNotes();
	}

	createNotes() {
		let bar = 0;
		while (this.bars > 0) {
			if (this.settings.beat === "4/4") {
				bar = 1;
			}
			if (this.settings.beat === "3/4") {
				bar = 0.75;
			}
			while (bar > 0) {
				let time = this.setTime();
				let barCheck = this.calculateLeftTimeAndPushToMelody(bar, time);
				bar = barCheck.bar;
				if (barCheck.moveOn === true) {
					let note = this.setNote();
					this.pushToMelody(time, note);
				}
			}
			this.bars -= 1;
		}
		this.checkEnding();
	}

	setTime() {
		let timeIndex = this.randomNote(0, this.complexity);
		return MelodyGenerator.NOTE_LENGTH[timeIndex];
	}

	calculateLeftTimeAndPushToMelody(bar, time) {
		let timeLength = 0;

		// 1/2, 1/4 and 1/8 notes
		if (time.length === 2 && !time.endsWith('t')) {
			timeLength = 1 / parseInt(time.charAt(0));
			bar -= timeLength;
		}
		
		// 1/16 and 1/32 notes
		if (time.length === 3 && !time.endsWith('.')) {
			timeLength = 1 / parseInt(time.substring(0, time.length - 1));
			bar -= timeLength;
		}

		// Dotted 1/8 notes
		if (time.length === 3 && time.endsWith('.')) {
			timeLength = (1 / (parseInt(time.charAt(0)) * 2)) * 3;
			bar -= timeLength;
			console.log("bar dotted", timeLength);
		}

		// Triplet 1/8 notes
		/* if (time.length === 2 && time.endsWith('t')) {
			timeLength = (1 / (parseInt(time.charAt(0)) * 3)) * 2;
			bar -= timeLength;
		} */

		let moveOn = bar >= 0;
		if (bar < 0) {
			bar += timeLength;
		}
		return { bar, moveOn };
	}

	pushToMelody(time, note) {
		this.melody.push({ note, time });
		this.melodyIndex = this.melody.length - 1;
	}

	setNote() {
		let searchScale = JSON.parse(JSON.stringify(this.scale));
		let note = '';
		
		if (this.checkTonic()) {
			note = this.setTonicNote();
		} else {
			searchScale = this.checkForQuantil(searchScale);
			searchScale = this.notTripplet(searchScale);
			searchScale = this.noteAfterQuint(searchScale);
			note = this.getRandomNoteOfScale(searchScale);
		}
		return note;
	}

	checkTonic() {
		return this.melody.length === 0;
	}

	setTonicNote() {
		return this.scale[3];
	}

	checkForQuantil(scale) {
		let foundNoteIndex = scale.indexOf(this.melody[this.melodyIndex].note);
		let lowerIndex = foundNoteIndex - 4;
		if (lowerIndex < 0) lowerIndex = 0;
		let upperIndex = foundNoteIndex + 4;
		if (upperIndex > scale.length) upperIndex = scale.length - 1;
		return scale.splice(lowerIndex, upperIndex);
	}

	notTripplet(scale) {
		if (this.melody.length >= 2) {
			if (this.melody[this.melodyIndex].note === this.melody[this.melodyIndex - 1].note) {
				let foundIndex = scale.indexOf(this.melody[this.melodyIndex].note);
				if (foundIndex > -1) {
					scale.splice(foundIndex, 1);
				}
			}
		}
		return scale;
	}

	noteAfterQuint(scale) {
		if (this.melody.length >= 2) {
			let firstNote = this.scale.indexOf(this.melody[this.melodyIndex - 1].note);
			let secondNote = this.scale.indexOf(this.melody[this.melodyIndex].note);
			let difference = this.getDifference(firstNote, secondNote);
			
			if (difference === 4) {
				if (firstNote < secondNote) {
					return this.scale.slice(secondNote - 1, secondNote);
				}
				if (firstNote > secondNote) {
					return this.scale.slice(secondNote + 1, secondNote + 2);
				}
			}
		}
		return scale;
	}

	getRandomNoteOfScale(scale) {
		let random = Math.floor(Math.random() * (scale.length - 1));
		return scale[random];
	}

	randomNote(min, max) {
		min = Math.ceil(min);
		max = Math.floor(max);
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}

	checkEnding() {
		let lastNote = '1m';
		if (this.settings.beat === '3/4') lastNote = '2n.';
		this.melody.push({ note: this.melody[0].note, time: lastNote });
	}

	getDifference(index1, index2) {
		return Math.abs(index1 - index2);
	}

	getIntervals() {
		const intervals = [];
		for (let i = 1; i < this.melody.length - 1; i++) {
			let difference = this.getDifference(
				this.scale.indexOf(this.melody[i].note), 
				this.scale.indexOf(this.melody[i - 1].note)
			);
			intervals.push(difference);
		}
		return intervals;
	}
}

module.exports = MelodyGenerator;
