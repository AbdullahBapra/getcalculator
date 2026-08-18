/** A compact reference table for results that are naturally row-by-row (tax paid per
 *  bracket, pace per mile, a lookup) rather than one number — no charting logic here,
 *  this is a case where the "creative" move is admitting a table is the honest shape
 *  for the data instead of forcing it into a chart. Server-renderable (no client state,
 *  nothing animates) since a table doesn't need to draw itself in to be legible. */
export default function ResultTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
      <table className="w-full min-w-max text-sm">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/60">
            {headers.map((h, i) => (
              <th
                key={i}
                className={`px-4 py-2.5 font-semibold text-zinc-600 dark:text-zinc-400 ${i === 0 ? "text-left" : "text-right"}`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className={ri % 2 === 1 ? "bg-zinc-50/60 dark:bg-zinc-900/30" : ""}>
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  className={`px-4 py-2 whitespace-nowrap text-zinc-700 dark:text-zinc-300 ${ci === 0 ? "text-left font-medium" : "text-right tabular-nums"}`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
