'use client';

export function RangeSlider({
  min,
  max,
  step = 1,
  value,
  onChange,
  formatValue,
  ariaLabelMin,
  ariaLabelMax
}: {
  min: number;
  max: number;
  step?: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  formatValue: (value: number) => string;
  ariaLabelMin: string;
  ariaLabelMax: string;
}) {
  const [lo, hi] = value;
  const span = Math.max(max - min, step);
  const pctLo = ((lo - min) / span) * 100;
  const pctHi = ((hi - min) / span) * 100;

  return (
    <div dir="ltr">
      <div className="flex items-center justify-between text-sm font-semibold text-[#231F20]">
        <span>{formatValue(lo)}</span>
        <span>{formatValue(hi)}</span>
      </div>
      <div className="relative mt-4 h-[18px]">
        <div className="absolute top-1/2 h-1.5 w-full -translate-y-1/2 rounded-full bg-[rgba(35,31,32,0.1)]" />
        <div
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[linear-gradient(90deg,#8B6508,#D4AF37)]"
          style={{ left: `${pctLo}%`, right: `${100 - pctHi}%` }}
        />
        <input
          type="range"
          aria-label={ariaLabelMin}
          min={min}
          max={max}
          step={step}
          value={lo}
          onChange={(event) => {
            const next = Math.min(Number(event.target.value), hi - step);
            onChange([next, hi]);
          }}
          className="gold-range absolute inset-x-0 top-0 z-10"
        />
        <input
          type="range"
          aria-label={ariaLabelMax}
          min={min}
          max={max}
          step={step}
          value={hi}
          onChange={(event) => {
            const next = Math.max(Number(event.target.value), lo + step);
            onChange([lo, next]);
          }}
          className="gold-range absolute inset-x-0 top-0 z-10"
        />
      </div>
    </div>
  );
}
