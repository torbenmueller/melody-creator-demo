import { isPlatformBrowser } from '@angular/common';
import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy, PLATFORM_ID, inject } from '@angular/core';
import { CreationService } from '../../services/creation.service';
import { RenderContext, Vex } from 'vexflow';
import { Subscription } from 'rxjs';
import { Scale } from '../../interfaces/melody-model';

@Component({
    selector: 'app-score',
    imports: [],
    templateUrl: './score.component.html',
    styleUrl: './score.component.css'
})
export class ScoreComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  totalMeasures: number = 0;
  composedMelody!: any[];
  melodySettings: any;
  scale!: Scale;
  scoreData: any;
  private viewReady = false;
  private dataReady = false;
  private sub?: Subscription;

  @ViewChild('scoreEl', { static: false }) scoreEl!: ElementRef<HTMLDivElement>;
  @ViewChild('score2El', { static: false }) score2El!: ElementRef<HTMLDivElement>;
  @ViewChild('score3El', { static: false }) score3El!: ElementRef<HTMLDivElement>;

  constructor(
    public creationService: CreationService
  ) { }

  ngOnInit(): void {
    this.sub = this.creationService.scoreData.subscribe(data => {
      // Skip if we receive the same data twice (defensive programming)
      if (data?.melody === this.composedMelody && 
          data?.settings === this.melodySettings && 
          data?.scale === this.scale) {
        return;
      }
      
      this.composedMelody = data.melody;
      this.melodySettings = data.settings;
      this.scale = data.scale;
      this.dataReady = !!(this.composedMelody && this.melodySettings && this.melodySettings.bar != null);
      if (this.viewReady && this.dataReady) this.createScore();
    });
    
    // Request current score data after subscribing
    this.creationService.getScoreData();
  }
  
  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
  
  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.viewReady = true;
    if (this.dataReady) this.createScore();
  }
  
  createScore() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.totalMeasures = 0;
    const VF = Vex.Flow;  
    const div = this.scoreEl?.nativeElement as HTMLDivElement;
    const div2 = this.score2El?.nativeElement as HTMLDivElement;
    const div3 = this.score3El?.nativeElement as HTMLDivElement;
    
    // Clear existing content
    if (div) div.innerHTML = '';
    if (div2) div2.innerHTML = '';
    if (div3) div3.innerHTML = '';

    // Create first renderer (always needed)
    const renderer = new VF.Renderer(div, VF.Renderer.Backends.SVG);
    renderer.resize(1202, 120);
    const context = renderer.getContext();
    
    let context2: any = null;
    let context3: any = null;
    
    // Only create second renderer if we have more than 2 bars
    if (this.melodySettings && this.melodySettings.bar > 2) {
      const renderer2 = new VF.Renderer(div2, VF.Renderer.Backends.SVG);
      renderer2.resize(1202, 120);
      context2 = renderer2.getContext();
      
      // Only create third renderer if we have more than 4 bars
      if (this.melodySettings && this.melodySettings.bar > 4) {
        const renderer3 = new VF.Renderer(div3, VF.Renderer.Backends.SVG);
        renderer3.resize(1202, 120);
        context3 = renderer3.getContext();
      }
    }

    this.createMeasures(this.melodySettings, context, context2, context3);
  }

  createMeasures(settings: { bar: any; rootKey: string; scale: string; }, context: any, context2: any, context3: any) {
    const measures = settings.bar
    const { Stave, StaveNote, Beam, Formatter, Accidental, KeySignature, Dot } = Vex.Flow;

    const staveMeasure1 = new Stave(0, 0, 300);
    const staveMeasure2 = new Stave(staveMeasure1.getWidth() + staveMeasure1.getX(), 0, 300);
    const staveMeasure3 = new Stave(staveMeasure2.getWidth() + staveMeasure2.getX(), 0, 300);
    const staveMeasure4 = new Stave(staveMeasure3.getWidth() + staveMeasure3.getX(), 0, 300);
    const staveMeasure5 = new Stave(0, 0, 300);
    const staveMeasure6 = new Stave(staveMeasure5.getWidth() + staveMeasure5.getX(), 0, 300);
    const staveMeasure7 = new Stave(staveMeasure6.getWidth() + staveMeasure6.getX(), 0, 300);
    const staveMeasure8 = new Stave(staveMeasure7.getWidth() + staveMeasure7.getX(), 0, 300);
    const staveMeasure9 = new Stave(0, 0, 300);

    let notesMeasure1: any[] = [];
    let notesMeasure2: any[] = [];
    let notesMeasure3: any[] = [];
    let notesMeasure4: any[] = [];
    let notesMeasure5: any[] = [];
    let notesMeasure6: any[] = [];
    let notesMeasure7: any[] = [];
    let notesMeasure8: any[] = [];
    let notesMeasure9: any[] = [];

    let staveMeasures = [
      staveMeasure1, staveMeasure2, staveMeasure3, staveMeasure4,
      staveMeasure5, staveMeasure6, staveMeasure7, staveMeasure8
    ];

    let notesMeasures = [
      notesMeasure1, notesMeasure2, notesMeasure3, notesMeasure4,
      notesMeasure5, notesMeasure6, notesMeasure7, notesMeasure8
    ];

    const keySignature = new KeySignature(settings.rootKey);

    staveMeasure1.addClef("treble").addTimeSignature(this.melodySettings.beat);
    if (this.checkForScalesWithoutSign(settings.scale)) keySignature.addToStave(staveMeasure1);
    staveMeasure1.setContext(context).draw();

    let index = 0;

    while (this.totalMeasures < measures) {
      // Track accidentals shown within this measure per pitch (letter+octave)
      const shownAccidentals: { [k: string]: string } = {};
      let measure = 0;
      let ct: RenderContext = context!;
      let beat = 1;
      if (this.melodySettings.beat === '3/4') beat = 0.75;
      while (measure < beat) {
        const timeToken = this.composedMelody[index].time;
        let duration = "";

        // 1/2, 1/4 and 1/8 notes
        if (timeToken.length === 2 && !timeToken.endsWith('t')) {
          duration = timeToken.charAt(0);
        }
        
        // 1/16 and 1/32 notes
        if (timeToken.length === 3 && !timeToken.endsWith('.')) {
          duration = timeToken.substring(0, timeToken.length - 1);
        }

        // Dotted 1/8 notes
        if (timeToken.length === 3 && timeToken.endsWith('.')) {
          duration = timeToken.charAt(0);
        }

        const isDotted = timeToken.includes('.');
        let note = this.composedMelody[index].note;
        let noteLowerCase = this.firstCharToLowerCase(note);
        let keys = this.addSlash(noteLowerCase);
        const letter = note[0].toUpperCase();
        const octave = note.slice(-1);
        const noteId = `${letter}${octave}`;

        function addNoteWithoutAccidental(totalMeasures: number) {
          const n = new StaveNote({ clef: 'treble', keys: [keys], duration: duration, auto_stem: true });
          if (isDotted) Dot.buildAndAttach([n], { all: true });
          notesMeasures[totalMeasures].push(n);
        }

        /* if (this.checkForHarmonicMinorScale(settings.scale)) {
          let noteAbove = this.scale[this.scale.indexOf(note) + 1];
          if (noteAbove.slice(0, -1) === settings.key) console.log(note, noteAbove.slice(0, -1), "ROOTKEY!");
        }

        if (this.checkForMelodicMinorScale(settings.scale)) {
          console.log("Melodic Minor");
        } */

        // Add accidentals if needed. For Chromatic/Whole Tone we manage explicit accidentals from note spelling.
        if (!this.checkForScalesWithoutSign(settings.scale)) {
          let sign = this.checkForSign(note);
          if (sign.length > 0) {
            const n = new StaveNote({ clef: 'treble', keys: [keys], duration: duration, auto_stem: true });
            if (isDotted) Dot.buildAndAttach([n], { all: true });
            if (shownAccidentals[noteId] !== sign) {
              notesMeasures[this.totalMeasures].push(
                n.addModifier(new Accidental(sign), 0)
              );
              shownAccidentals[noteId] = sign;
            } else {
              notesMeasures[this.totalMeasures].push(n);
            }
          } else {
            if (index > 0 && this.composedMelody[index -1].note.length === 3) {
              let lastNote = this.removeMiddleChar(this.composedMelody[index -1].note)
              if (note === lastNote) {
                const n2 = new StaveNote({ clef: 'treble', keys: [keys], duration: duration, auto_stem: true });
                if (isDotted) Dot.buildAndAttach([n2], { all: true });
                if (shownAccidentals[noteId] !== 'n') {
                  notesMeasures[this.totalMeasures].push(
                    n2.addModifier(new Accidental('n'), 0)
                  );
                  shownAccidentals[noteId] = 'n';
                } else {
                  notesMeasures[this.totalMeasures].push(n2);
                }
              } else {
                addNoteWithoutAccidental(this.totalMeasures);
              }
            } else {
              addNoteWithoutAccidental(this.totalMeasures);
            }
          }
        } else {
          // Key signature is shown. First add explicit accidentals from note spelling; otherwise inject minor-scale exceptions.
          const spelledSign = this.checkForSign(note);
          if (spelledSign.length > 0) {
            // Only add if the explicit accidental differs from what the key signature already implies
            const impliedAlter = this.keySignatureAlterMap(this.keyNameToFifths(settings.rootKey))[letter] ?? 0;
            const spelledAlter = this.accidentalCharToAlter(spelledSign);
            if (spelledAlter !== impliedAlter) {
              const n = new StaveNote({ clef: 'treble', keys: [keys], duration: duration, auto_stem: true });
              if (isDotted) Dot.buildAndAttach([n], { all: true });
              if (shownAccidentals[noteId] !== spelledSign) {
                notesMeasures[this.totalMeasures].push(
                  n.addModifier(new Accidental(spelledSign), 0)
                );
                shownAccidentals[noteId] = spelledSign;
              } else {
                notesMeasures[this.totalMeasures].push(n);
              }
            } else {
              addNoteWithoutAccidental(this.totalMeasures);
            }
          } else {
            const extraAcc = this.getAccidentalForMinorExceptions(note, settings.rootKey, settings.scale);
            if (extraAcc) {
              const n = new StaveNote({ clef: 'treble', keys: [keys], duration: duration, auto_stem: true });
              if (isDotted) Dot.buildAndAttach([n], { all: true });
              if (shownAccidentals[noteId] !== extraAcc) {
                notesMeasures[this.totalMeasures].push(
                  n.addModifier(new Accidental(extraAcc), 0)
                );
                shownAccidentals[noteId] = extraAcc;
              } else {
                notesMeasures[this.totalMeasures].push(n);
              }
            } else {
              addNoteWithoutAccidental(this.totalMeasures);
            }
          }
        }

        let incr = 1 / +duration;
        if (isDotted) incr *= 1.5;
        measure += incr;
        index++;
      }
      /* if (this.totalMeasures < 4) ct = context; */
      if (this.totalMeasures > 3) ct = context2;
      if (staveMeasures[this.totalMeasures] === staveMeasure5) {
        staveMeasure5.addClef("treble");
        if (this.checkForScalesWithoutSign(settings.scale)) keySignature.addToStave(staveMeasure5);
      }

      const beams = Beam.generateBeams(notesMeasures[this.totalMeasures]);
      staveMeasures[this.totalMeasures].setContext(ct).draw();
      Formatter.FormatAndDraw(ct, staveMeasures[this.totalMeasures], notesMeasures[this.totalMeasures]);
      beams.forEach(b => {
          b.setContext(ct).draw();
      });

      this.totalMeasures++;
    }

    // Add last note
    const timeTokenLast = this.composedMelody[this.composedMelody.length - 1].time;
    let duration = timeTokenLast.charAt(0);
    const isDottedLast = timeTokenLast.length > 2 || timeTokenLast.includes('.');
    let note = this.composedMelody[this.composedMelody.length - 1].note;
    let noteLowerCase = this.firstCharToLowerCase(note);
    let keys = this.addSlash(noteLowerCase);
    let sign = '';

    if (!this.checkForScalesWithoutSign(settings.scale)) {
      sign = this.checkForSign(note);
    } else {
      // With key signature: prefer explicit note accidental; otherwise apply minor exception if needed
      const spelledSign = this.checkForSign(note);
      if (spelledSign.length > 0) {
        const letter = note[0].toUpperCase();
        const impliedAlter = this.keySignatureAlterMap(this.keyNameToFifths(settings.rootKey))[letter] ?? 0;
        const spelledAlter = this.accidentalCharToAlter(spelledSign);
        if (spelledAlter !== impliedAlter) sign = spelledSign;
      } else {
        const extraAcc = this.getAccidentalForMinorExceptions(note, settings.rootKey, settings.scale);
        if (extraAcc) sign = extraAcc;
      }
    }

    if (measures == 2) {
      const shownAccidentalsLast: { [k: string]: string } = {};
      const letter = note[0].toUpperCase();
      const octave = note.slice(-1);
      const noteId = `${letter}${octave}`;
      if (sign.length > 0) {
        const n = new StaveNote({ clef: 'treble', keys: [keys], duration: duration, auto_stem: true });
        if (isDottedLast) Dot.buildAndAttach([n], { all: true });
        if (shownAccidentalsLast[noteId] !== sign) {
          notesMeasure3.push(n.addModifier(new Accidental(sign), 0));
          shownAccidentalsLast[noteId] = sign;
        } else {
          notesMeasure3.push(n);
        }
      } else {
        const n = new StaveNote({ clef: 'treble', keys: [keys], duration: duration, auto_stem: true });
        if (isDottedLast) Dot.buildAndAttach([n], { all: true });
        notesMeasure3.push(n);
      }
      staveMeasure3.setContext(context).draw();
      Formatter.FormatAndDraw(context, staveMeasure3, notesMeasure3);
    }

    if (measures == 4) {
      const shownAccidentalsLast: { [k: string]: string } = {};
      const letter = note[0].toUpperCase();
      const octave = note.slice(-1);
      const noteId = `${letter}${octave}`;
      staveMeasure5.addClef("treble");
      if (this.checkForScalesWithoutSign(settings.scale)) keySignature.addToStave(staveMeasure5);
      staveMeasure5.setContext(context2).draw();
      if (sign.length > 0) {
        const n = new StaveNote({ clef: 'treble', keys: [keys], duration: duration, auto_stem: true });
        if (isDottedLast) Dot.buildAndAttach([n], { all: true });
        if (shownAccidentalsLast[noteId] !== sign) {
          notesMeasure5.push(n.addModifier(new Accidental(sign), 0));
          shownAccidentalsLast[noteId] = sign;
        } else {
          notesMeasure5.push(n);
        }
      } else {
        const n = new StaveNote({ clef: 'treble', keys: [keys], duration: duration, auto_stem: true });
        if (isDottedLast) Dot.buildAndAttach([n], { all: true });
        notesMeasure5.push(n);
      }
      staveMeasure5.setContext(context2).draw();
      Formatter.FormatAndDraw(context2, staveMeasure5, notesMeasure5);
    }

    if (measures == 8) {
      const shownAccidentalsLast: { [k: string]: string } = {};
      const letter = note[0].toUpperCase();
      const octave = note.slice(-1);
      const noteId = `${letter}${octave}`;
      staveMeasure9.addClef("treble");
      if (this.checkForScalesWithoutSign(settings.scale)) keySignature.addToStave(staveMeasure9);
      staveMeasure9.setContext(context3).draw();
      if (sign.length > 0) {
        const n = new StaveNote({ clef: 'treble', keys: [keys], duration: duration, auto_stem: true });
        if (isDottedLast) Dot.buildAndAttach([n], { all: true });
        if (shownAccidentalsLast[noteId] !== sign) {
          notesMeasure9.push(n.addModifier(new Accidental(sign), 0));
          shownAccidentalsLast[noteId] = sign;
        } else {
          notesMeasure9.push(n);
        }
      } else {
        const n = new StaveNote({ clef: 'treble', keys: [keys], duration: duration, auto_stem: true });
        if (isDottedLast) Dot.buildAndAttach([n], { all: true });
        notesMeasure9.push(n);
      }
      staveMeasure9.setContext(context3).draw();
      Formatter.FormatAndDraw(context3, staveMeasure9, notesMeasure9);
    }

  }

  firstCharToLowerCase(str: string) {
    if (str.length === 0) return str;
    return str.charAt(0).toLowerCase() + str.slice(1);
  }

  addSlash(str: string) {
    if (str.length === 0) return str;
    if (str.length === 2) {
      return str.charAt(0) + "/" + str.slice(1);
    }
    return str.slice(0, 2) + "/" + str.slice(2);
  }

  checkForHarmonicMinorScale(scale: string) {
    if (scale === "Harmonic Minor") return true;
    return false;
  }

  checkForMelodicMinorScale(scale: string) {
    if (scale === "Melodic Minor") return true;
    return false;
  }

  checkForScalesWithoutSign(scale: string) {
    // Show key signature for all scales except Chromatic and Whole Tone
    if (scale !== "Chromatic" && scale !== "Whole Tone") return true;
    return false;
  }

  checkForSign(note: string) {
    let sign = '';
    if (note.length === 3) sign = this.getSign(note);
    return sign;
  }

  getSign(note: string) {
    return note[1];
  }

  removeMiddleChar(note: string) {
    return note.substring(0, 1) + note.substring(2);
  }

  // Compute extra accidental needed for Melodic/Harmonic Minor relative to the key signature, for any root.
  // Returns '', 'n', '#', or '##'. Only applied when the note has no explicit accidental in its spelling.
  private getAccidentalForMinorExceptions(note: string, rootKey: string, scale: string): string {
    if (note.length !== 2) return '';
    const letter = note[0].toUpperCase();
    const targetLetters = this.getRaisedDegreeLettersForScale(this.melodySettings.key, scale);
    if (!targetLetters.has(letter)) return '';
    const fifths = this.keyNameToFifths(rootKey);
    const alterMap = this.keySignatureAlterMap(fifths);
    const impliedAlter = alterMap[letter] ?? 0; // -1 flat, 0 natural, +1 sharp
    const desiredAlter = impliedAlter + 1; // raise by a semitone for the exception
    if (desiredAlter === 0) return 'n';
    if (desiredAlter === 1) return '#';
    if (desiredAlter === 2) return '##';
    return '';
  }

  // Determine which diatonic letters correspond to raised degrees for melodic/harmonic minor
  private getRaisedDegreeLettersForScale(tonicKey: string, scale: string): Set<string> {
    const tonicLetter = tonicKey[0].toUpperCase();
    const letters = ['C','D','E','F','G','A','B'];
    const idx = letters.indexOf(tonicLetter);
    const rotated = letters.slice(idx).concat(letters.slice(0, idx));
    const set = new Set<string>();
    if (scale === 'Harmonic Minor') {
      set.add(rotated[6]); // 7th degree
    } else if (scale === 'Melodic Minor') {
      set.add(rotated[5]); // 6th degree
      set.add(rotated[6]); // 7th degree
    }
    return set;
  }

  // Map key name to number of fifths (relative major displayed as rootKey)
  private keyNameToFifths(keyName: string) {
    const m = keyName.trim();
    const map: { [k: string]: number } = {
      'C': 0,
      'G': 1,
      'D': 2,
      'A': 3,
      'E': 4,
      'B': 5,
      'F#': 6,
      'C#': 7,
      'F': -1,
      'Bb': -2,
      'A#': -2,
      'Eb': -3,
      'D#': -3,
      'Ab': -4,
      'G#': -4,
      'Db': -5,
      'C#b': -5,
      'Gb': -6,
      'F##': -6,
      'Cb': -7,
    };
    const key = Object.keys(map).find(k => k.toUpperCase() === m.toUpperCase());
    return key ? map[key] : 0;
  }

  // Return map of step->alter implied by key signature
  private keySignatureAlterMap(fifths: number) {
    const sharps = ['F','C','G','D','A','E','B'];
    const flats = ['B','E','A','D','G','C','F'];
    const map: {[k:string]:number} = {};
    if (fifths > 0) {
      for (let i=0;i<fifths;i++) map[sharps[i]] = 1;
    } else if (fifths < 0) {
      for (let i=0;i<Math.abs(fifths);i++) map[flats[i]] = -1;
    }
    return map;
  }

  // Map single accidental char to alter number
  private accidentalCharToAlter(ch: string): number {
    if (ch === '#') return 1;
    if (ch === 'b') return -1;
    if (ch === 'n') return 0;
    return 0;
  }
}
