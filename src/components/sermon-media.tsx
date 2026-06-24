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
import type { Sermon } from "@/data/church";

type Mode = "watch" | "listen" | null;
type Variant = React.ComponentProps<typeof Button>["variant"];

export function SermonMediaActions({
  sermon,
  watchVariant = "default",
  secondaryVariant = "outline",
}: {
  sermon: Sermon;
  watchVariant?: Variant;
  secondaryVariant?: Variant;
}) {
  const [mode, setMode] = useState<Mode>(null);

  return (
    <>
      <Button variant={watchVariant} onClick={() => setMode("watch")}>
        <Play className="size-4" /> Watch
      </Button>
      <Button variant={secondaryVariant} onClick={() => setMode("listen")}>
        <Headphones className="size-4" /> Listen
      </Button>
      <Button variant={secondaryVariant} asChild>
        <a href={sermon.notesPdf} download target="_blank" rel="noopener noreferrer">
          <FileText className="size-4" /> Notes
        </a>
      </Button>

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
            {mode === "watch" && (
              <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
                <iframe
                  key={sermon.youtubeId}
                  src={`https://www.youtube.com/embed/${sermon.youtubeId}?autoplay=1&rel=0`}
                  title={`YouTube — ${sermon.title}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="size-full border-0"
                />
              </div>
            )}
            {mode === "listen" && (
              <div className="w-full overflow-hidden rounded-lg border border-border">
                <iframe
                  key={sermon.mixlrUrl}
                  src={sermon.mixlrUrl}
                  title={`Mixlr — ${sermon.title}`}
                  allow="autoplay"
                  className="w-full h-[180px] border-0"
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
