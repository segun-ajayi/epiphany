import { useState } from "react";
import { Play, Headphones, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { PublicSermon } from "@/lib/content/public.types";

type Mode = "watch" | "listen" | null;
type Variant = React.ComponentProps<typeof Button>["variant"];

export function SermonMediaActions({
  sermon,
  watchVariant = "default",
  secondaryVariant = "outline",
}: {
  sermon: PublicSermon;
  watchVariant?: Variant;
  secondaryVariant?: Variant;
}) {
  const [mode, setMode] = useState<Mode>(null);

  return (
    <>
      {sermon.youtubeUrl && (
        <Button variant={watchVariant} onClick={() => setMode("watch")}>
          <Play className="size-4" /> Watch
        </Button>
      )}
      {sermon.audioUrl && (
        <Button variant={secondaryVariant} onClick={() => setMode("listen")}>
          <Headphones className="size-4" /> Listen
        </Button>
      )}
      {sermon.notesUrl && (
        <Button variant={secondaryVariant} asChild>
          <a href={sermon.notesUrl} target="_blank" rel="noopener noreferrer">
            <FileText className="size-4" /> Notes
          </a>
        </Button>
      )}

      <Dialog open={mode !== null} onOpenChange={(o) => !o && setMode(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-background">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle className="font-display text-2xl">
              {mode === "watch" ? "Watch" : "Listen"} · {sermon.title}
            </DialogTitle>
            <DialogDescription>
              {sermon.speaker} · {sermon.scripture}
            </DialogDescription>
          </DialogHeader>
          <div className="p-6 pt-4">
            {mode === "watch" && sermon.youtubeUrl && (
              <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
                <iframe
                  key={sermon.youtubeUrl}
                  src={youtubeEmbedUrl(sermon.youtubeUrl)}
                  title={`YouTube — ${sermon.title}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="size-full border-0"
                />
              </div>
            )}
            {mode === "listen" && sermon.audioUrl && (
              <div className="rounded-lg border border-border p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  The recording opens on the church's audio provider.
                </p>
                <Button asChild className="mt-4">
                  <a href={sermon.audioUrl} target="_blank" rel="noopener noreferrer">
                    <Headphones className="size-4" /> Open audio recording
                  </a>
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function youtubeEmbedUrl(value: string) {
  const url = new URL(value);
  const host = url.hostname.replace(/^www\./, "");
  const id =
    host === "youtu.be"
      ? url.pathname.split("/").filter(Boolean)[0]
      : /^\/(embed|shorts|live)\//.test(url.pathname)
        ? url.pathname.split("/")[2]
        : url.searchParams.get("v");
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id || "")}?autoplay=1&rel=0`;
}
