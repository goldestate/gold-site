'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { Compound, CompoundCode, Place } from '@/lib/directory-store';
import {
  COVERAGE_CATEGORIES,
  PLACE_CATEGORIES,
  currentAppNote,
  defaultTierFor,
  isCompoundSpecific,
  isCoverageCategory,
  placeCategoryLabel,
  placeKey,
  tierLabel,
  type PlaceCategoryValue,
  type PlaceTierValue
} from '@/lib/directory-taxonomy';
import { adminFetch } from '@/lib/admin-fetch';
import { whatsappFor } from '@/lib/phone';
import { PasteImport } from './paste-import';
import { CodePanel } from './code-panel';
import { PlaceEditSheet, TIER_HELP, confirmMakePublic } from './place-edit-sheet';

const fieldClass =
  'w-full rounded-[0.8rem] border border-white/12 bg-white/5 px-3 py-2.5 text-base text-white outline-none placeholder:text-white/30 focus:border-[#D9B355]';

/** Commas (Latin or Arabic) or new lines, trimmed, empties and repeats dropped -- what the server keeps anyway. */
function parseMatchNames(text: string): string[] {
  const seen = new Set<string>();
  const names: string[] = [];
  for (const part of text.split(/[,،\n]/)) {
    const name = part.trim();
    if (!name || seen.has(name.toLowerCase())) continue;
    seen.add(name.toLowerCase());
    names.push(name);
  }
  return names;
}

/** A copy's result. `undo` holds what that copy created, so a copy from the wrong compound is one tap to take back. */
type Note = { text: string; tone: 'ok' | 'error'; undo?: { ids: string[]; sourceName: string } };

type Created = { places: Place[]; skipped?: number };

