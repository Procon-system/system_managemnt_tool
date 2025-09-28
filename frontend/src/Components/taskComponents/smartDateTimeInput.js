import React, { useEffect, useMemo, useRef, useState } from "react";

/** helpers */
const pad = (n) => String(n).padStart(2, "0");
const toLocalDateInput = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const clamp = (val, min, max) => Math.max(min, Math.min(max, val));
const isValidDate = (d) => d instanceof Date && !isNaN(d);

/** serialize Date to `YYYY-MM-DD HH:mm` (for display) */
function toDisplay(dt) {
  if (!isValidDate(dt)) return "";
  return `${toLocalDateInput(dt)} ${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
}

/** serialize Date to `YYYY-MM-DDTHH:mm` (for form value) */
function toLocalISO(dt) {
  if (!isValidDate(dt)) return "";
  return `${toLocalDateInput(dt)}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
}

/** parse incoming value (string ISO or Date) */
function parseValue(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  const d = new Date(value);
  return isValidDate(d) ? d : null;
}

/** convert {dateStr,hh,mm} -> Date in local time */
function combineLocal(dateStr, hh, mm) {
  const [y, m, day] = dateStr.split("-").map(Number);
  const d = new Date();
  d.setFullYear(y);
  d.setMonth(m - 1);
  d.setDate(day);
  d.setHours(hh, mm, 0, 0);
  return d;
}

/** hour / minute spin box with keyboard + wheel */
function SpinBox({ label, value, min, max, step, onChange }) {
  const onWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? step : -step;
    const next = clamp(value + delta, min, max);
    onChange(next);
  };
  const onKeyDown = (e) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      onChange(clamp(value + step, min, max));
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      onChange(clamp(value - step, min, max));
    }
    if (e.key === "Escape") document.activeElement?.blur();
  };
  return (
    <div className="flex flex-col items-center">
      <input
        inputMode="numeric"
        pattern="[0-9]*"
        onWheel={onWheel}
        onKeyDown={onKeyDown}
        value={pad(value)}
        onChange={(e) => {
          const v = parseInt(e.target.value.replace(/\D/g, ""), 10);
          if (!isNaN(v)) onChange(clamp(v, min, max));
        }}
        className="w-16 text-center text-lg font-semibold rounded-lg border px-2 py-2 focus:outline-none focus:ring-2 focus:ring-gray-300"
        aria-label={label}
      />
      <span className="mt-1 text-xs text-gray-400">{label}</span>
    </div>
  );
}

