'use client';

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react';

export type SignaturePadHandle = {
  /** True until there's more than a dot or a slip of the finger. */
  isEmpty: () => boolean;
  clear: () => void;
  /** Just the signature, cropped to the ink, on a clear background: a PNG to put on a page. */
  toBlob: () => Promise<Blob | null>;
  /** The same picture as a data URL, for showing it on the page before it's sent. */
  toDataUrl: () => string | null;
};

type Point = { x: number; y: number };

const INK = '#231F20';
const PAPER = '#FFFFFF';
const LINE_WIDTH = 2.8;
/** Less ink than this, in CSS pixels of stroke, counts as not signed. */
const MIN_INK = 40;
/** The cropped signature is drawn at this many pixels per CSS pixel, so it stays sharp on a page. */
const EXPORT_SCALE = 3;

function drawStrokes(context: CanvasRenderingContext2D, strokes: Point[][], lineWidth: number) {
  context.strokeStyle = INK;
  context.lineWidth = lineWidth;
  context.lineCap = 'round';
  context.lineJoin = 'round';
  for (const stroke of strokes) {
    if (stroke.length === 0) continue;
    context.beginPath();
    context.moveTo(stroke[0].x, stroke[0].y);
    if (stroke.length === 1) {
      context.lineTo(stroke[0].x + 0.1, stroke[0].y + 0.1);
    }
    // Midpoint curves: smooth without lagging behind the finger.
    for (let index = 1; index < stroke.length - 1; index += 1) {
      const mid = { x: (stroke[index].x + stroke[index + 1].x) / 2, y: (stroke[index].y + stroke[index + 1].y) / 2 };
      context.quadraticCurveTo(stroke[index].x, stroke[index].y, mid.x, mid.y);
    }
    if (stroke.length > 1) {
      const end = stroke[stroke.length - 1];
      context.lineTo(end.x, end.y);
    }
    context.stroke();
  }
}

/**
 * A box to sign in, with a finger, a mouse or a pen. Its height comes from
 * `className`, so each page can give it as much room as a finger needs.
 *
 * Strokes are kept as points in the box's own coordinates and redrawn whenever
 * the box changes size, so turning a phone sideways mid-signature scales the
 * signature instead of wiping it. `touch-action: none` stops the page scrolling
 * under the finger while it signs.
 */
export const SignaturePad = forwardRef<
  SignaturePadHandle,
  { label: string; className?: string; onInk?: (hasInk: boolean) => void }
>(function SignaturePad({ label, className = 'h-48', onInk }, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokes = useRef<Point[][]>([]);
  const drawing = useRef(false);
  const size = useRef({ width: 0, height: 0 });
  const ink = useRef(0);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    const ratio = window.devicePixelRatio || 1;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.fillStyle = PAPER;
    context.fillRect(0, 0, size.current.width, size.current.height);
    drawStrokes(context, strokes.current, LINE_WIDTH);
  }, []);

  // Fit the drawing surface to the box, at the screen's real resolution.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const fit = () => {
      const rect = canvas.getBoundingClientRect();
      const previous = size.current;
      if (previous.width > 0 && rect.width > 0 && previous.width !== rect.width) {
        const scale = rect.width / previous.width;
        strokes.current = strokes.current.map((stroke) =>
          stroke.map((point) => ({ x: point.x * scale, y: point.y * scale }))
        );
      }
      size.current = { width: rect.width, height: rect.height };
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.round(rect.width * ratio);
      canvas.height = Math.round(rect.height * ratio);
      redraw();
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [redraw]);

  const pointAt = (event: React.PointerEvent<HTMLCanvasElement>): Point => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const report = () => onInk?.(ink.current >= MIN_INK);

  /** The ink alone, cropped to its edges, with no paper behind it. */
  const cropped = (): HTMLCanvasElement | null => {
    const points = strokes.current.flat();
    if (ink.current < MIN_INK || points.length === 0) return null;
    const xs = points.map((point) => point.x);
    const ys = points.map((point) => point.y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const inkWidth = Math.max(...xs) - minX;
    const inkHeight = Math.max(...ys) - minY;
    // A signature shrinks a lot to fit its line on the page; a bolder stroke keeps it readable there.
    const lineWidth = Math.min(6, Math.max(LINE_WIDTH, Math.max(inkWidth, inkHeight * 3) / 90));
    const margin = lineWidth;
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil((inkWidth + margin * 2) * EXPORT_SCALE);
    canvas.height = Math.ceil((inkHeight + margin * 2) * EXPORT_SCALE);
    const context = canvas.getContext('2d');
    if (!context) return null;
    context.setTransform(
      EXPORT_SCALE,
      0,
      0,
      EXPORT_SCALE,
      -(minX - margin) * EXPORT_SCALE,
      -(minY - margin) * EXPORT_SCALE
    );
    drawStrokes(context, strokes.current, lineWidth);
    return canvas;
  };

  useImperativeHandle(ref, () => ({
    isEmpty: () => ink.current < MIN_INK,
    clear: () => {
      strokes.current = [];
      ink.current = 0;
      redraw();
      report();
    },
    toBlob: () =>
      new Promise<Blob | null>((resolve) => {
        const canvas = cropped();
        if (!canvas) return resolve(null);
        canvas.toBlob((blob) => resolve(blob), 'image/png');
      }),
    toDataUrl: () => cropped()?.toDataURL('image/png') ?? null
  }));

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={label}
      className={`block w-full cursor-crosshair touch-none select-none rounded-[0.9rem] bg-white ${className}`}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        drawing.current = true;
        strokes.current.push([pointAt(event)]);
        redraw();
      }}
      onPointerMove={(event) => {
        if (!drawing.current) return;
        const stroke = strokes.current[strokes.current.length - 1];
        const point = pointAt(event);
        const last = stroke[stroke.length - 1];
        ink.current += Math.hypot(point.x - last.x, point.y - last.y);
        stroke.push(point);
        redraw();
      }}
      onPointerUp={() => {
        drawing.current = false;
        report();
      }}
      onPointerCancel={() => {
        drawing.current = false;
        report();
      }}
    />
  );
});
