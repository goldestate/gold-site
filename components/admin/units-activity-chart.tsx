'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { formatDay } from '@/lib/cairo-time';

/**
 * Units added per day (or per week, on long ranges), with the photos uploaded
 * on the same days underneath. Photos go up before a unit is saved, so a column
 * of red photos over an empty units column is a unit that never made it in, or
 * one that was later deleted.
 *
 * Two plots sharing one time axis, each on its own scale -- never one plot with
 * two scales. Every number here is also in the table view.
 */

export type ActivityBucket = {
  /** First and last day it covers, YYYY-MM-DD (the same day for a daily bucket). */
  from: string;
  to: string;
  published: number;
  hidden: number;
  /** Null when photo uploads aren't shown (a filter the photos can't follow is on). */
  photos: number | null;
  unattached: number | null;
  fromDeleted: number | null;
};

// Gold for the units, emphasis gray for the hidden ones. Red only ever means
// "photos no unit uses", the one thing on this chart that can be a problem.
// Checked with the dataviz palette validator on the card surface (#1d191a):
// gold/gray and red/dark-gray both pass the colour-blind separation checks.
const GOLD = '#D9B355';
const HIDDEN = '#8C8884';
const LOOSE = '#E66767';
const ATTACHED = '#56524F';
const GRID = 'rgba(255,255,255,0.08)';
const AXIS_TEXT = 'rgba(255,255,255,0.45)';

const GUTTER = 34;
// Room for the newest date label, which is centred on the last column.
const RIGHT_PAD = 20;
const UNITS_HEIGHT = 150;
const PHOTOS_HEIGHT = 64;
const PLOT_GAP = 34;
const AXIS_BAND = 24;
const TOP_PAD = 18;
const MIN_SLOT = 12;
const MAX_BAR = 24;
const SURFACE_GAP = 2;

export function bucketLabel(bucket: Pick<ActivityBucket, 'from' | 'to'>): string {
  if (bucket.from === bucket.to) return formatDay(bucket.from);
  return `${formatDay(bucket.from, { weekday: false })} – ${formatDay(bucket.to, { weekday: false })}`;
}

/** A clean top for the scale: 4, 5, 10, 20, 25, 50, 100... */
function niceMax(value: number): number {
  if (value <= 4) return 4;
  const power = 10 ** Math.floor(Math.log10(value));
  for (const step of [1, 2, 2.5, 5, 10]) {
    if (step * power >= value) return step * power;
  }
  return 10 * power;
}

/** A column with a rounded top and a square foot. */
function columnPath(x: number, y: number, width: number, height: number, rounded: boolean): string {
  const r = rounded ? Math.min(4, width / 2, height) : 0;
  return `M${x},${y + height} V${y + r} Q${x},${y} ${x + r},${y} H${x + width - r} Q${x + width},${y} ${x + width},${y + r} V${y + height} Z`;
}

/** Two stacked segments from one baseline, a 2px surface gap between them. */
function Stack({
  x,
  width,
  baseline,
  scale,
  bottom,
  top
}: {
  x: number;
  width: number;
  baseline: number;
  scale: number;
  bottom: { value: number; color: string };
  top: { value: number; color: string };
}) {
  const bottomHeight = bottom.value * scale;
  const topHeight = top.value * scale;
  const gap = bottomHeight > 0 && topHeight > 0 ? SURFACE_GAP : 0;
  return (
    <>
      {bottomHeight > 0 ? (
        <path
          d={columnPath(x, baseline - bottomHeight, width, bottomHeight, topHeight === 0)}
          fill={bottom.color}
        />
      ) : null}
      {topHeight > 0 ? (
        <path
          d={columnPath(x, baseline - bottomHeight - topHeight, width, Math.max(1, topHeight - gap), true)}
          fill={top.color}
        />
      ) : null}
    </>
  );
}

function summary(bucket: ActivityBucket): string {
  const units = bucket.published + bucket.hidden;
  const parts = [`${units} ${units === 1 ? 'unit' : 'units'} added`];
  if (bucket.hidden > 0) parts.push(`${bucket.hidden} hidden`);
  if (bucket.photos !== null) parts.push(`${bucket.photos} photos uploaded`);
  if (bucket.unattached) parts.push(`${bucket.unattached} not on any unit`);
  return `${bucketLabel(bucket)}: ${parts.join(', ')}`;
}

function LegendKey({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span aria-hidden="true" className="h-2.5 w-2.5 rounded-[3px]" style={{ background: color }} />
      {label}
    </span>
  );
}