function TimePopover({ open, anchorRef, hh, mm, onChangeHM, dateStr, onDateChange, onClose }) {
  const popRef = useRef(null);
  const [style, setStyle] = useState({});

  // Position under anchor, clamped to viewport
  useEffect(() => {
    if (!open || !anchorRef?.current) return;
    const r = anchorRef.current.getBoundingClientRect();
    const width = 280;
    const height = 300;
    let left = r.left;
    let top = r.bottom + 8;

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    if (left + width > vw - 8) left = Math.max(8, vw - width - 8);
    if (top + height > vh - 8) top = Math.max(8, r.top - height - 8);

    setStyle({ position: "fixed", top: `${top}px`, left: `${left}px`, width });
  }, [open, anchorRef]);

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return;
    function onDoc(e) {
      if (popRef.current?.contains(e.target) || anchorRef.current?.contains(e.target)) return;
      onClose();
    }
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, anchorRef]);

  // ✅ compute from current selection without a hook
  const base = combineLocal(dateStr, hh, mm);

  if (!open) return null;

  const addMinutes = (d, mins) => new Date(d.getTime() + mins * 60000);
  const addHours   = (d, hrs)  => addMinutes(d, hrs * 60);

  // Apply a Date to both date & time (round minutes to 5)
  const applyDateTime = (d) => {
    const roundedMin = d.getMinutes() - (d.getMinutes() % 5);
    onDateChange({ target: { value: toLocalDateInput(d) } });
    onChangeHM(d.getHours(), roundedMin);
  };

  // SpinBox nudges (carry minute wrapping correctly)
  const bump = (key, delta) => {
    const cur = combineLocal(dateStr, hh, mm);
    let next = new Date(cur);
    if (key === "hh") next = addHours(cur, delta);
    else next = addMinutes(cur, delta);
    applyDateTime(next);
  };

  // Presets (relative to selected base; “Now” uses real time)
  const presets = [
    { label: "Now",            fn: () => new Date() },
    { label: "+15m",           fn: (b) => addMinutes(b, 15) },
    { label: "+30m",           fn: (b) => addMinutes(b, 30) },
    { label: "+1h",            fn: (b) => addHours(b, 1) },
    { label: "Tonight 20:00",  fn: (b) => { const d = new Date(b); d.setHours(20, 0, 0, 0); return d; } },
    { label: "Tomorrow 09:00", fn: (b) => { const d = new Date(b); d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0); return d; } },
  ];

  const setPreset = (fn) => {
    const d = fn(fn === presets[0].fn ? undefined : base);
    applyDateTime(d);
  };

  return (
    <div
      ref={popRef}
      className="z-50 rounded-xl border bg-white shadow-2xl p-3"
      style={style}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Date */}
      <div className="mb-3">
        <label className="block text-xs text-gray-500 mb-1">Date</label>
        <input
          type="date"
          value={dateStr}
          onChange={onDateChange}
          className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-300"
        />
      </div>

      {/* Time (HH / MM) */}
      <div className="flex items-center justify-center gap-3">
        <SpinBox label="HH" value={hh} min={0} max={23} step={1} onChange={(v) => onChangeHM(v, mm)} />
        <span className="text-gray-400 select-none">:</span>
        <SpinBox label="MM" value={mm} min={0} max={59} step={5} onChange={(v) => onChangeHM(hh, v - (v % 5))} />
      </div>

      {/* Nudges */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        <button type="button" onClick={() => bump("hh", +1)} className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200 text-sm">+1h</button>
        <button type="button" onClick={() => bump("mm", +5)} className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200 text-sm">+5m</button>
        <button type="button" onClick={() => bump("mm", -5)} className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200 text-sm">-5m</button>
      </div>

      {/* Presets */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        {presets.map((p) => (
          <button
            key={p.label}
            onClick={() => setPreset(p.fn)}
            type="button"
            className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200 text-sm"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="mt-3 text-right space-x-2">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="px-3 py-2 rounded bg-gray-800 text-white text-sm"
        >
          Done
        </button>
      </div>
    </div>
  );
}

export default function SmartDateTimeInput({
  label,
  name,
  value, 
  onChange,
  required,
  placeholder = "YYYY-MM-DD HH:mm",
}) {
  const anchorRef = useRef(null);
  const [open, setOpen] = useState(false);

  const dt = useMemo(() => parseValue(value) || new Date(), [value]);
  const dateStr = toLocalDateInput(dt);
  const hh = dt.getHours();
  const mm = dt.getMinutes() - (dt.getMinutes() % 5);

  const emit = (d) => onChange?.({ target: { name, value: toLocalISO(d) } });

  const onDateChange = (e) => emit(combineLocal(e.target.value, hh, mm));
  const onHMChange = (H, M) => emit(combineLocal(dateStr, H, M));

  return (
    <div className="w-full">
      {label && (
        <label className="block mb-1 text-sm font-medium text-gray-700">{label}</label>
      )}

      {/* Single display input (date + time) */}
      <div className="relative">
        <button
          ref={anchorRef}
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="w-full text-left rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-300 flex items-center justify-between"
          aria-haspopup="dialog"
          aria-expanded={open}
        >
          <span className={value ? "text-gray-900" : "text-gray-400"}>
            {value ? toDisplay(dt) : placeholder}
          </span>
          <svg
            className="h-5 w-5 text-gray-500 shrink-0"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M6 8a1 1 0 012 0v1h4V8a1 1 0 112 0v1h1a2 2 0 012 2v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4a2 2 0 012-2h1V8z" />
            <path d="M7 2a1 1 0 000 2h6a1 1 0 100-2H7z" />
          </svg>
        </button>

        <TimePopover
          open={open}
          anchorRef={anchorRef}
          hh={hh}
          mm={mm}
          onChangeHM={onHMChange}
          dateStr={dateStr}
          onDateChange={onDateChange}
          onClose={() => setOpen(false)}
        />
      </div>
    </div>
  );
}
