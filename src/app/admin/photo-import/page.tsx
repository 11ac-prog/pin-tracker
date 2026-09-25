import { PhotoImportRunner } from "./PhotoImportRunner";
import { listPinsNeedingPhotos } from "./actions";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export default async function PhotoImportPage() {
  const pending = await listPinsNeedingPhotos();

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">Photo import</h1>
        <p className="text-sm text-slate-500">
          Backfills photos for pins that don&apos;t have one yet: give it a photo URL (from{" "}
          <a
            href="https://pinandpop.com"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-emerald-300 underline underline-offset-4"
          >
            Pin &amp; Pop
          </a>{" "}
          or anywhere else) and it downloads and re-hosts it on your own storage.
        </p>
      </div>
      <PhotoImportRunner initialPending={pending} />
    </div>
  );
}
