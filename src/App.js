```jsx
/* PREVIEW */
import { useEffect, useMemo, useRef, useState } from "react";

function clampNumber(n, min, max) {
  if (Number.isNaN(n)) return min;
  return Math.min(max, Math.max(min, n));
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function formatTime(date) {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60_000);
}

function subtractMinutes(date, minutes) {
  return new Date(date.getTime() - minutes * 60_000);
}

// "HH:MM" (24h) -> "hh:mm AM/PM"
function hhmmToDisplay(hhmm) {
  if (!hhmm) return "";
  const [hhRaw, mmRaw] = hhmm.split(":");
  const hh = Number(hhRaw);
  const mm = Number(mmRaw);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return "";
  const isPM = hh >= 12;
  const hh12 = ((hh + 11) % 12) + 1;
  return `${pad2(hh12)}:${pad2(mm)} ${isPM ? "PM" : "AM"}`;
}

function displayPartsFromHHMM(hhmm) {
  if (!hhmm) return { hour12: 8, minute: 0, meridiem: "AM" };
  const [hhRaw, mmRaw] = hhmm.split(":");
  const hh = Number(hhRaw);
  const mm = Number(mmRaw);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return { hour12: 8, minute: 0, meridiem: "AM" };
  const meridiem = hh >= 12 ? "PM" : "AM";
  const hour12 = ((hh + 11) % 12) + 1;
  return { hour12, minute: mm, meridiem };
}

function toHHMM24(hour12, minute, meridiem) {
  const h12 = clampNumber(Number(hour12), 1, 12);
  const m = clampNumber(Number(minute), 0, 59);
  const isPM = meridiem === "PM";
  let h24 = h12 % 12;
  if (isPM) h24 += 12;
  return `${pad2(h24)}:${pad2(m)}`;
}

function useOutsideClick(refs, onOutside) {
  useEffect(() => {
    const onDown = (e) => {
      const target = e.target;
      const inside = refs.some((r) => r.current && r.current.contains(target));
      if (!inside) onOutside?.();
    };

    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown, { passive: true });

    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
    };
  }, [refs, onOutside]);
}

function ScrollColumn({ items, value, onPick, format }) {
  const listRef = useRef(null);
  const rowH = 56;

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const idx = items.findIndex((x) => x === value);
    if (idx < 0) return;
    const target = Math.max(0, idx * rowH - 2 * rowH);
    el.scrollTo({ top: target, behavior: "auto" });
  }, [items, value]);

  return (
    <div className="flex-1 min-w-0">
      <div
        ref={listRef}
        className="h-72 overflow-y-auto overflow-x-hidden"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {items.map((it) => {
          const active = it === value;
          return (
            <button
              key={String(it)}
              type="button"
              onClick={() => onPick(it)}
              className={
                "w-full h-14 px-2 flex items-center justify-center font-semibold tracking-tight transition " +
                (active ? "text-white" : "text-white/55 hover:text-white/90")
              }
              aria-pressed={active}
            >
              <span className="text-4xl leading-none">{format(it)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}


function TimePickerField({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const panelRef = useRef(null);

  useOutsideClick([wrapRef, panelRef], () => setOpen(false));

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const { hour12, minute, meridiem } = useMemo(() => displayPartsFromHHMM(value), [value]);

  const hours = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);
  const minutes = useMemo(() => Array.from({ length: 60 }, (_, i) => i), []);
  const meridiems = useMemo(() => ["AM", "PM"], []);

  const setPart = (nextHour12, nextMinute, nextMeridiem) => {
    const hhmm = toHHMM24(nextHour12, nextMinute, nextMeridiem);
    onChange?.(hhmm);
  };

  const display = hhmmToDisplay(value);

  return (
    <div className="w-full" ref={wrapRef}>
      <div className="relative w-full mt-2">
        {/* field stays the same shape */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-full h-16 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-left focus:outline-none focus:ring-2 focus:ring-indigo-400/70"
          aria-haspopup="dialog"
          aria-expanded={open}
        >
          <div className="flex items-center justify-between gap-3">
            <div className={display ? "text-white text-lg" : "text-white/35 text-lg"}>
              {display || "08:00 AM"}
            </div>

            <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 grid place-items-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="opacity-90">
                <path
                  d="M12 8v5l3 2M21 12a9 9 0 1 1-18 0a9 9 0 0 1 18 0Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-white"
                />
              </svg>
            </div>
          </div>
        </button>

        {open ? (
          <div
            ref={panelRef}
            className="absolute z-50 mt-3 w-[340px] max-w-[92vw] overflow-hidden rounded-2xl border border-black/10 bg-white shadow-xl"
            role="dialog"
            aria-label="Time picker"
          >
            {/* selected row (blue boxes) */}
            <div className="grid grid-cols-3 gap-3 p-4 pb-3">
              <button
                type="button"
                onClick={() => {}}
                className="h-12 rounded bg-[#0b6cff] text-white text-2xl font-semibold"
                aria-label="Selected hour"
              >
                {pad2(hour12)}
              </button>
              <button
                type="button"
                onClick={() => {}}
                className="h-12 rounded bg-[#0b6cff] text-white text-2xl font-semibold"
                aria-label="Selected minute"
              >
                {pad2(minute)}
              </button>
              <button
                type="button"
                onClick={() => {}}
                className="h-12 rounded bg-[#0b6cff] text-white text-2xl font-semibold"
                aria-label="Selected AM PM"
              >
                {meridiem}
              </button>
            </div>

            {/* lists */}
            <div className="grid grid-cols-3 gap-3 px-4 pb-4">
              <div className="max-h-72 overflow-auto pr-1">
                {hours.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setPart(h, minute, meridiem)}
                    className={
                      "w-full h-14 rounded flex items-center justify-center text-3xl font-semibold " +
                      (h === hour12 ? "bg-black/5 text-black" : "bg-transparent text-black hover:bg-black/5")
                    }
                    aria-pressed={h === hour12}
                  >
                    {pad2(h)}
                  </button>
                ))}
              </div>

              <div className="max-h-72 overflow-auto pr-1">
                {minutes.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPart(hour12, m, meridiem)}
                    className={
                      "w-full h-14 rounded flex items-center justify-center text-3xl font-semibold " +
                      (m === minute ? "bg-black/5 text-black" : "bg-transparent text-black hover:bg-black/5")
                    }
                    aria-pressed={m === minute}
                  >
                    {pad2(m)}
                  </button>
                ))}
              </div>

              <div className="max-h-72 overflow-auto pr-1">
                {meridiems.map((md) => (
                  <button
                    key={md}
                    type="button"
                    onClick={() => setPart(hour12, minute, md)}
                    className={
                      "w-full h-14 rounded flex items-center justify-center text-3xl font-semibold " +
                      (md === meridiem ? "bg-black/5 text-black" : "bg-transparent text-black hover:bg-black/5")
                    }
                    aria-pressed={md === meridiem}
                  >
                    {md}
                  </button>
                ))}
              </div>
            </div>

            <div className="px-4 pb-4 flex justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="h-10 px-4 rounded-lg bg-black text-white text-sm font-semibold hover:opacity-90"
              >
                Done
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}



function computeSchedule({ eventTime, prepMinutes, commuteMinutes, extraTimeMinutes }) {
  if (!eventTime) return null;

  const [hhRaw, mmRaw] = eventTime.split(":");
  const hh = Number(hhRaw);
  const mm = Number(mmRaw);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return null;

  const safeExtraTime = clampNumber(parseInt(String(extraTimeMinutes), 10), 0, 120);
  const safePrep = clampNumber(parseInt(String(prepMinutes), 10), 0, 24 * 60);
  const safeCommute = clampNumber(parseInt(String(commuteMinutes), 10), 0, 24 * 60);

  const eventDate = new Date();
  eventDate.setSeconds(0, 0);
  eventDate.setHours(hh, mm, 0, 0);

  const arriveBy = eventDate;
  const leaveBy = subtractMinutes(arriveBy, safeCommute + safeExtraTime);
  const startPrepBy = subtractMinutes(leaveBy, safePrep);

  const shower = Math.round(safePrep * 0.5);
  const eat = Math.max(0, safePrep - shower);

  const showerTime = startPrepBy;
  const eatTime = addMinutes(showerTime, shower);

  return {
    startPrepBy,
    showerTime,
    eatTime,
    leaveBy,
    arriveBy,
    meta: { shower, eat, safeExtraTime, safePrep, safeCommute },
  };
}

function Field({ id, label, helper, children, after }) {
  return (
    <div className="w-full flex flex-col items-start text-left">
      <label htmlFor={id} className="text-sm text-white/80">
        {label}
      </label>
      {children}
      {after ? <div className="mt-2 w-full">{after}</div> : null}
      <div className="mt-2 text-xs text-white/50">{helper}</div>
    </div>
  );
}

function MiniTimePresets({ options, value, fallbackActive, onSelect }) {
  const current = String(value ?? "").trim();
  return (
    <div className="grid grid-cols-5 gap-2 w-full">
      {options.map((m) => {
        const active = current !== "" ? parseInt(current, 10) === m : fallbackActive === m;
        return (
          <button
            key={m}
            type="button"
            onClick={() => onSelect(String(m))}
            className={
              "w-full rounded-full p-[1px] transition " +
              (active
                ? "bg-gradient-to-r from-fuchsia-500/80 via-indigo-500/80 to-cyan-400/80"
                : "bg-white/10 hover:bg-white/15")
            }
            aria-pressed={active}
          >
            <span
              className={
                "block w-full rounded-full py-1 text-[10px] leading-none text-center truncate " +
                (active ? "bg-slate-950/60 text-white" : "bg-white/5 text-white/80")
              }
            >
              {m}m
            </span>
          </button>
        );
      })}
    </div>
  );
}

function loadProfiles() {
  try {
    const raw = localStorage.getItem("pp_profiles_v1");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveProfiles(profiles) {
  try {
    localStorage.setItem("pp_profiles_v1", JSON.stringify(profiles));
  } catch {
    // ignore
  }
}

export default function App() {
  const [page, setPage] = useState("setup"); // setup | result

  const [eventTime, setEventTime] = useState(""); // "HH:MM" 24h
  const [prepMinutes, setPrepMinutes] = useState("");
  const [commuteMinutes, setCommuteMinutes] = useState("");
  const [extraTimeMinutes, setExtraTimeMinutes] = useState("");

  const [activePreset, setActivePreset] = useState("Normal");

  const [saveForFuture, setSaveForFuture] = useState(false);
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [settingName, setSettingName] = useState("");
  const [savedThisSession, setSavedThisSession] = useState(false);
  const nameRef = useRef(null);
  const [note, setNote] = useState("");

  const [profiles, setProfiles] = useState([]);

  const presets = useMemo(
    () => [
      { label: "Quick", prep: 30, commute: 20, extraTime: 5 },
      { label: "Normal", prep: 60, commute: 40, extraTime: 10 },
      { label: "Relaxed", prep: 90, commute: 60, extraTime: 15 },
    ],
    []
  );

  const normalDefaults = useMemo(() => presets.find((p) => p.label === "Normal") || presets[0], [presets]);

  const defaultsNow = useMemo(() => {
    const found = presets.find((p) => p.label === activePreset);
    return found || normalDefaults;
  }, [activePreset, presets, normalDefaults]);

  const effectivePrep = useMemo(
    () => (String(prepMinutes).trim() === "" ? defaultsNow.prep : prepMinutes),
    [prepMinutes, defaultsNow]
  );
  const effectiveCommute = useMemo(
    () => (String(commuteMinutes).trim() === "" ? defaultsNow.commute : commuteMinutes),
    [commuteMinutes, defaultsNow]
  );
  const effectiveExtra = useMemo(
    () => (String(extraTimeMinutes).trim() === "" ? defaultsNow.extraTime : extraTimeMinutes),
    [extraTimeMinutes, defaultsNow]
  );

  useEffect(() => {
    const all = loadProfiles();
    setProfiles(all);
    if (all.length === 0) return;

    let lastId = "";
    try {
      lastId = localStorage.getItem("pp_last_profile_id_v1") || "";
    } catch {
      lastId = "";
    }

    const last = all.find((p) => p?.id === lastId) || all[0];
    if (!last) return;

    if (typeof last?.prep === "number") setPrepMinutes(String(last.prep));
    if (typeof last?.commute === "number") setCommuteMinutes(String(last.commute));
    if (typeof last?.extraTime === "number") setExtraTimeMinutes(String(last.extraTime));
    if (typeof last?.preset === "string" && last.preset) setActivePreset(last.preset);

    setNote(`Loaded: ${last.name || "Saved setting"}`);
    window.setTimeout(() => setNote(""), 1400);
  }, []);

  useEffect(() => {
    if (showNamePrompt) {
      window.setTimeout(() => {
        try {
          nameRef.current?.focus?.();
        } catch {
          // ignore
        }
      }, 0);
    }
  }, [showNamePrompt]);

  useEffect(() => {
    setSavedThisSession(false);
  }, [prepMinutes, commuteMinutes, extraTimeMinutes, settingName]);

  const schedule = useMemo(() => {
    return computeSchedule({
      eventTime,
      prepMinutes: effectivePrep,
      commuteMinutes: effectiveCommute,
      extraTimeMinutes: effectiveExtra,
    });
  }, [eventTime, effectivePrep, effectiveCommute, effectiveExtra]);

  const isReadyToCalculate = Boolean(eventTime);

  const canSaveNamed =
    String(effectivePrep).trim() !== "" && String(effectiveCommute).trim() !== "" && String(effectiveExtra).trim() !== "";

  const applyPreset = (p) => {
    setActivePreset(p.label);
    setPrepMinutes(String(p.prep));
    setCommuteMinutes(String(p.commute));
    setExtraTimeMinutes(String(p.extraTime));
  };

  const resetPresetOnEdit = () => setActivePreset(null);

  const miniExtraOptions = [10, 20, 30, 40, 50];
  const miniReadyOptions = [15, 30, 45, 60, 90];
  const miniCommuteOptions = [10, 20, 30, 40, 60];

  const applyProfile = (p) => {
    setPrepMinutes(String(p.prep));
    setCommuteMinutes(String(p.commute));
    setExtraTimeMinutes(String(p.extraTime));
    setActivePreset(p.preset || "Normal");

    try {
      localStorage.setItem("pp_last_profile_id_v1", p.id);
    } catch {
      // ignore
    }

    setNote(`Using: ${p.name}`);
    window.setTimeout(() => setNote(""), 1400);
  };

  const saveProfileNow = () => {
    if (!saveForFuture) return true;
    if (!canSaveNamed) return true;

    const name = String(settingName).trim();
    if (!name) {
      setShowNamePrompt(true);
      setNote("Name your setting to save it");
      window.setTimeout(() => setNote(""), 1400);
      return false;
    }

    const prep = parseInt(String(effectivePrep), 10);
    const commute = parseInt(String(effectiveCommute), 10);
    const extraTime = parseInt(String(effectiveExtra), 10);

    if (Number.isNaN(prep) || Number.isNaN(commute) || Number.isNaN(extraTime)) return false;

    const id = `p_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const preset = activePreset || "";

    const existing = loadProfiles();
    const next = [{ id, name, prep, commute, extraTime, preset, createdAt: new Date().toISOString() }, ...existing].slice(0, 20);

    saveProfiles(next);
    setProfiles(next);

    try {
      localStorage.setItem("pp_last_profile_id_v1", id);
    } catch {
      // ignore
    }

    setSavedThisSession(true);
    setShowNamePrompt(false);
    setNote("Saved for future use");
    window.setTimeout(() => setNote(""), 1400);
    return true;
  };

  const InputGrid = (showMiniPresets) => (
    <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
      <Field id="eventTime" label="Event time" helper="When you must be there">
        <TimePickerField value={eventTime} onChange={setEventTime} />
      </Field>

      <Field
        id="extraTime"
        label="Extra time, minutes"
        helper="Extra time for traffic, delays, or small problems"
        after={
          showMiniPresets ? (
            <MiniTimePresets
              options={miniExtraOptions}
              value={extraTimeMinutes}
              fallbackActive={parseInt(String(defaultsNow.extraTime), 10)}
              onSelect={(v) => {
                setExtraTimeMinutes(v);
                resetPresetOnEdit();
              }}
            />
          ) : null
        }
      >
        <input
          id="extraTime"
          type="number"
          inputMode="numeric"
          min={0}
          max={120}
          value={extraTimeMinutes}
          placeholder={String(defaultsNow.extraTime)}
          onChange={(e) => {
            setExtraTimeMinutes(e.target.value);
            resetPresetOnEdit();
          }}
          className="mt-2 w-full h-12 rounded-xl border border-white/10 bg-white/5 text-white px-3 py-2 placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-indigo-400/70"
        />
      </Field>

      <Field
        id="gettingReady"
        label="Getting ready time, minutes"
        helper="Time for shower, eat, clothes, and small tasks"
        after={
          showMiniPresets ? (
            <MiniTimePresets
              options={miniReadyOptions}
              value={prepMinutes}
              fallbackActive={parseInt(String(defaultsNow.prep), 10)}
              onSelect={(v) => {
                setPrepMinutes(v);
                resetPresetOnEdit();
              }}
            />
          ) : null
        }
      >
        <input
          id="gettingReady"
          type="number"
          inputMode="numeric"
          min={0}
          max={1440}
          value={prepMinutes}
          placeholder={String(defaultsNow.prep)}
          onChange={(e) => {
            setPrepMinutes(e.target.value);
            resetPresetOnEdit();
          }}
          className="mt-2 w-full h-12 rounded-xl border border-white/10 bg-white/5 text-white px-3 py-2 placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-indigo-400/70"
        />
      </Field>

      <Field
        id="commute"
        label="Commute time, minutes"
        helper="How long it takes to travel there"
        after={
          showMiniPresets ? (
            <MiniTimePresets
              options={miniCommuteOptions}
              value={commuteMinutes}
              fallbackActive={parseInt(String(defaultsNow.commute), 10)}
              onSelect={(v) => {
                setCommuteMinutes(v);
                resetPresetOnEdit();
              }}
            />
          ) : null
        }
      >
        <input
          id="commute"
          type="number"
          inputMode="numeric"
          min={0}
          max={1440}
          value={commuteMinutes}
          placeholder={String(defaultsNow.commute)}
          onChange={(e) => {
            setCommuteMinutes(e.target.value);
            resetPresetOnEdit();
          }}
          className="mt-2 w-full h-12 rounded-xl border border-white/10 bg-white/5 text-white px-3 py-2 placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-indigo-400/70"
        />
      </Field>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-4 py-10 flex items-center justify-center">
      <div className="w-full max-w-xl">
        <div className="rounded-2xl shadow-2xl border border-white/10 overflow-hidden bg-white/5 backdrop-blur-xl">
          <div className="p-6">
            <div className="flex flex-col items-center text-center gap-3">
              <h1 className="text-xl font-semibold text-white">Punctuality Planner</h1>
              <p className="text-sm text-white/70 max-w-md">Pick a pace, set your times, then get a clear plan.</p>

              {page === "result" && schedule ? (
                <div className="mt-2">
                  <div className="text-xs text-white/60">Start getting ready</div>
                  <div className="mt-1 text-5xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-fuchsia-400 via-indigo-300 to-cyan-300 bg-clip-text text-transparent">
                    {formatTime(schedule.startPrepBy)}
                  </div>
                </div>
              ) : null}

              {page === "result" ? (
                <button type="button" onClick={() => setPage("setup")} className="mt-1 text-xs text-white/60 hover:text-white/80">
                  Edit inputs
                </button>
              ) : null}
            </div>

            <div className="mt-6 w-full max-w-md mx-auto grid grid-cols-3 gap-3 sm:max-w-none sm:flex sm:justify-center sm:gap-4">
              {presets.map((p) => (
                <button
                  key={p.label}
                  onClick={() => applyPreset(p)}
                  className={
                    "w-full sm:w-auto rounded-2xl p-[1px] transition " +
                    (activePreset === p.label
                      ? "bg-gradient-to-r from-fuchsia-500/90 via-indigo-500/90 to-cyan-400/90 shadow-lg shadow-fuchsia-500/20"
                      : "bg-white/10 hover:bg-white/15")
                  }
                  type="button"
                >
                  <span
                    className={
                      "w-full sm:w-auto flex items-center justify-center rounded-2xl px-5 py-4 text-sm sm:text-base font-semibold " +
                      (activePreset === p.label ? "bg-slate-950/60 text-white" : "bg-white/5 text-white/85")
                    }
                  >
                    {p.label}
                  </span>
                </button>
              ))}
            </div>

            {page === "setup" ? (
              <>
                {InputGrid(true)}

                <button
                  type="button"
                  disabled={!isReadyToCalculate}
                  onClick={() => {
                    if (!isReadyToCalculate) return;
                    if (saveForFuture && !savedThisSession) {
                      const ok = saveProfileNow();
                      if (!ok) return;
                    }
                    setPage("result");
                  }}
                  className={
                    "mt-6 w-full h-12 rounded-xl font-semibold transition " +
                    (isReadyToCalculate
                      ? "bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white shadow-lg shadow-fuchsia-500/20 hover:opacity-95 active:opacity-90"
                      : "bg-white/10 text-white/40 cursor-not-allowed")
                  }
                >
                  Calculate
                </button>

                <div className="mt-4 w-full">
                  <label className={"flex items-center gap-2 text-xs select-none " + (canSaveNamed ? "text-white/70" : "text-white/35")}>
                    <input
                      type="checkbox"
                      checked={saveForFuture}
                      disabled={!canSaveNamed}
                      onChange={(e) => {
                        const next = e.target.checked;
                        setSaveForFuture(next);
                        if (next) {
                          setShowNamePrompt(true);
                          if (!String(settingName).trim()) setSettingName("");
                        } else {
                          setShowNamePrompt(false);
                          setSavedThisSession(false);
                        }
                      }}
                      className="h-4 w-4 rounded border-white/20 bg-white/10 text-indigo-400 focus:ring-indigo-400/70"
                    />
                    Save setting for future use
                  </label>

                  {showNamePrompt && saveForFuture ? (
                    <div className="mt-3">
                      <div className="text-xs text-white/60 mb-2">Name this setting</div>

                      <div className="flex items-center gap-3">
                        <input
                          ref={nameRef}
                          type="text"
                          value={settingName}
                          onChange={(e) => setSettingName(e.target.value)}
                          placeholder="My school commute"
                          className="flex-1 h-12 rounded-xl border border-white/10 bg-white/5 text-white px-3 py-2 placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-indigo-400/70"
                        />

                        <button
                          type="button"
                          onClick={() => {
                            const ok = saveProfileNow();
                            if (!ok) return;
                          }}
                          disabled={!String(settingName).trim()}
                          className={
                            "h-12 rounded-xl px-4 font-semibold transition " +
                            (String(settingName).trim()
                              ? "bg-white/10 text-white/85 hover:bg-white/15"
                              : "bg-white/5 text-white/30 cursor-not-allowed")
                          }
                        >
                          Save
                        </button>
                      </div>

                      <div className="mt-2 text-[11px] text-white/45">Example: Morning walk, Church, School, Work</div>
                    </div>
                  ) : null}

                  {profiles.length > 0 ? (
                    <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
                      <div className="px-4 py-3 border-b border-white/10 text-center">
                        <div className="text-sm font-semibold text-white">Saved settings</div>
                        <div className="text-xs text-white/60 mt-1">Tap to apply</div>
                      </div>
                      <div className="p-3 space-y-2">
                        {profiles.slice(0, 6).map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => applyProfile(p)}
                            className="w-full text-left rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition px-3 py-2"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="text-sm font-semibold text-white/90 truncate">{p.name}</div>
                              <div className="text-[11px] text-white/60 whitespace-nowrap">{p.preset || "Custom"}</div>
                            </div>
                            <div className="mt-1 text-[11px] text-white/55">
                              Ready {p.prep}m, commute {p.commute}m, extra {p.extraTime}m
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {note ? <div className="mt-3 text-xs text-white/60 text-center">{note}</div> : null}
                </div>
              </>
            ) : null}
          </div>

          {page === "result" ? (
            <>
              <div className="border-t border-white/10 bg-white/5 p-6">
                {!schedule ? (
                  <div className="text-sm text-white/70 text-center">Missing inputs, go back and fill everything.</div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="rounded-xl bg-white/5 border border-white/10 p-3 sm:p-4">
                        <div className="text-xs text-white/60">Start</div>
                        <div className="mt-1 text-base sm:text-lg font-semibold text-white">{formatTime(schedule.startPrepBy)}</div>
                      </div>
                      <div className="rounded-xl bg-white/5 border border-white/10 p-3 sm:p-4">
                        <div className="text-xs text-white/60">Leave</div>
                        <div className="mt-1 text-base sm:text-lg font-semibold text-white">{formatTime(schedule.leaveBy)}</div>
                      </div>
                      <div className="rounded-xl bg-white/5 border border-white/10 p-3 sm:p-4">
                        <div className="text-xs text-white/60">Arrive</div>
                        <div className="mt-1 text-base sm:text-lg font-semibold text-white">{formatTime(schedule.arriveBy)}</div>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
                      <div className="px-4 py-3 border-b border-white/10 text-center">
                        <div className="text-sm font-semibold text-white">Simple timeline</div>
                        <div className="text-xs text-white/70 mt-1">
                          Shower {schedule.meta.shower}m, eat {schedule.meta.eat}m.
                        </div>
                      </div>

                      <ul className="divide-y divide-white/10">
                        <li className="px-4 py-3 flex items-center justify-between gap-3">
                          <span className="text-sm text-white/80">Start prep ⏰</span>
                          <span className="text-sm font-semibold text-white">{formatTime(schedule.startPrepBy)}</span>
                        </li>
                        <li className="px-4 py-3 flex items-center justify-between gap-3">
                          <span className="text-sm text-white/80">Shower 🚿</span>
                          <span className="text-sm font-semibold text-white">{formatTime(schedule.showerTime)}</span>
                        </li>
                        <li className="px-4 py-3 flex items-center justify-between gap-3">
                          <span className="text-sm text-white/80">Eat 🍽️</span>
                          <span className="text-sm font-semibold text-white">{formatTime(schedule.eatTime)}</span>
                        </li>
                        <li className="px-4 py-3 flex items-center justify-between gap-3">
                          <span className="text-sm text-white/80">Leave by 🚗</span>
                          <span className="text-sm font-semibold text-white">{formatTime(schedule.leaveBy)}</span>
                        </li>
                        <li className="px-4 py-3 flex items-center justify-between gap-3">
                          <span className="text-sm text-white/80">Arrive by 📍</span>
                          <span className="text-sm font-semibold text-white">{formatTime(schedule.arriveBy)}</span>
                        </li>
                      </ul>
                    </div>

                    <div className="text-xs text-white/70 text-center">Includes extra time: {schedule.meta.safeExtraTime} minutes.</div>
                  </div>
                )}
              </div>

              <div className="border-t border-white/10 bg-white/5 p-6">
                <div className="text-xs text-white/60 text-center">Adjust inputs</div>
                {InputGrid(false)}
              </div>
            </>
          ) : null}

          <div className="border-t border-white/10 bg-white/5 px-6 py-4 text-center">
            <div className="text-xs text-white/60">
              Made by{" "}
              <a
                href="https://www.linkedin.com/in/michaelkitticai/"
                target="_blank"
                rel="noreferrer"
                className="underline text-white/80 hover:text-white"
              >
                Kitticai
              </a>{" "}
              ❤️
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```
