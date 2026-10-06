// Pair with <input list={id}>: gives a text box that also offers a dropdown
// of existing series, while still accepting anything typed.
export function SeriesDatalist({ id, options }: { id: string; options: string[] }) {
  return (
    <datalist id={id}>
      {options.map((option) => (
        <option key={option} value={option} />
      ))}
    </datalist>
  );
}
