"use client";
export function GameHrLimitPanel({
  limit,
  disabled,
  save,
}: {
  limit: number;
  disabled: boolean;
  save: (value: { fenceLimit: number; reason: string }) => void;
}) {
  return (
    <details>
      <summary>Change HR limit for this game</summary>
      <p>
        This recalculates every play, player statistic and beverage adjustment
        in this game. The competition default and other games stay
        unchanged.
      </p>
      <form
        key={limit}
        className="club-form"
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          save({
            fenceLimit: Number(f.get("fenceLimit")),
            reason: String(f.get("reason")).trim(),
          });
        }}
      >
        <fieldset disabled={disabled}>
          <label>
            New fence HR limit
            <input
              name="fenceLimit"
              type="number"
              min={0}
              max={100}
              defaultValue={limit}
              required
            />
          </label>
          <label>
            HR limit correction reason
            <input name="reason" maxLength={200} required />
          </label>
          <button className="button secondary">
            Apply limit and recalculate game
          </button>
        </fieldset>
      </form>
    </details>
  );
}
