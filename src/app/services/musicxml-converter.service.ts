import { Injectable } from '@angular/core';

type MelodyNote = { note: string; time: string };

@Injectable({
  providedIn: 'root',
})
export class MusicxmlConverterService {
  // divisions = ticks per quarter note used in MusicXML durations
  private divisions = 480;

  // map rhythmic tokens to quarter-note beats
  private durationBeatMap: { [k: string]: number } = {
    '64n': 1 / 16,
    '32n': 1 / 8,
    '16n': 1 / 4,
    '8n': 1 / 2,
    '4n': 1,
    '2n': 2,
    '1n': 4,
    '1m': NaN, // special: measure length, resolved later
  };

  constructor() {}

  // Public: download the MusicXML file
  downloadMusicXml(melody: MelodyNote[], melodyName: string, opts: { timeSignature?: string; key?: string } = {}) {
    const timeSignature = opts.timeSignature || '4/4';
    const key = opts.key || 'C';

    const [beatsPerMeasure, beatType] = timeSignature.split('/').map(s => parseInt(s, 10));
    if (!beatsPerMeasure || !beatType) throw new Error('Invalid time signature');

    // compute measures for '1m' durations
    const xml = this.buildMusicXml(melody, melodyName, beatsPerMeasure, beatType, key);
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${melodyName}.xml`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // Build the full MusicXML string
  private currentKeyAlterMap: {[step: string]: number} = {};

  private buildMusicXml(melody: MelodyNote[], melodyName: string, beatsPerMeasure: number, beatType: number, keyName: string) {
    const header = `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">\n`;
    let xml = header + `<score-partwise version="3.1">\n  <work>\n    <work-title>${this.escapeXml(melodyName)}</work-title>\n  </work>\n  <identification>\n    <encoding>\n      <software>Angular MusicXmlService</software>\n    </encoding>\n  </identification>\n  <part-list>\n    <score-part id="P1">\n      <part-name>Music</part-name>\n    </score-part>\n  </part-list>\n  <part id="P1">\n`;

    // Convert melody notes into measures, splitting and tying when necessary
    const measures = this.splitIntoMeasures(melody, beatsPerMeasure, beatType);

    // build each measure and include attributes in measure 1
    measures.forEach((measureNotes, idx) => {
      const measureNumber = idx + 1;
      xml += `    <measure number="${measureNumber}">\n`;
      if (measureNumber === 1) {
        // attributes block (divisions, key, time, clef)
        const fifths = this.keyNameToFifths(keyName);
        this.currentKeyAlterMap = this.keySignatureAlterMap(fifths);
        xml += `      <attributes>\n        <divisions>${this.divisions}</divisions>\n        <key>\n          <fifths>${fifths}</fifths>\n        </key>\n        <time>\n          <beats>${beatsPerMeasure}</beats>\n          <beat-type>${beatType}</beat-type>\n        </time>\n        <clef>\n          <sign>G</sign>\n          <line>2</line>\n        </clef>\n      </attributes>\n`;
      }

      // notes in this measure
      measureNotes.forEach(n => {
        xml += this.noteToXml(n);
      });

      xml += `    </measure>\n`;
    });

    xml += `  </part>\n</score-partwise>\n`;
    return xml;
  }

  // Convert a single note object (after splitting) to MusicXML string
  private noteToXml(n: any) {
    // n: {type: 'note'|'rest', step?, alter?, octave?, durationBeats, tied?: 'start'|'stop'|'continue', voice?: number}
    if (n.type === 'rest') {
      const durTicks = Math.round(n.durationBeats * this.divisions);
      return `      <note>\n        <rest/>\n        <duration>${durTicks}</duration>\n      </note>\n`;
    }

    const durTicks = Math.round(n.durationBeats * this.divisions);
    let xml = '      <note>\n';
    xml += `        <pitch>\n          <step>${n.step}</step>\n`;
    if (typeof n.alter === 'number') {
      xml += `          <alter>${n.alter}</alter>\n`;
    }
    xml += `          <octave>${n.octave}</octave>\n        </pitch>\n`;
    xml += `        <duration>${durTicks}</duration>\n`;

    // type element: map beats back to type (prefer common types). We'll use quarter-based types.
    xml += `        <type>${this.beatsToType(n.durationBeats)}</type>\n`;

    // accidental only if not already implied by key signature
    const sigAlter = this.currentKeyAlterMap[n.step] ?? 0;
    if (typeof n.alter === 'number' && n.alter !== sigAlter) {
      const acc = this.alterToAccidental(n.alter);
      if (acc) xml += `        <accidental>${acc}</accidental>
`;
    }

    // dotted detection
    if (this.isDotted(n.durationBeats)) {
      xml += '        <dot/>\n';
    }

    // ties
    if (n.tie === 'start' || n.tie === 'stop' || n.tie === 'continue') {
      // for MusicXML we need <tie> and <notations><tied type="..."/></notations>
      xml += `        <tie type="${n.tie === 'continue' ? 'start' : n.tie}"/>\n`;
      // We will place tied notation as separate element after duration
      // create notations block
      xml += `        <notations>\n          <tied type="${n.tie === 'continue' ? 'start' : n.tie}"/>\n        </notations>\n`;
    }

    xml += '      </note>\n';
    return xml;
  }

  // decide whether a duration implies a dot (simple heuristic)
  private isDotted(beats: number) {
    // dotted values will have .5 fraction in many cases when divisions=480 (e.g. dotted eighth = 0.75)
    // We'll identify common dotted durations: 1.5 (dotted quarter), 3 (dotted half), 0.75 (dotted eighth), 6 (dotted whole) etc.
    const rounded = Math.round(beats * 1000) / 1000;
    const dottedCandidates = [1.5, 3, 0.75, 6, 1.5 / 2];
    return dottedCandidates.includes(rounded);
  }

