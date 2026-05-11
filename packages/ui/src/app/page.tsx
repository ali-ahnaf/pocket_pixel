"use client";

import { useState } from "react";
import { Button, Card, Window, Input, ProgressBar, Badge } from "@/components";

const COLORS = [
  { name: "primary", hex: "#a5d655", bg: "bg-primary", text: "text-on-primary" },
  { name: "secondary", hex: "#edbd9a", bg: "bg-secondary", text: "text-on-secondary" },
  { name: "tertiary", hex: "#acc7ff", bg: "bg-tertiary", text: "text-on-tertiary" },
  { name: "error", hex: "#ffb4ab", bg: "bg-error", text: "text-on-error" },
  { name: "surface", hex: "#141315", bg: "bg-surface border-4 border-outline", text: "text-on-surface" },
  { name: "surface-container", hex: "#201f22", bg: "bg-surface-container", text: "text-on-surface" },
  { name: "surface-container-high", hex: "#2a292c", bg: "bg-surface-container-high", text: "text-on-surface" },
  { name: "outline", hex: "#8d937f", bg: "bg-outline", text: "text-on-primary" },
];

export default function DesignSystemPage() {
  const [inputVal, setInputVal] = useState("");

  return (
    <main className="min-h-screen bg-background p-block-4 md:p-block-8">
      <div className="max-w-2xl mx-auto space-y-block-8">

        {/* Header */}
        <div className="card-elevated p-block-5">
          <p className="font-mono text-label-caps text-primary mb-1 uppercase tracking-widest">
            Design System v1.0
          </p>
          <h1 className="font-anybody font-extrabold text-headline-lg text-on-surface leading-none">
            Block &amp; Pixel
          </h1>
          <p className="font-inter text-body-sm text-on-surface-variant mt-2">
            A retro-tactile UI system built on voxel aesthetics and modern mobile interaction.
          </p>
        </div>

        {/* Typography */}
        <section>
          <SectionLabel>Typography</SectionLabel>
          <Card className="space-y-block-5">
            <div>
              <p className="pixel-input-label mb-1">headline-lg / Anybody 800</p>
              <h1 className="font-anybody font-extrabold text-headline-lg text-on-surface">
                Mine Your Expenses
              </h1>
            </div>
            <hr className="pixel-divider" />
            <div>
              <p className="pixel-input-label mb-1">headline-md / Anybody 700</p>
              <h2 className="font-anybody font-bold text-headline-md text-on-surface">
                Inventory Overview
              </h2>
            </div>
            <hr className="pixel-divider" />
            <div>
              <p className="pixel-input-label mb-1">body-lg / Inter 400</p>
              <p className="font-inter text-body-lg text-on-surface">
                Track every coin you spend in the overworld. Build your financial empire block by
                block.
              </p>
            </div>
            <hr className="pixel-divider" />
            <div>
              <p className="pixel-input-label mb-1">body-sm / Inter 400</p>
              <p className="font-inter text-body-sm text-on-surface-variant">
                Last synced: 12 blocks ago. All transactions verified by the server.
              </p>
            </div>
            <hr className="pixel-divider" />
            <div>
              <p className="pixel-input-label mb-1">label-caps / JetBrains Mono 700</p>
              <p className="font-mono text-label-caps text-on-surface-variant uppercase tracking-widest">
                CATEGORY · FOOD &amp; DRINK · 42 ITEMS
              </p>
            </div>
          </Card>
        </section>

        {/* Colors */}
        <section>
          <SectionLabel>Color Palette</SectionLabel>
          <div className="grid grid-cols-4 gap-[4px]">
            {COLORS.map((c) => (
              <div key={c.name} className={`${c.bg} border-4 border-black p-3`}>
                <p className={`font-mono text-label-caps uppercase ${c.text} leading-tight`}>
                  {c.name}
                </p>
                <p className={`font-mono text-label-caps ${c.text} opacity-60`}>{c.hex}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Buttons */}
        <section>
          <SectionLabel>Buttons</SectionLabel>
          <Card>
            <p className="pixel-input-label mb-block-3">Variants</p>
            <div className="flex flex-wrap gap-3">
              <Button variant="primary">Craft Item</Button>
              <Button variant="secondary">Trade</Button>
              <Button variant="tertiary">Info</Button>
              <Button variant="ghost">Cancel</Button>
              <Button variant="danger">Destroy</Button>
            </div>

            <hr className="pixel-divider my-block-5" />

            <p className="pixel-input-label mb-block-3">Sizes</p>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
            </div>

            <hr className="pixel-divider my-block-5" />

            <p className="pixel-input-label mb-block-3">Disabled</p>
            <div className="flex flex-wrap gap-3">
              <Button variant="primary" disabled>
                Crafting…
              </Button>
              <Button variant="danger" disabled>
                No Access
              </Button>
            </div>
          </Card>
        </section>

        {/* Cards */}
        <section>
          <SectionLabel>Cards</SectionLabel>
          <div className="space-y-3">
            <Card title="Stone Block — Default Card">
              <p className="font-inter text-body-sm text-on-surface-variant">
                Standard container with stone-gray background and beveled edges.
              </p>
            </Card>
            <Card elevated title="Wooden Block — Elevated Card">
              <p className="font-inter text-body-sm text-on-surface-variant">
                High-priority container with dirt-brown border and drop shadow.
              </p>
            </Card>
            <Window title="Inventory Window">
              <p className="font-inter text-body-sm text-on-surface-variant">
                A modal-style window with a distinct header bar. Used for dialogs and overlays.
              </p>
            </Window>
          </div>
        </section>

        {/* Inputs */}
        <section>
          <SectionLabel>Inputs</SectionLabel>
          <Card className="space-y-block-5">
            <Input
              label="Item Name"
              placeholder="Diamond Sword"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
            />
            <Input label="Amount" type="number" placeholder="0" defaultValue="64" />
            <Input label="Category" placeholder="Equipment" />
            <Input
              label="Broken Field"
              placeholder="Try again"
              error="Invalid crafting recipe"
              defaultValue="???"
            />
          </Card>
        </section>

        {/* Progress Bars */}
        <section>
          <SectionLabel>Progress Bars</SectionLabel>
          <Card className="space-y-block-5">
            <ProgressBar label="Health" value={75} max={100} variant="primary" showValue />
            <ProgressBar label="Hunger" value={5} max={20} variant="secondary" showValue />
            <ProgressBar label="XP" value={340} max={500} variant="tertiary" showValue />
            <ProgressBar label="Durability" value={3} max={20} variant="error" showValue />
            <ProgressBar value={0} label="Oxygen" max={100} />
          </Card>
        </section>

        {/* Badges */}
        <section>
          <SectionLabel>Badges</SectionLabel>
          <Card>
            <div className="flex flex-wrap gap-2">
              <Badge variant="primary">Grass</Badge>
              <Badge variant="secondary">Dirt</Badge>
              <Badge variant="tertiary">Sky</Badge>
              <Badge variant="error">Danger</Badge>
              <Badge variant="outline">Neutral</Badge>
            </div>
          </Card>
        </section>

        {/* Elevation Showcase */}
        <section>
          <SectionLabel>Elevation &amp; Depth</SectionLabel>
          <div className="grid grid-cols-2 gap-block-3">
            {(
              [
                ["surface-container-lowest", "Bedrock"],
                ["surface-container-low", "Stone"],
                ["surface-container", "Deepslate"],
                ["surface-container-high", "Cobblestone"],
                ["surface-container-highest", "Gravel"],
                ["surface-bright", "Sand"],
              ] as const
            ).map(([token, name]) => (
              <div
                key={token}
                className={`bg-${token} border-4 border-black p-block-3`}
                style={{ boxShadow: "inset 2px 2px 0 rgba(255,255,255,0.08), inset -2px -2px 0 rgba(0,0,0,0.5)" }}
              >
                <p className="font-mono text-label-caps text-on-surface-variant uppercase">{name}</p>
                <p className="font-mono text-label-caps text-outline">{token}</p>
              </div>
            ))}
          </div>
        </section>

        <footer className="text-center py-block-5">
          <p className="font-mono text-label-caps text-outline uppercase">
            Block &amp; Pixel Design System · Built with Tailwind CSS
          </p>
        </footer>
      </div>
    </main>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-label-caps text-primary uppercase tracking-widest mb-block-3">
      // {children}
    </p>
  );
}
