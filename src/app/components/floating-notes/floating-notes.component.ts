import { isPlatformBrowser } from '@angular/common';
import { Component, ViewChild, ElementRef, AfterViewInit, OnDestroy, PLATFORM_ID, inject } from '@angular/core';
import { Particle } from '../../interfaces/particle';

@Component({
  selector: 'app-floating-notes',
  imports: [],
  templateUrl: './floating-notes.component.html',
  styleUrl: './floating-notes.component.css',
})
export class FloatingNotesComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvasRef', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;
  private readonly platformId = inject(PLATFORM_ID);
  
  private particles: Particle[] = [];
  private animFrameId: number = 0;
  private resizeListener?: () => void;
  private visibilityChangeListener?: () => void;
  private canvasWidth: number = 0;
  private canvasHeight: number = 0;

  private getParticleCount(): number {
    if (!isPlatformBrowser(this.platformId)) {
      return 32;
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return 16;
    }

    if (this.canvasWidth < 768) {
      return 28;
    }

    if (this.canvasWidth < 1200) {
      return 40;
    }

    return 64;
  }

  static readonly COLORS = [
  "hsl(300 70% 55%)",
  "hsl(330 80% 60%)",
  "hsl(280 65% 60%)",
  "hsl(260 50% 50%)",
  "hsl(300 70% 70%)",
];

static readonly NOTE_TYPES: Particle["type"][] = [
  "whole-note",
  "half-note",
  "quarter-note",
  "quarter-note",
  "eighth-note",
  "eighth-note",
  "sixteenth-note",
  "beamed-eighths",
  "beamed-eighths",
  "quarter-rest",
  "eighth-rest",
  "whole-rest",
  "treble-clef",
  "bass-clef",
  "sharp",
  "flat",
  "natural",
];

// --- Drawing helpers ---

drawNoteHead(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  filled: boolean
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.25);
  ctx.beginPath();
  ctx.ellipse(0, 0, s * 0.58, s * 0.42, 0, 0, Math.PI * 2);
  if (filled) {
    ctx.fill();
  } else {
    ctx.lineWidth = s * 0.13;
    ctx.stroke();
  }
  ctx.restore();
}

drawStem(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  stemH: number
) {
  ctx.lineWidth = s * 0.1;
  ctx.beginPath();
  ctx.moveTo(x + s * 0.5, y);
  ctx.lineTo(x + s * 0.5, y - stemH);
  ctx.stroke();
}

drawFlag(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  stemH: number
) {
  const top = y - stemH;
  ctx.lineWidth = s * 0.1;
  ctx.beginPath();
  ctx.moveTo(x + s * 0.5, top);
  ctx.bezierCurveTo(
    x + s * 1.5,
    top + stemH * 0.15,
    x + s * 1.2,
    top + stemH * 0.4,
    x + s * 0.55,
    top + stemH * 0.45
  );
  ctx.stroke();
}

drawDoubleFlag(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  stemH: number
) {
  const top = y - stemH;
  ctx.lineWidth = s * 0.09;
  for (let i = 0; i < 2; i++) {
    const offset = i * stemH * 0.18;
    ctx.beginPath();
    ctx.moveTo(x + s * 0.5, top + offset);
    ctx.bezierCurveTo(
      x + s * 1.4,
      top + offset + stemH * 0.12,
      x + s * 1.1,
      top + offset + stemH * 0.32,
      x + s * 0.55,
      top + offset + stemH * 0.38
    );
    ctx.stroke();
  }
}

// --- Individual note/element drawing ---

drawWholeNote(ctx: CanvasRenderingContext2D, s: number) {
  // Hollow oval with inner hole shape
  ctx.save();
  ctx.rotate(-0.25);
  ctx.beginPath();
  ctx.ellipse(0, 0, s * 0.65, s * 0.45, 0, 0, Math.PI * 2);
  ctx.lineWidth = s * 0.18;
  ctx.stroke();
  ctx.restore();
}

drawHalfNote(ctx: CanvasRenderingContext2D, s: number) {
  this.drawNoteHead(ctx, 0, 0, s, false);
  this.drawStem(ctx, 0, 0, s, s * 2.4);
}

drawQuarterNote(ctx: CanvasRenderingContext2D, s: number) {
  this.drawNoteHead(ctx, 0, 0, s, true);
  this.drawStem(ctx, 0, 0, s, s * 2.4);
}

