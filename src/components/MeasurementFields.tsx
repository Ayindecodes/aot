import type { MeasurementField } from "@/data/products";
import { MAX_INCHES, MAX_NOTES_LENGTH, MIN_INCHES, type Measurements } from "@/lib/order";

export type MeasurementValues = { girth: string; length: string; notes: string };

export const emptyMeasurements: MeasurementValues = { girth: "", length: "", notes: "" };

export function toMeasurements(
  { girth, length, notes }: MeasurementValues,
  field: MeasurementField,
): Measurements {
  return { [field]: Number(girth), length: Number(length), notes: notes.trim() || undefined };
}

export function MeasurementFields({
  idPrefix,
  field,
  values,
  onChange,
}: {
  idPrefix: string;
  field: MeasurementField;
  values: MeasurementValues;
  onChange: (values: MeasurementValues) => void;
}) {
  const isWaist = field === "waist";

  return (
    <div className="rounded-lg bg-cream p-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor={`${idPrefix}-${field}`} className="label">
            {isWaist ? "Waist" : "Bust"} (inches)
          </label>
          <input
            id={`${idPrefix}-${field}`}
            type="number"
            inputMode="decimal"
            min={MIN_INCHES}
            max={MAX_INCHES}
            step="0.5"
            value={values.girth}
            onChange={(event) => onChange({ ...values, girth: event.target.value })}
            className="field"
          />
        </div>
        <div>
          <label htmlFor={`${idPrefix}-length`} className="label">
            Length (inches)
          </label>
          <input
            id={`${idPrefix}-length`}
            type="number"
            inputMode="decimal"
            min={MIN_INCHES}
            max={MAX_INCHES}
            step="0.5"
            value={values.length}
            onChange={(event) => onChange({ ...values, length: event.target.value })}
            className="field"
          />
        </div>
      </div>
      <div className="mt-3">
        <label htmlFor={`${idPrefix}-notes`} className="label">
          Notes (optional)
        </label>
        <textarea
          id={`${idPrefix}-notes`}
          rows={2}
          maxLength={MAX_NOTES_LENGTH}
          value={values.notes}
          onChange={(event) => onChange({ ...values, notes: event.target.value })}
          className="field"
        />
      </div>
      <details className="mt-3 text-sm text-muted">
        <summary className="cursor-pointer font-medium text-mocha">How to measure</summary>
        {isWaist ? (
          <>
            <p className="mt-2 leading-relaxed">
              <strong>Waist:</strong> measure around your waist where you want the skirt to sit,
              keeping the tape level and comfortable.
            </p>
            <p className="mt-1 leading-relaxed">
              <strong>Length:</strong> measure from your waist down to where you want the piece to
              end.
            </p>
          </>
        ) : (
          <>
            <p className="mt-2 leading-relaxed">
              <strong>Bust:</strong> measure around the fullest part of your chest, keeping the tape
              level and comfortable.
            </p>
            <p className="mt-1 leading-relaxed">
              <strong>Length:</strong> measure from the top of your shoulder down to where you want
              the piece to end.
            </p>
          </>
        )}
      </details>
    </div>
  );
}
