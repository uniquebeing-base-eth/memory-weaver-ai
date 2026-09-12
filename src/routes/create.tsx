import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Wand2 } from "lucide-react";
import { Screen } from "@/components/Screen";
import { addMemory, ARTWORK_POOL, CURRENT_USER, MOOD_LABEL } from "@/lib/diary-store";
import { quote, routeAgent, settleX402, type Mood } from "@/lib/protocol";
import mascot from "@/assets/mascot.png";

export const Route = createFileRoute("/create")({
  validateSearch: (search: Record<string, unknown>): { seed?: string } =>
    typeof search["seed"] === "string" ? { seed: search["seed"] } : {},
  head: () => ({
    meta: [
      { title: "Create a Memory — Dear Diary" },
      {
        name: "description",
        content: "Write down a memory and Dear Diary turns it into a one-of-a-kind artwork.",
      },
      { property: "og:title", content: "Create a Memory — Dear Diary" },
      { property: "og:description", content: "Write a memory, get artwork back." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CreateMemory,
});

const moods: Mood[] = ["warm", "dreamy", "bright", "quiet"];
const moodTone: Record<Mood, string> = {
  warm: "bg-blush text-blush-foreground",
  dreamy: "bg-grape text-grape-foreground",
  bright: "bg-butter text-butter-foreground",
  quiet: "bg-mint text-mint-foreground",
};

const steps = [
  "Reading your memory…",
  "Finding the right feeling…",
  "Painting it, slowly…",
  "Adding the last details…",
];

function CreateMemory() {
  const { seed } = Route.useSearch();
  const navigate = useNavigate();
  const [story, setStory] = useState(seed ? `${seed}: ` : "");
  const [mood, setMood] = useState<Mood>("warm");
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(0);

  const price = quote(routeAgent({ memory: story, mood }));

  async function onCreate() {
    if (story.trim().length < 8) return;
    setBusy(true);
    for (let i = 0; i < steps.length; i++) {
      setStep(i);
      await new Promise((r) => setTimeout(r, 850));
    }
    const agent = routeAgent({ memory: story, mood });
    const receipt = await settleX402(quote(agent));
    const id = `m${Date.now()}`;
    addMemory({
      id,
      title: story.trim().split(/[.!?]/)[0]!.slice(0, 60) || "Untitled memory",
      story: story.trim(),
      mood,
      imageUrl: ARTWORK_POOL[Math.floor(Math.random() * ARTWORK_POOL.length)]!,
      author: CURRENT_USER,
      createdAt: "just now",
      status: "saved",
      hearts: 0,
      keepsakes: 0,
      receipt,
    });
    navigate({ to: "/memory/$id", params: { id } });
  }

  if (busy) return <GeneratingState step={step} />;

  return (
    <Screen>
      <header className="flex items-center gap-3 px-6 pt-7">
        <button
          onClick={() => navigate({ to: "/" })}
          aria-label="Back"
          className="press grid h-10 w-10 place-items-center rounded-full bg-card shadow-soft"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-2xl font-semibold">Create a Memory</h1>
      </header>

      <section className="px-6 pt-6">
        <div className="surface-card p-5">
          <label htmlFor="story" className="text-sm font-bold text-muted-foreground">
            Write it like you'd tell a friend
          </label>
          <textarea
            id="story"
            value={story}
            onChange={(e) => setStory(e.target.value)}
            rows={7}
            placeholder="The night we walked home in the rain and didn't mind at all…"
            className="mt-3 w-full resize-none bg-transparent font-display text-[1.35rem] leading-snug outline-none placeholder:text-muted-foreground/60"
          />
          <p className="text-right text-xs font-semibold text-muted-foreground">
            {story.trim().length} characters
          </p>
        </div>
      </section>

      <section className="px-6 pt-6">
        <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-muted-foreground">
          How did it feel?
        </h2>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {moods.map((m) => (
            <button
              key={m}
              onClick={() => setMood(m)}
              className={`press rounded-2xl py-3 text-sm font-bold ${moodTone[m]} ${
                mood === m ? "ring-2 ring-foreground ring-offset-2 ring-offset-background" : "opacity-70"
              }`}
            >
              {MOOD_LABEL[m]}
            </button>
          ))}
        </div>
      </section>

      <section className="px-6 pt-6">
        <div className="rounded-3xl border border-dashed border-border p-5 text-sm">
          <div className="flex justify-between font-semibold">
            <span className="text-muted-foreground">Artwork</span>
            <span>${price.agentUsd.toFixed(2)}</span>
          </div>
          <div className="mt-1.5 flex justify-between font-semibold">
            <span className="text-muted-foreground">Dear Diary fee (10%)</span>
            <span>${price.feeUsd.toFixed(2)}</span>
          </div>
          <div className="mt-3 flex justify-between border-t border-border pt-3 text-base font-bold">
            <span>Total</span>
            <span>${price.totalUsd.toFixed(2)}</span>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Paid instantly from your wallet. We pick the best artist for your memory automatically.
          </p>
        </div>
      </section>

      <div className="px-6 pt-6">
        <button
          onClick={onCreate}
          disabled={story.trim().length < 8}
          className="press flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 text-base font-bold text-primary-foreground disabled:opacity-40"
        >
          <Wand2 className="h-4 w-4" /> Make my artwork
        </button>
      </div>
    </Screen>
  );
}

function GeneratingState({ step }: { step: number }) {
  return (
    <Screen nav={false}>
      <div className="flex min-h-screen flex-col items-center justify-center px-8 text-center">
        <div className="relative grid h-56 w-56 place-items-center">
          <div className="animate-spin-slow absolute inset-0 rounded-full gradient-dream blur-xl" />
          <div className="animate-float relative">
            <img src={mascot} alt="" width={768} height={768} className="w-36 drop-shadow-xl" />
          </div>
        </div>
        <h1 className="mt-8 text-[2rem] leading-tight font-semibold">Making something for you</h1>
        <p className="mt-3 text-sm font-semibold text-muted-foreground">{steps[step]}</p>
        <div className="mt-7 h-2 w-full max-w-xs overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
            style={{ width: `${((step + 1) / steps.length) * 100}%` }}
          />
        </div>
        <div className="relative mt-10 w-full max-w-xs overflow-hidden rounded-3xl">
          <div className="aspect-square w-full rounded-3xl bg-muted" />
          <div className="animate-shimmer absolute inset-y-0 w-1/2 bg-card/60 blur-lg" />
        </div>
      </div>
    </Screen>
  );
}