drawEighthNote(ctx: CanvasRenderingContext2D, s: number) {
  this.drawNoteHead(ctx, 0, 0, s, true);
  this.drawStem(ctx, 0, 0, s, s * 2.6);
  this.drawFlag(ctx, 0, 0, s, s * 2.6);
}

drawSixteenthNote(ctx: CanvasRenderingContext2D, s: number) {
  this.drawNoteHead(ctx, 0, 0, s, true);
  this.drawStem(ctx, 0, 0, s, s * 2.8);
  this.drawDoubleFlag(ctx, 0, 0, s, s * 2.8);
}

drawBeamedEighths(ctx: CanvasRenderingContext2D, s: number) {
  const gap = s * 1.6;
  // Two note heads
  this.drawNoteHead(ctx, -gap * 0.5, 0, s * 0.85, true);
  this.drawNoteHead(ctx, gap * 0.5, 0, s * 0.85, true);
  // Stems
  const stemH = s * 2.2;
  ctx.lineWidth = s * 0.1;
  ctx.beginPath();
  ctx.moveTo(-gap * 0.5 + s * 0.42, 0);
  ctx.lineTo(-gap * 0.5 + s * 0.42, -stemH);
  ctx.moveTo(gap * 0.5 + s * 0.42, 0);
  ctx.lineTo(gap * 0.5 + s * 0.42, -stemH);
  ctx.stroke();
  // Beam
  ctx.lineWidth = s * 0.22;
  ctx.beginPath();
  ctx.moveTo(-gap * 0.5 + s * 0.42, -stemH);
  ctx.lineTo(gap * 0.5 + s * 0.42, -stemH);
  ctx.stroke();
}

drawQuarterRest(ctx: CanvasRenderingContext2D, s: number) {
  const h = s * 2.8;
  ctx.lineWidth = s * 0.16;
  ctx.beginPath();
  // Zig-zag quarter rest shape
  ctx.moveTo(s * 0.3, -h * 0.5);
  ctx.lineTo(-s * 0.25, -h * 0.2);
  ctx.lineTo(s * 0.3, h * 0.05);
  ctx.bezierCurveTo(
    s * 0.1,
    h * 0.2,
    -s * 0.4,
    h * 0.15,
    -s * 0.15,
    h * 0.35
  );
  ctx.bezierCurveTo(s * 0.15, h * 0.25, s * 0.05, h * 0.45, -s * 0.2, h * 0.5);
  ctx.stroke();
}

drawEighthRest(ctx: CanvasRenderingContext2D, s: number) {
  ctx.lineWidth = s * 0.14;
  // Dot
  ctx.beginPath();
  ctx.arc(s * 0.2, -s * 0.7, s * 0.16, 0, Math.PI * 2);
  ctx.fill();
  // Curved line down
  ctx.beginPath();
  ctx.moveTo(s * 0.2, -s * 0.7);
  ctx.bezierCurveTo(
    -s * 0.1,
    -s * 0.2,
    s * 0.3,
    s * 0.3,
    -s * 0.1,
    s * 0.9
  );
  ctx.stroke();
}

drawWholeRest(ctx: CanvasRenderingContext2D, s: number) {
  // Filled rectangle hanging from a line
  ctx.lineWidth = s * 0.08;
  // Staff line
  ctx.beginPath();
  ctx.moveTo(-s * 0.8, -s * 0.15);
  ctx.lineTo(s * 0.8, -s * 0.15);
  ctx.stroke();
  // Rest block hanging down
  ctx.fillRect(-s * 0.35, -s * 0.15, s * 0.7, s * 0.35);
}

drawTrebleClef(ctx: CanvasRenderingContext2D, s: number) {
  const scale = s * 0.08;
  ctx.lineWidth = s * 0.14;
  ctx.beginPath();
  // Bottom curl
  ctx.moveTo(scale * 1, scale * 14);
  ctx.bezierCurveTo(
    scale * -4, scale * 12,
    scale * -3, scale * 6,
    scale * 1, scale * 4
  );
  // Main curve up
  ctx.bezierCurveTo(
    scale * 5, scale * 2,
    scale * 6, scale * -3,
    scale * 2, scale * -7
  );
  // Top arch
  ctx.bezierCurveTo(
    scale * -2, scale * -10,
    scale * -6, scale * -6,
    scale * -3, scale * -2
  );
  // Inner curve back down
  ctx.bezierCurveTo(
    scale * -1, scale * 1,
    scale * 3, scale * 3,
    scale * 1, scale * 7
  );
  // Bottom S-curve
  ctx.bezierCurveTo(
    scale * -1, scale * 10,
    scale * -4, scale * 11,
    scale * -2, scale * 14
  );
  ctx.stroke();
  // Vertical line through center
  ctx.beginPath();
  ctx.moveTo(scale * 1, scale * -9);
  ctx.lineTo(scale * 1, scale * 16);
  ctx.stroke();
  // Bottom dot
  ctx.beginPath();
  ctx.arc(scale * 1, scale * 16.5, s * 0.12, 0, Math.PI * 2);
  ctx.fill();
}

