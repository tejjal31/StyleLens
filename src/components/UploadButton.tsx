import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { analyzeItem } from "@/lib/style.functions";
import { useWardrobeActions } from "@/lib/wardrobe";

export function UploadButton() {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(0);
  const actions = useWardrobeActions();
  const analyze = useServerFn(analyzeItem);

  async function handle(files: FileList | null) {
    if (!files?.length) return;
    const list = Array.from(files).filter((f) => f.type.startsWith("image/") && f.size < 10 * 1024 * 1024);
    if (list.length < files.length) toast.error("Some files were skipped (images under 10MB only).");
    setBusy((b) => b + list.length);
    await Promise.all(
      list.map(async (f) => {
        try {
          const id = await actions.upload(f);
          actions.refresh();
          await analyze({ data: { id } });
          toast.success("Added to your closet ♥");
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Upload failed");
        } finally {
          setBusy((b) => b - 1);
          actions.refresh();
        }
      }),
    );
    if (ref.current) ref.current.value = "";
  }

  return (
    <>
      <input ref={ref} type="file" accept="image/*" multiple hidden onChange={(e) => handle(e.target.files)} />
      <button
        onClick={() => ref.current?.click()}
        className="bounce-hover inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-soft"
      >
        {busy > 0 ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        {busy > 0 ? `Adding ${busy}…` : "Add Item"}
      </button>
    </>
  );
}
