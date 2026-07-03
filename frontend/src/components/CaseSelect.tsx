import { useEffect, useRef, useState } from "react";
import type { SampleCase } from "../lib/types";

interface CaseSelectProps {
  id?: string;
  cases: SampleCase[];
  value: string;
  onChange: (caseId: string) => void;
}

export function CaseSelect({ id, cases, value, onChange }: CaseSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = cases.find((c) => c.case_id === value);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div className="case-select" ref={rootRef}>
      <button
        type="button"
        id={id}
        className="case-select__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="case-select__value">
          {selected?.label ?? "케이스를 선택하세요"}
        </span>
        <span className={`case-select__chevron ${open ? "case-select__chevron--open" : ""}`}>
          ▾
        </span>
      </button>

      {open && (
        <ul className="case-select__list" role="listbox">
          {cases.map((c) => (
            <li
              key={c.case_id}
              role="option"
              aria-selected={c.case_id === value}
              className={`case-select__option ${
                c.case_id === value ? "case-select__option--selected" : ""
              }`}
              onClick={() => {
                onChange(c.case_id);
                setOpen(false);
              }}
            >
              <span>{c.label}</span>
              {c.case_id === value && <span className="case-select__check">✓</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