drawBassClef(ctx: CanvasRenderingContext2D, s: number) {
  const scale = s * 0.09;
  ctx.lineWidth = s * 0.14;
  // Main curve
  ctx.beginPath();
  ctx.arc(scale * -1, scale * 0, scale * 5, -Math.PI * 0.75, Math.PI * 0.4);
  ctx.stroke();
  // Head dot
  ctx.beginPath();
  ctx.arc(scale * -4.5, scale * -2.5, s * 0.2, 0, Math.PI * 2);
  ctx.fill();
  // Two dots
  ctx.beginPath();
  ctx.arc(scale * 5, scale * -2, s * 0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(scale * 5, scale * 2, s * 0.15, 0, Math.PI * 2);
  ctx.fill();
}

drawSharp(ctx: CanvasRenderingContext2D, s: number) {
  ctx.lineWidth = s * 0.12;
  const w = s * 0.5;
  const h = s * 1.0;
  // Vertical lines
  ctx.beginPath();
  ctx.moveTo(-w * 0.35, -h);
  ctx.lineTo(-w * 0.35, h);
  ctx.moveTo(w * 0.35, -h);
  ctx.lineTo(w * 0.35, h);
  ctx.stroke();
  // Horizontal lines (slightly slanted)
  ctx.lineWidth = s * 0.18;
  ctx.beginPath();
  ctx.moveTo(-w, -h * 0.3);
  ctx.lineTo(w, -h * 0.15);
  ctx.moveTo(-w, h * 0.15);
  ctx.lineTo(w, h * 0.3);
  ctx.stroke();
}

drawFlat(ctx: CanvasRenderingContext2D, s: number) {
  ctx.lineWidth = s * 0.12;
  // Tall vertical stem
  ctx.beginPath();
  ctx.moveTo(-s * 0.15, -s * 1.2);
  ctx.lineTo(-s * 0.15, s * 0.6);
  ctx.stroke();
  // Rounded belly
  ctx.beginPath();
  ctx.moveTo(-s * 0.15, s * 0.0);
  ctx.bezierCurveTo(
    s * 0.6, -s * 0.1,
    s * 0.6, s * 0.5,
    -s * 0.15, s * 0.6
  );
  ctx.stroke();
}

drawNatural(ctx: CanvasRenderingContext2D, s: number) {
  ctx.lineWidth = s * 0.1;
  const w = s * 0.4;
  const h = s * 1.1;
  // Left vertical (tall, starts higher)
  ctx.beginPath();
  ctx.moveTo(-w, -h);
  ctx.lineTo(-w, h * 0.35);
  ctx.stroke();
  // Right vertical (tall, starts lower)
  ctx.beginPath();
  ctx.moveTo(w, -h * 0.35);
  ctx.lineTo(w, h);
  ctx.stroke();
  // Two horizontal lines (slightly slanted)
  ctx.lineWidth = s * 0.14;
  ctx.beginPath();
  ctx.moveTo(-w, -h * 0.25);
  ctx.lineTo(w, -h * 0.1);
  ctx.moveTo(-w, h * 0.1);
  ctx.lineTo(w, h * 0.25);
  ctx.stroke();
}

// --- Main drawing dispatch ---

drawParticle(ctx: CanvasRenderingContext2D, p: Particle) {
  switch (p.type) {
    case "whole-note":
      this.drawWholeNote(ctx, p.size);
      break;
    case "half-note":
      this.drawHalfNote(ctx, p.size);
      break;
    case "quarter-note":
      this.drawQuarterNote(ctx, p.size);
      break;
    case "eighth-note":
      this.drawEighthNote(ctx, p.size);
      break;
    case "sixteenth-note":
      this.drawSixteenthNote(ctx, p.size);
      break;
    case "beamed-eighths":
      this.drawBeamedEighths(ctx, p.size);
      break;
    case "quarter-rest":
      this.drawQuarterRest(ctx, p.size);
      break;
    case "eighth-rest":
      this.drawEighthRest(ctx, p.size);
      break;
    case "whole-rest":
      this.drawWholeRest(ctx, p.size);
      break;
    case "treble-clef":
      this.drawTrebleClef(ctx, p.size);
      break;
    case "bass-clef":
      this.drawBassClef(ctx, p.size);
      break;
    case "sharp":
      this.drawSharp(ctx, p.size);
      break;
    case "flat":
      this.drawFlat(ctx, p.size);
      break;
    case "natural":
      this.drawNatural(ctx, p.size);
      break;
  }
}

ngAfterViewInit(): void {
  if (!isPlatformBrowser(this.platformId)) {
    return;
  }

  const canvas = this.canvasRef.nativeElement;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const resize = () => {
    const dpr = window.devicePixelRatio || 1;
    const { width, height } = canvas.getBoundingClientRect();
    this.canvasWidth = width;
    this.canvasHeight = height;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  
  this.resizeListener = resize;
  resize();
  window.addEventListener('resize', resize);

  const count = this.getParticleCount();
  this.particles = Array.from({ length: count }, () => ({
    x: Math.random() * this.canvasWidth,
    y: Math.random() * this.canvasHeight,
    size: 10 + Math.random() * 12,
    speedX: (Math.random() - 0.5) * 0.25,
    speedY: -(0.1 + Math.random() * 0.3),
    opacity: 0.1 + Math.random() * 0.28,
    rotation: (Math.random() - 0.5) * 0.3,
    rotationSpeed: (Math.random() - 0.5) * 0.004,
    type: FloatingNotesComponent.NOTE_TYPES[Math.floor(Math.random() * FloatingNotesComponent.NOTE_TYPES.length)],
    color: FloatingNotesComponent.COLORS[Math.floor(Math.random() * FloatingNotesComponent.COLORS.length)],
    phase: Math.random() * Math.PI * 2,
  }));

  const frameIntervalMs = 1000 / 30;
  let lastFrameTime = 0;
  let time = 0;
  let lastColor = '';
  const animate = (timestamp: number) => {
    if (document.hidden) {
      this.animFrameId = 0;
      return;
    }

    if (lastFrameTime && timestamp - lastFrameTime < frameIntervalMs) {
      this.animFrameId = requestAnimationFrame(animate);
      return;
    }

    const deltaMs = lastFrameTime ? timestamp - lastFrameTime : frameIntervalMs;
    lastFrameTime = timestamp;
    const deltaSeconds = Math.min(deltaMs / 1000, 0.05);

    const canvasWidth = this.canvasWidth;
    const canvasHeight = this.canvasHeight;
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    time += deltaSeconds;

    for (const p of this.particles) {
      if (p.color !== lastColor) {
        ctx.fillStyle = p.color;
        ctx.strokeStyle = p.color;
        lastColor = p.color;
      }

      p.x += (p.speedX + Math.sin(time * 0.4 + p.phase) * 0.12) * (deltaSeconds / 0.016);
      p.y += p.speedY * (deltaSeconds / 0.016);
      p.rotation += p.rotationSpeed * (deltaSeconds / 0.016);

      if (p.y < -50) {
        p.y = canvasHeight + 50;
        p.x = Math.random() * canvasWidth;
      }
      if (p.x < -50) p.x = canvasWidth + 50;
      if (p.x > canvasWidth + 50) p.x = -50;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = p.opacity;
      this.drawParticle(ctx, p);
      ctx.restore();
    }

    this.animFrameId = requestAnimationFrame(animate);
  };

  this.visibilityChangeListener = () => {
    if (document.hidden) {
      if (this.animFrameId) {
        cancelAnimationFrame(this.animFrameId);
        this.animFrameId = 0;
      }
      return;
    }

    if (!this.animFrameId) {
      lastFrameTime = 0;
      this.animFrameId = requestAnimationFrame(animate);
    }
  };

  document.addEventListener('visibilitychange', this.visibilityChangeListener);
  this.animFrameId = requestAnimationFrame(animate);
}

ngOnDestroy(): void {
  if (this.resizeListener) {
    window.removeEventListener('resize', this.resizeListener);
  }
  if (this.visibilityChangeListener) {
    document.removeEventListener('visibilitychange', this.visibilityChangeListener);
  }
  if (this.animFrameId) {
    cancelAnimationFrame(this.animFrameId);
    this.animFrameId = 0;
  }
}
}