export function CompoundEditor({
  compound,
  places,
  codes,
  otherCompounds
}: {
  compound: Compound;
  places: Place[];
  codes: CompoundCode[];
  otherCompounds: { id: string; nameEn: string }[];
}) {
  const router = useRouter();
  // One write at a time, named so the control that started it can say so.
  const [busy, setBusy] = useState<string | null>(null);
  // Where the add sheet opened: under the coverage chips, or under a list heading.
  const [adding, setAdding] = useState<{ category: PlaceCategoryValue; from: 'top' | 'list' } | null>(null);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [addError, setAddError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<{ id: string; text: string } | null>(null);
  const [matchNames, setMatchNames] = useState(
    (compound.matchNames.length > 0 ? compound.matchNames : [compound.nameEn]).join(', ')
  );
  const [matchSaved, setMatchSaved] = useState(false);
  const [matchError, setMatchError] = useState('');
  const [copyNote, setCopyNote] = useState<Note | null>(null);

  // Never called after a 401: the refresh is a page request, middleware sends it
  // to the login page, and whatever staff typed goes with it.
  const refresh = () => router.refresh();
  // While an open sheet is saving, no other row may open: switching rows would
  // unmount the sheet mid-save and lose its answer.
  const savingEdit = busy !== null && busy.startsWith('edit:');

  const active = places.filter((place) => place.active);
  const hiddenCount = places.length - active.length;
  const publicCount = active.filter((place) => place.tier === 'public').length;
  const covered = new Set(active.map((place) => place.category).filter(isCoverageCategory));
  const missing = COVERAGE_CATEGORIES.filter((item) => !covered.has(item.value));
  const keys = new Map(places.map((place) => [placeKey(place), place]));

  const openAdd = (category: PlaceCategoryValue, from: 'top' | 'list') => {
    setAdding({ category, from });
    setAddError('');
  };

  const saveMatchNames = async () => {
    const names = parseMatchNames(matchNames);
    if (names.length === 0) {
      setMatchError('Keep at least one name.');
      return;
    }
    setBusy('match');
    setMatchError('');
    const result = await adminFetch('/api/directory/compounds', {
      method: 'PATCH',
      body: { id: compound.id, matchNames: names }
    });
    setBusy(null);
    if (!result.ok) {
      setMatchError(result.error);
      return;
    }
    setMatchNames(names.join(', '));
    setMatchSaved(true);
    setTimeout(() => setMatchSaved(false), 2500);
    refresh();
  };

  const addDuplicate = adding && newName.trim() ? keys.get(placeKey({ category: adding.category, nameEn: newName })) : undefined;

  const addPlace = async (category: PlaceCategoryValue) => {
    const name = newName.trim();
    if (!name || addDuplicate) return;
    const phone = newPhone.trim() || null;
    setBusy('add');
    setAddError('');
    const result = await adminFetch<Created>('/api/directory/places', {
      method: 'POST',
      body: {
        compoundId: compound.id,
        // Caught here too: added from another tab since this page was drawn.
        skipExisting: true,
        places: [
          {
            category,
            tier: defaultTierFor(category),
            nameEn: name,
            phone,
            // Only a number that can be on WhatsApp gets the button in the app.
            whatsapp: whatsappFor(phone),
            sortOrder: 0
          }
        ]
      }
    });
    setBusy(null);
    if (!result.ok) {
      // The sheet stays open with the name and number still in it.
      setAddError(result.error);
      return;
    }
    if (result.data.places.length === 0) {
      // Kept open, number and all: the listed one may have a different number,
      // and the refresh brings it onto the list to compare.
      setAddError(`"${name}" was already listed under ${placeCategoryLabel(category, 'en')}. Tap it on the list to edit it instead.`);
      refresh();
      return;
    }
    setNewName('');
    setNewPhone('');
    setAdding(null);
    refresh();
  };

  const toggleTier = async (place: Place) => {
    const next: PlaceTierValue = place.tier === 'public' ? 'vetted' : 'public';
    if (next === 'public' && !confirmMakePublic(place.nameEn, place.category)) return;
    setBusy(`tier:${place.id}`);
    setRowError(null);
    const result = await adminFetch(`/api/directory/places/${place.id}`, { method: 'PATCH', body: { tier: next } });
    setBusy(null);
    if (!result.ok && result.status !== 404) {
      setRowError({ id: place.id, text: result.error });
      return;
    }
    // A 404 means another tab deleted it; the refresh takes the row away.
    refresh();
  };

  const removePlace = async (place: Place) => {
    if (!window.confirm(`Delete "${place.nameEn}"?`)) return;
    setBusy(`delete:${place.id}`);
    setRowError(null);
    const result = await adminFetch(`/api/directory/places/${place.id}`, { method: 'DELETE' });
    setBusy(null);
    // Already gone is what was asked for.
    if (!result.ok && result.status !== 404) {
      setRowError({ id: place.id, text: result.error });
      return;
    }
    if (editingId === place.id) setEditingId(null);
    refresh();
  };

  /**
   * Copies one tier from another compound. Public and private places are separate
   * menus because they answer different questions: the pharmacy down the road is
   * shared by every compound on that stretch of coast, while a plumber only comes
   * over if he also works this compound -- so copying trades is a deliberate pick.
   *
   * Security, maintenance and the clubhouse never travel: they are the source
   * compound's own gate and office. Anything already here under the same category
   * and name is skipped, so picking the same source twice does not list every
   * place twice. Nothing is written until staff confirm the count.
   */
  const copyFrom = async (sourceId: string, tier: PlaceTierValue) => {
    if (!sourceId) return;
    const sourceName = otherCompounds.find((item) => item.id === sourceId)?.nameEn ?? 'that compound';
    const word = tier === 'public' ? 'public' : 'private';
    setBusy('copy');
    setCopyNote(null);
    const loaded = await adminFetch<{ places: Place[] }>(
      `/api/directory/places?compoundId=${encodeURIComponent(sourceId)}`
    );
    if (!loaded.ok) {
      setBusy(null);
      setCopyNote({ tone: 'error', text: loaded.status === 401 ? loaded.error : `Could not load ${sourceName}. ${loaded.error}` });
      return;
    }
    const inTier = loaded.data.places.filter((item) => item.tier === tier && item.active);
    const matching = inTier.filter((item) => !isCompoundSpecific(item.category));
    const staying = inTier.length - matching.length;
    const carry = matching.filter((item) => !keys.has(placeKey(item)));
    const skipped = matching.length - carry.length;

    if (carry.length === 0) {
      setBusy(null);
      setCopyNote({
        tone: 'ok',
        text:
          matching.length === 0
            ? `${sourceName} has no ${word} places that can be copied.`
            : `Nothing new: all ${matching.length} ${word} places from ${sourceName} are already here.`
      });
      return;
    }

    const details = [
      skipped > 0 ? `${skipped} already here will be skipped.` : '',
      staying > 0 ? `${staying} security, maintenance or clubhouse ${staying === 1 ? 'number stays' : 'numbers stay'} behind: they belong to ${sourceName}.` : ''
    ].filter(Boolean);
    const question = `Copy ${carry.length} ${word} ${carry.length === 1 ? 'place' : 'places'} from ${sourceName}?`;
    if (!window.confirm([question, ...details].join('\n\n'))) {
      setBusy(null);
      return;
    }

    const saved = await adminFetch<Created>('/api/directory/places', {
      method: 'POST',
      body: {
        compoundId: compound.id,
        // A second copy fired before the refresh landed would otherwise list them twice.
        skipExisting: true,
        places: carry.map((item) => ({
          category: item.category,
          tier,
          nameEn: item.nameEn,
          nameAr: item.nameAr,
          phone: item.phone,
          whatsapp: whatsappFor(item.whatsapp),
          address: item.address,
          notesEn: item.notesEn,
          notesAr: item.notesAr,
          sortOrder: item.sortOrder
        }))
      }
    });
    setBusy(null);
    if (!saved.ok) {
      setCopyNote({ tone: 'error', text: saved.error });
      return;
    }
    const created = saved.data.places;
    const alreadyHere = skipped + (saved.data.skipped ?? 0);
    setCopyNote({
      tone: 'ok',
      text: `Copied ${created.length} from ${sourceName}${alreadyHere > 0 ? `, skipped ${alreadyHere} already here` : ''}.`,
      undo: created.length > 0 ? { ids: created.map((item) => item.id), sourceName } : undefined
    });
    refresh();
  };

  /** Deletes exactly what the last copy created. Anything already gone counts as undone. */
  const undoCopy = async (undo: { ids: string[]; sourceName: string }) => {
    const count = undo.ids.length;
    if (!window.confirm(`Remove the ${count} ${count === 1 ? 'place' : 'places'} just copied from ${undo.sourceName}?`)) return;
    setBusy('undo');
    let removed = 0;
    let failure: { status: number; error: string } | null = null;
    for (const id of undo.ids) {
      const result = await adminFetch(`/api/directory/places/${id}`, { method: 'DELETE' });
      if (!result.ok && result.status !== 404) {
        failure = result;
        break;
      }
      removed += 1;
    }
    setBusy(null);
    if (failure) {
      // Keep the rest undoable: a retry after logging in picks up where this stopped.
      const left = undo.ids.slice(removed);
      setCopyNote({
        tone: 'error',
        text: `Removed ${removed} of ${count}. ${failure.error}`,
        undo: { ids: left, sourceName: undo.sourceName }
      });
      if (failure.status !== 401 && removed > 0) refresh();
      return;
    }
    setCopyNote({ tone: 'ok', text: `Removed the ${count} copied from ${undo.sourceName}.` });
    refresh();
  };

  const grouped = PLACE_CATEGORIES.map((category) => ({
    category,
    items: places.filter((place) => place.category === category.value)
  })).filter((group) => group.items.length > 0);

  const addSheet = (category: PlaceCategoryValue) => {
    const tier = defaultTierFor(category);
    const appNote = currentAppNote(category, tier);
    return (
      <div className="space-y-2 rounded-[1rem] border border-[rgba(217,179,85,0.4)] bg-[rgba(217,179,85,0.06)] p-4">
        <div className="text-xs uppercase tracking-[0.18em] text-[#D9B355]">Add {placeCategoryLabel(category, 'en')}</div>
        <input
          autoFocus
          value={newName}
          onChange={(event) => {
            setNewName(event.target.value);
            setAddError('');
          }}
          placeholder="Name"
          className={fieldClass}
        />
        <input
          value={newPhone}
          onChange={(event) => setNewPhone(event.target.value)}
          placeholder="Phone"
          inputMode="tel"
          className={fieldClass}
        />
        <p className="text-[11px] leading-relaxed text-white/45">
          Saved as <span className="text-white/70">{tierLabel(tier)}</span>: {TIER_HELP[tier]} Tap the pill on the
          list to change it.
        </p>
        {appNote ? <p className="text-[11px] leading-relaxed text-[#E8C27A]">{appNote}</p> : null}
        {addDuplicate ? (
          <p className="text-sm text-[#E8C27A]">
            &ldquo;{addDuplicate.nameEn}&rdquo; is already listed under {placeCategoryLabel(category, 'en')}
            {addDuplicate.active ? '' : ' (hidden)'}. Tap it on the list to edit it instead.
          </p>
        ) : null}
        {/* once the refresh lists the other one, the line above already says it */}
        {addError && !addDuplicate ? <p className="text-sm text-red-300">{addError}</p> : null}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => addPlace(category)}
            disabled={busy !== null || !newName.trim() || Boolean(addDuplicate)}
            className="btn-gold flex-1 rounded-full py-3 text-xs font-semibold uppercase tracking-[0.18em] disabled:opacity-40"
          >
            {busy === 'add' ? 'Saving...' : 'Save'}
          </button>
          <button
            type="button"
            onClick={() => {
              setAdding(null);
              setAddError('');
            }}
            className="rounded-full border border-white/15 px-5 py-3 text-xs uppercase tracking-[0.18em] text-white/60"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* coverage -- what a guest will find, and what is still worth adding */}
      <div className="rounded-[1rem] border border-white/12 bg-white/5 p-4">
        <div className="text-sm text-white/70">
          <span className="text-white">{active.length}</span> {active.length === 1 ? 'place' : 'places'} &middot;{' '}
          <span className="text-[#D9B355]">{covered.size}</span> {covered.size === 1 ? 'category' : 'categories'}{' '}
          covered
        </div>
        <div className="mt-1 text-[11px] text-white/40">
          {publicCount} public &middot; {active.length - publicCount} private
          {hiddenCount > 0 ? ` · ${hiddenCount} hidden` : ''}
        </div>
        {missing.length > 0 ? (
          <>
            <p className="mt-3 text-xs uppercase tracking-[0.16em] text-white/40">Not covered yet - tap to add</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {missing.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => openAdd(item.value, 'top')}
                  className="min-h-[40px] rounded-full border border-white/15 px-3.5 text-xs text-white/60 transition active:scale-95 hover:border-[#D9B355] hover:text-[#D9B355]"
                >
                  {item.en}
                </button>
              ))}
            </div>
          </>
        ) : (
          <p className="mt-3 text-xs text-[#D9B355]">Every category has at least one place.</p>
        )}
      </div>

      {adding?.from === 'top' ? addSheet(adding.category) : null}

      {/* codes sit high because issuing one is the job done once per stay */}
      {active.length === 0 ? (
        <p className="rounded-[1rem] border border-[#D9A441]/40 bg-[#D9A441]/10 px-4 py-3 text-sm leading-relaxed text-[#E8C27A]">
          Nothing is listed here yet, so a code would unlock an empty guide. Add places before sending one.
        </p>
      ) : null}
      <CodePanel compoundId={compound.id} compoundName={compound.nameEn} compoundNameAr={compound.nameAr} codes={codes} />

      <PasteImport compoundId={compound.id} existing={places} onDone={refresh} />

      {otherCompounds.length > 0 ? (
        <div className="space-y-2">
          <div className="grid gap-2 sm:grid-cols-2">
            {(['public', 'vetted'] as const).map((tier) => (
              <select
                key={tier}
                onChange={(event) => {
                  copyFrom(event.target.value, tier);
                  event.target.value = '';
                }}
                defaultValue=""
                disabled={busy !== null}
                className={fieldClass}
              >
                <option value="" className="bg-[#231F20]">
                  {busy === 'copy' ? 'Copying...' : `Copy ${tier === 'public' ? 'public' : 'private'} places from...`}
                </option>
                {otherCompounds.map((item) => (
                  <option key={item.id} value={item.id} className="bg-[#231F20]">
                    {item.nameEn}
                  </option>
                ))}
              </select>
            ))}
          </div>
          {copyNote ? (
            <div className="flex items-center justify-between gap-3">
              <p className={`text-xs ${copyNote.tone === 'error' ? 'text-red-300' : 'text-white/50'}`}>{copyNote.text}</p>
              {copyNote.undo && copyNote.undo.ids.length > 0 ? (
                <button
                  type="button"
                  onClick={() => undoCopy(copyNote.undo!)}
                  disabled={busy !== null}
                  className="min-h-[40px] flex-none rounded-full border border-white/15 px-4 text-[11px] uppercase tracking-[0.14em] text-white/60 disabled:opacity-40"
                >
                  {busy === 'undo' ? 'Undoing...' : 'Undo'}
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* the list */}
      {places.length > 0 ? (
        <p className="text-[11px] leading-relaxed text-white/40">
          Guests see both kinds once they redeem a code. <strong className="text-white/60">Public</strong>:{' '}
          {TIER_HELP.public} <strong className="text-white/60">Private</strong>: {TIER_HELP.vetted} Tap a place to
          edit it.
        </p>
      ) : null}
      <div className="space-y-4">
        {grouped.map((group) => (
          <div key={group.category.value}>
            <div className="flex items-center justify-between">
              <h2 className="text-xs uppercase tracking-[0.18em] text-white/40">{group.category.en}</h2>
              <button
                type="button"
                onClick={() => openAdd(group.category.value, 'list')}
                className="min-h-[40px] px-3 text-xs text-white/40 transition hover:text-[#D9B355]"
              >
                + Add
              </button>
            </div>
            {adding?.from === 'list' && adding.category === group.category.value ? (
              <div className="mt-2">{addSheet(adding.category)}</div>
            ) : null}
            <div className="mt-2 space-y-2">
              {group.items.map((place) => {
                const editing = editingId === place.id;
                const appNote = currentAppNote(place.category, place.tier);
                return (
                  <div key={place.id} className="rounded-[0.9rem] border border-white/10 bg-white/5">
                    <div className="flex items-center gap-2.5 p-1.5 pr-2">
                      <button
                        type="button"
                        onClick={() => setEditingId(editing ? null : place.id)}
                        disabled={savingEdit}
                        aria-expanded={editing}
                        className="min-h-[44px] min-w-0 flex-1 rounded-[0.7rem] px-2 py-1 text-left transition active:bg-white/5"
                      >
                        <span className="flex items-center gap-2">
                          <span className={`truncate text-sm text-white ${place.active ? '' : 'opacity-50'}`}>
                            {place.nameEn}
                          </span>
                          {place.active ? null : (
                            <span className="flex-none rounded-full border border-white/25 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-white/70">
                              Hidden
                            </span>
                          )}
                          {appNote && place.active ? (
                            // Tap the row for the reason: the sheet spells it out.
                            <span
                              title={appNote}
                              className="flex-none rounded-full border border-[#E8C27A]/50 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-[#E8C27A]"
                            >
                              Not in app yet
                            </span>
                          ) : null}
                        </span>
                        <span className={`block text-xs ${place.active ? '' : 'opacity-50'}`}>
                          {place.phone ? (
                            <span className="font-mono text-[#D9B355]">{place.phone}</span>
                          ) : (
                            <span className="text-white/30">no phone</span>
                          )}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleTier(place)}
                        // While the sheet is open it owns the tier; saving it would undo a pill tap.
                        disabled={busy !== null || editing}
                        aria-label={`${tierLabel(place.tier)}. Tap to make it ${place.tier === 'public' ? 'private' : 'public'}.`}
                        className={`min-h-[40px] w-[5.5rem] flex-none rounded-full border text-[11px] uppercase tracking-[0.12em] transition active:scale-95 disabled:opacity-60 ${
                          place.tier === 'public'
                            ? 'border-[#E8C27A]/60 bg-[#E8C27A]/10 text-[#E8C27A]'
                            : 'border-[#D9B355] text-[#D9B355]'
                        }`}
                      >
                        {busy === `tier:${place.id}` ? '...' : tierLabel(place.tier)}
                      </button>
                      <button
                        type="button"
                        onClick={() => removePlace(place)}
                        disabled={busy !== null}
                        className="flex h-10 w-10 flex-none items-center justify-center rounded-full border border-white/12 text-lg text-white/45 transition active:scale-95 disabled:opacity-60"
                        aria-label={`Delete ${place.nameEn}`}
                      >
                        {busy === `delete:${place.id}` ? '...' : '×'}
                      </button>
                    </div>
                    {rowError?.id === place.id ? (
                      <p className="px-3 pb-2 text-xs text-red-300">{rowError.text}</p>
                    ) : null}
                    {editing ? (
                      <div className="border-t border-white/10 p-3">
                        <PlaceEditSheet
                          place={place}
                          blocked={busy !== null && busy !== `edit:${place.id}`}
                          onBusyChange={(saving) => setBusy(saving ? `edit:${place.id}` : null)}
                          onClose={() => setEditingId(null)}
                          onSaved={() => {
                            // Only this sheet: never close one staff have since opened on another row.
                            setEditingId((current) => (current === place.id ? null : current));
                            refresh();
                          }}
                        />
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* which listings belong to this compound */}
      <div className="rounded-[1rem] border border-white/12 bg-white/5 p-4">
        <div className="text-xs uppercase tracking-[0.18em] text-white/40">Matches listings named</div>
        <input
          value={matchNames}
          onChange={(event) => {
            setMatchNames(event.target.value);
            setMatchSaved(false);
            setMatchError('');
          }}
          className={`mt-2 ${fieldClass}`}
        />
        {matchError ? <p className="mt-2 text-sm text-red-300">{matchError}</p> : null}
        <div className="mt-2 flex items-center gap-3">
          <button
            type="button"
            onClick={saveMatchNames}
            // Not disabled for an empty list: tapping it says why it cannot be saved.
            disabled={busy !== null}
            className="rounded-full border border-white/20 px-5 py-2.5 text-xs uppercase tracking-[0.18em] text-white disabled:opacity-40"
          >
            {busy === 'match' ? 'Saving...' : matchSaved ? 'Saved' : 'Save names'}
          </button>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-white/40">
          Listings whose compound name matches one of these count as this compound, so the directory page does not
          suggest them as a new compound. The compound name is the part of a listing name before the first dash
          &mdash; <strong className="text-white/60">Marassi</strong> in &ldquo;Marassi - Chalet&rdquo;. Add every
          spelling your listings use, comma separated, so Marassi also covers{' '}
          <strong className="text-white/60">Marassi Marina</strong>. Capitalisation and punctuation do not matter.
        </p>
      </div>
    </div>
  );
}
