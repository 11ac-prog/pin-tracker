import { fixChristmasSale } from "./actions";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <form action={fixChristmasSale}>
      <button type="submit">Apply Christmas sale correction</button>
    </form>
  );
}