  // convert beats (quarter-note units) to MusicXML <type>
  // picks the closest standard type: 64th,32nd,16th,eighth,quarter,half,whole
  private beatsToType(beats: number) {
    const map = [
      { name: '64th', beats: 1 / 16 },
      { name: '32nd', beats: 1 / 8 },
      { name: '16th', beats: 1 / 4 },
      { name: 'eighth', beats: 1 / 2 },
      { name: 'quarter', beats: 1 },
      { name: 'half', beats: 2 },
      { name: 'whole', beats: 4 },
    ];
    // prefer exact matches or closest smaller-or-equal type
    for (let i = map.length - 1; i >= 0; i--) {
      if (beats >= map[i].beats - 1e-9) return map[i].name;
    }
    return 'quarter';
  }

  // split the incoming melody into measures; return array of arrays of note segments
  private splitIntoMeasures(melody: MelodyNote[], beatsPerMeasure: number, beatType: number) {
    const measures: any[][] = [];
    let currentMeasure: any[] = [];
    let remainingBeats = beatsPerMeasure;

    const pushMeasure = () => {
      measures.push(currentMeasure);
      currentMeasure = [];
      remainingBeats = beatsPerMeasure;
    };

    for (const item of melody) {
      const { isRest, beats, dotted } = this.timeTokenToBeats(item.time, beatsPerMeasure);
      let left = beats;
      const isRestFlag = this.isRestToken(item.note);

      while (left > 0.000001) {
        if (left <= remainingBeats + 1e-9) {
          // fits into current measure
          const seg = this.makeSegment(item.note, left, isRestFlag);
          // tie handling: if this is a continuation of a split from previous measure, mark ties
          if (left !== beats) seg.tie = 'stop';
          else if (beats > left) seg.tie = 'start';
          currentMeasure.push(seg);
          remainingBeats -= left;
          left = 0;
          if (Math.abs(remainingBeats) < 1e-9) pushMeasure();
        } else {
          // doesn't fit: create segment for remainingBeats and tie
          const seg = this.makeSegment(item.note, remainingBeats, isRestFlag);
          seg.tie = 'start';
          currentMeasure.push(seg);
          left -= remainingBeats;
          pushMeasure();
          // next segment will be handled in next loop iteration
        }
      }
    }

    // push last measure if not empty
    if (currentMeasure.length > 0) measures.push(currentMeasure);
    return measures;
  }

  private makeSegment(noteName: string, durationBeats: number, isRestFlag: boolean) {
    if (isRestFlag) return { type: 'rest', durationBeats };
    const pitch = this.parsePitch(noteName);
    return {
      type: 'note',
      step: pitch.step,
      alter: pitch.alter,
      octave: pitch.octave,
      durationBeats,
      // tie can be 'start' | 'stop' | 'continue' or undefined; annotate so later assignments are type-compatible
      tie: undefined as 'start' | 'stop' | 'continue' | undefined,
    };
  }

  // parse tokens like 'C4', 'Eb4', 'F#3' into step/alter/octave
  private parsePitch(token: string) {
    // Accept also 'R' or 'rest'
    const t = token.trim();
    if (/^(r|rest)$/i.test(t)) return { rest: true } as any;

    // e.g. Eb4 or E#5 or C4
    const m = t.match(/^([A-Ga-g])([#b]?)(\d+)$/);
    if (!m) throw new Error(`Invalid pitch token: ${token}`);
    const step = m[1].toUpperCase();
    const acc = m[2] || '';
    const octave = parseInt(m[3], 10);
    let alter: number | undefined = undefined;
    if (acc === '#') alter = 1;
    else if (acc === 'b') alter = -1;
    return { step, alter, octave };
  }

  private isRestToken(token: string) {
    return /^(r|rest)$/i.test(token.trim());
  }

  // convert token like '4n', '2n.', '1m' to beats
  private timeTokenToBeats(token: string, beatsPerMeasure: number) {
    const dotted = token.endsWith('.');
    const base = dotted ? token.slice(0, -1) : token;
    if (base === '1m') {
      const beats = beatsPerMeasure;
      return { beats: dotted ? beats * 1.5 : beats, isRest: false, dotted };
    }
    const beatsBase = this.durationBeatMap[base];
    if (beatsBase == null || Number.isNaN(beatsBase)) throw new Error(`Unknown time token: ${token}`);
    const beats = dotted ? beatsBase * 1.5 : beatsBase;
    return { beats, isRest: false, dotted };
  }

  // map key name to number of fifths for MusicXML
  // return map of step->alter implied by key signature
  private keySignatureAlterMap(fifths: number) {
    // order: sharps: F C G D A E B ; flats: B E A D G C F
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

  private keyNameToFifths(keyName: string) {
    // normalize: allow 'Eb', 'D#', 'F#', 'Gb' etc.
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
      'A#': -2, // enharmonic
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
    // fallback: try uppercase
    const key = Object.keys(map).find(k => k.toUpperCase() === m.toUpperCase());
    return key ? map[key] : 0;
  }

  private alterToAccidental(alter: number) {
    if (alter === 1) return 'sharp';
    if (alter === -1) return 'flat';
    if (alter === 2) return 'double-sharp';
    if (alter === -2) return 'double-flat';
    return undefined;
  }

  private escapeXml(s: string) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
}
