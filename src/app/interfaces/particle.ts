export interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  rotation: number;
  rotationSpeed: number;
  type:
    | 'whole-note'
    | 'half-note'
    | 'quarter-note'
    | 'eighth-note'
    | 'sixteenth-note'
    | 'beamed-eighths'
    | 'quarter-rest'
    | 'eighth-rest'
    | 'whole-rest'
    | 'treble-clef'
    | 'bass-clef'
    | 'sharp'
    | 'flat'
    | 'natural';
  color: string;
  phase: number;
}