export function UnitsActivityChart({
  buckets,
  weekly,
  selected,
  onSelect
}: {
  buckets: ActivityBucket[];
  weekly: boolean;
  /** The bucket the list is currently narrowed to, if any. */
  selected: { from: string; to: string } | null;
  onSelect: (bucket: ActivityBucket) => void;
}) {
  const [view, setView] = useState<'chart' | 'table'>('chart');
  const [width, setWidth] = useState(720);
  const [active, setActive] = useState<number | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const showPhotos = buckets.some((bucket) => bucket.photos !== null);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(240, Math.floor(entry.contentRect.width))));
    observer.observe(frame);
    return () => observer.disconnect();
  }, [view]);

  // The latest days are the ones staff come to check: on a phone, where the
  // chart scrolls sideways, start at the right-hand end.
  useEffect(() => {
    const scroller = scrollRef.current;
    if (scroller) scroller.scrollLeft = scroller.scrollWidth;
  }, [buckets.length, width, view]);

  const count = Math.max(1, buckets.length);
  const slot = Math.max(MIN_SLOT, (width - GUTTER - RIGHT_PAD) / count);
  const plotWidth = slot * count;
  const barWidth = Math.max(2, Math.min(MAX_BAR, slot - SURFACE_GAP * 2));

  const unitsMax = niceMax(Math.max(0, ...buckets.map((bucket) => bucket.published + bucket.hidden)));
  const photosMax = niceMax(Math.max(0, ...buckets.map((bucket) => bucket.photos ?? 0)));
  const unitsBase = TOP_PAD + UNITS_HEIGHT;
  const photosTop = unitsBase + PLOT_GAP;
  const photosBase = photosTop + PHOTOS_HEIGHT;
  const axisTop = (showPhotos ? photosBase : unitsBase) + 6;
  const height = axisTop + AXIS_BAND;

  // Date labels, placed from the newest backwards so the latest day is always named.
  const labelEvery = Math.max(1, Math.ceil(58 / slot));
  const labelled = new Set<number>();
  for (let index = buckets.length - 1; index >= 0; index -= labelEvery) labelled.add(index);

  const isSelected = (bucket: ActivityBucket) =>
    selected !== null && selected.from === bucket.from && selected.to === bucket.to;

  const handleKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (buckets.length === 0) return;
    const current = active ?? buckets.length;
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      setActive(Math.max(0, current - 1));
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      setActive(Math.min(buckets.length - 1, active === null ? buckets.length - 1 : current + 1));
    } else if ((event.key === 'Enter' || event.key === ' ') && active !== null) {
      event.preventDefault();
      onSelect(buckets[active]);
    } else if (event.key === 'Escape') {
      setActive(null);
    }
  };

  const activeBucket = active !== null ? buckets[active] : null;
  const tooltipLeft =
    active !== null ? Math.max(0, Math.min(active * slot + slot / 2 - 100, plotWidth + RIGHT_PAD - 200)) : 0;

  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium uppercase tracking-[0.14em] text-white">
            {weekly ? 'Units added per week' : 'Units added per day'}
          </h2>
          <p className="mt-1 text-xs text-white/45">
            {view === 'chart' ? 'Tap a column to list only the units from then.' : 'Tap a row to list only the units from then.'}
          </p>
        </div>
        <div role="group" aria-label="Show as" className="flex rounded-full border border-white/15 p-0.5 text-[11px] font-semibold uppercase tracking-[0.12em]">
          {(['chart', 'table'] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={view === option}
              onClick={() => setView(option)}
              className={`min-h-[32px] rounded-full px-3 transition ${
                view === option ? 'bg-[#D9B355] text-[#171314]' : 'text-white/60 hover:text-white'
              }`}
            >
              {option === 'chart' ? 'Chart' : 'Table'}
            </button>
          ))}
        </div>
      </div>

      {view === 'chart' ? (
        <>
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/60">
            <LegendKey color={GOLD} label="Published" />
            <LegendKey color={HIDDEN} label="Hidden" />
            {showPhotos ? (
              <>
                <LegendKey color={ATTACHED} label="Photos on a unit" />
                <LegendKey color={LOOSE} label="Photos not on any unit" />
              </>
            ) : null}
          </div>

          {/* The scale stays put on the left; only the columns scroll, so on a
              phone the numbers stay readable while the newest days are in view. */}
          <div ref={frameRef} className="relative mt-3 flex">
            <svg width={GUTTER} height={height} className="block flex-none" aria-hidden="true">
              {[0, 0.5, 1].map((fraction) => {
                const value = unitsMax * fraction;
                return Number.isInteger(value) ? (
                  <text
                    key={`u${fraction}`}
                    x={GUTTER - 8}
                    y={unitsBase - fraction * UNITS_HEIGHT + 3.5}
                    textAnchor="end"
                    fontSize={10}
                    fill={AXIS_TEXT}
                    className="tabular-nums"
                  >
                    {value}
                  </text>
                ) : null;
              })}
              {showPhotos
                ? [0, 1].map((fraction) => (
                    <text
                      key={`p${fraction}`}
                      x={GUTTER - 8}
                      y={photosBase - fraction * PHOTOS_HEIGHT + 3.5}
                      textAnchor="end"
                      fontSize={10}
                      fill={AXIS_TEXT}
                      className="tabular-nums"
                    >
                      {photosMax * fraction}
                    </text>
                  ))
                : null}
            </svg>
            <span className="pointer-events-none absolute top-0 z-[1] text-[10px] uppercase tracking-[0.08em] text-white/45" style={{ left: GUTTER }}>
              Units
            </span>
            {showPhotos ? (
              <span
                className="pointer-events-none absolute z-[1] text-[10px] uppercase tracking-[0.08em] text-white/45"
                style={{ left: GUTTER, top: photosTop - 18 }}
              >
                Photos uploaded
              </span>
            ) : null}
            <div
              ref={scrollRef}
              tabIndex={0}
              role="group"
              aria-label={`${weekly ? 'Units added per week' : 'Units added per day'}. Use the left and right arrow keys to read each column, and Enter to list its units. The same numbers are in the table view.`}
              onKeyDown={handleKey}
              onBlur={() => setActive(null)}
              className="no-scrollbar relative min-w-0 flex-1 overflow-x-auto rounded-[0.75rem] outline-none focus-visible:ring-2 focus-visible:ring-[rgba(217,179,85,0.45)]"
            >
              <div className="relative" style={{ width: plotWidth + RIGHT_PAD, height }}>
                <svg
                  width={plotWidth + RIGHT_PAD}
                  height={height}
                  className="block"
                  onPointerLeave={() => setActive(null)}
                  aria-hidden="true"
                >
                  {/* Hairline grid at zero, half and the top of each scale. */}
                  {[0, 0.5, 1].map((fraction) => {
                    const y = unitsBase - fraction * UNITS_HEIGHT;
                    return <line key={`u${fraction}`} x1={0} x2={plotWidth} y1={y} y2={y} stroke={GRID} strokeWidth={1} />;
                  })}
                  {showPhotos
                    ? [0, 1].map((fraction) => {
                        const y = photosBase - fraction * PHOTOS_HEIGHT;
                        return <line key={`p${fraction}`} x1={0} x2={plotWidth} y1={y} y2={y} stroke={GRID} strokeWidth={1} />;
                      })
                    : null}

                  {buckets.map((bucket, index) => {
                    const x = index * slot + (slot - barWidth) / 2;
                    const lit = active === index || isSelected(bucket);
                    return (
                      <g key={bucket.from}>
                        {lit ? (
                          <rect
                            x={index * slot}
                            y={TOP_PAD - 4}
                            width={slot}
                            height={axisTop - TOP_PAD + 4}
                            rx={4}
                            fill="rgba(255,255,255,0.06)"
                          />
                        ) : null}
                        <Stack
                          x={x}
                          width={barWidth}
                          baseline={unitsBase}
                          scale={UNITS_HEIGHT / unitsMax}
                          bottom={{ value: bucket.published, color: GOLD }}
                          top={{ value: bucket.hidden, color: HIDDEN }}
                        />
                        {showPhotos && bucket.photos !== null ? (
                          <Stack
                            x={x}
                            width={barWidth}
                            baseline={photosBase}
                            scale={PHOTOS_HEIGHT / photosMax}
                            bottom={{ value: bucket.unattached ?? 0, color: LOOSE }}
                            top={{ value: bucket.photos - (bucket.unattached ?? 0), color: ATTACHED }}
                          />
                        ) : null}
                        {labelled.has(index) ? (
                          <text
                            x={index * slot + slot / 2}
                            y={axisTop + 14}
                            textAnchor="middle"
                            fontSize={10}
                            fill={lit ? 'rgba(255,255,255,0.85)' : AXIS_TEXT}
                          >
                            {formatDay(bucket.from, { weekday: false })}
                          </text>
                        ) : null}
                        {/* The hit area is the whole column, not just the painted bar. */}
                        <rect
                          x={index * slot}
                          y={0}
                          width={slot}
                          height={height}
                          fill="transparent"
                          className="cursor-pointer"
                          onPointerEnter={() => setActive(index)}
                          onClick={() => onSelect(bucket)}
                        />
                      </g>
                    );
                  })}
                </svg>

                {activeBucket ? (
                  <div
                    className="pointer-events-none absolute top-0 z-10 w-[200px] rounded-[0.9rem] border border-white/15 bg-[#231F20]/95 px-3 py-2.5 text-xs shadow-xl backdrop-blur"
                    style={{ left: tooltipLeft }}
                  >
                    <p className="text-white/60">{bucketLabel(activeBucket)}</p>
                    <TooltipRow color={GOLD} value={activeBucket.published} label="published" />
                    <TooltipRow color={HIDDEN} value={activeBucket.hidden} label="hidden" />
                    {activeBucket.photos !== null ? (
                      <>
                        <TooltipRow color={ATTACHED} value={activeBucket.photos - (activeBucket.unattached ?? 0)} label="photos on a unit" />
                        <TooltipRow color={LOOSE} value={activeBucket.unattached ?? 0} label="photos not on any unit" />
                        {activeBucket.fromDeleted ? (
                          <p className="mt-1 text-white/50">{activeBucket.fromDeleted} of them from deleted units</p>
                        ) : null}
                      </>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
            <p className="sr-only" aria-live="polite">
              {activeBucket ? summary(activeBucket) : ''}
            </p>
          </div>
          {!showPhotos ? (
            <p className="mt-2 text-xs text-white/40">
              Photo uploads have no location or type, so they are left out while those filters are on.
            </p>
          ) : null}
        </>
      ) : (
        <div className="mt-4 max-h-[420px] overflow-auto rounded-[1rem] border border-white/10">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="sticky top-0 bg-[#231F20] text-[10px] uppercase tracking-[0.14em] text-white/50">
              <tr>
                <th className="px-4 py-3 font-semibold">{weekly ? 'Week' : 'Day'}</th>
                <th className="px-4 py-3 text-right font-semibold">Units added</th>
                <th className="px-4 py-3 text-right font-semibold">Hidden</th>
                {showPhotos ? (
                  <>
                    <th className="px-4 py-3 text-right font-semibold">Photos uploaded</th>
                    <th className="px-4 py-3 text-right font-semibold">Not on any unit</th>
                  </>
                ) : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] tabular-nums">
              {[...buckets].reverse().map((bucket) => {
                const units = bucket.published + bucket.hidden;
                return (
                  <tr
                    key={bucket.from}
                    onClick={() => onSelect(bucket)}
                    className={`cursor-pointer transition hover:bg-white/[0.04] ${isSelected(bucket) ? 'bg-white/[0.06]' : ''}`}
                  >
                    <td className="px-4 py-2.5 text-white/80">
                      <button
                        type="button"
                        onClick={(event) => {
                          // The row already listens; this button is for the keyboard.
                          event.stopPropagation();
                          onSelect(bucket);
                        }}
                        className="text-left hover:text-[#D9B355]"
                      >
                        {bucketLabel(bucket)}
                      </button>
                    </td>
                    <td className={`px-4 py-2.5 text-right ${units === 0 ? 'text-white/30' : 'text-white'}`}>{units}</td>
                    <td className="px-4 py-2.5 text-right text-white/60">{bucket.hidden || ''}</td>
                    {showPhotos ? (
                      <>
                        <td className="px-4 py-2.5 text-right text-white/60">{bucket.photos ?? ''}</td>
                        <td className={`px-4 py-2.5 text-right ${bucket.unattached ? 'font-semibold text-red-300' : 'text-white/30'}`}>
                          {bucket.unattached ?? ''}
                        </td>
                      </>
                    ) : null}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function TooltipRow({ color, value, label }: { color: string; value: number; label: string }) {
  return (
    <p className="mt-1 flex items-center gap-2">
      <span aria-hidden="true" className="h-0.5 w-3 rounded-full" style={{ background: color }} />
      <span className="font-semibold tabular-nums text-white">{value}</span>
      <span className="text-white/55">{label}</span>
    </p>
  );
}
