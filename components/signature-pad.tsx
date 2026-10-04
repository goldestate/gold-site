'use client';

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react';

export type SignaturePadHandle = {
  /** True until there's more than a dot or a slip of the finger. */
  isEmpty: () => boolean;
  clear: () => void;
  /** The signature as a PNG, dark ink on white. */
  toBlob: () => Promise<Blob | null>;
};

type Point = { x: number; y: number };

const INK = '#231F20';
const PAPER = '#FFFFFF';
/** Less ink than this, in CSS pixels of stroke, counts as not signed. */
const MIN_INK = 40;

/**
 * A box to sign in, with a finger, a mouse or a pen.
 *
 * Strokes are kept as points in the box's own coordinates and redrawn whenever
 * the box changes size, so turning a phone sideways mid-signature scales the
 * signature instead of wiping it. `touch-action: none` stops the page scrolling
 * under the finger while it signs.
 */
export const SignaturePad = forwardRef<SignaturePadHandle, { label: string; onInk?: (hasInk: boolean) => void }>(
  function SignaturePad({ label, onInk }, ref) {
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
      context.strokeStyle = INK;
      context.lineWidth = 2.4;
      context.lineCap = 'round';
      context.lineJoin = 'round';
      for (const stroke of strokes.current) {
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
          const canvas = canvasRef.current;
          if (!canvas) return resolve(null);
          canvas.toBlob((blob) => resolve(blob), 'image/png');
        })
    }));

    return (
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={label}
        className="block h-48 w-full cursor-crosshair touch-none select-none rounded-[0.9rem] bg-white sm:h-56"
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
  }
);
