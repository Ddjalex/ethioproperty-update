import { useState } from "react";
import { Search, MapPin, Home, Building2, Sparkles } from "lucide-react";

// Brand tokens pulled from Ethio Property's live production build:
// --primary: hsl(222 47% 11%)  -> dark navy
// --color-accent: rgb(144 130 75) -> muted gold
const NAVY = "hsl(222, 47%, 11%)";
const NAVY_SOFT = "hsl(222, 40%, 16%)";
const GOLD = "rgb(144, 130, 75)";

function SegToggle({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div
      className="inline-flex rounded-full p-1 bg-slate-100"
      role="tablist"
    >
      {options.map((opt) => {
        const active = opt === value;
        return (
          <button
            key={opt}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt)}
            className="px-5 py-2 text-sm font-semibold rounded-full transition-colors"
            style={{
              backgroundColor: active ? NAVY : "transparent",
              color: active ? "white" : "#475569",
            }}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function SmartSearchToggle({ on, setOn }: { on: boolean; setOn: (v: boolean) => void }) {
  return (
    <button
      onClick={() => setOn(!on)}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-colors"
      style={{
        borderColor: on ? GOLD : "#e2e8f0",
        backgroundColor: on ? "rgba(144,130,75,0.08)" : "white",
        color: on ? GOLD : "#64748b",
      }}
    >
      <Sparkles className="w-4 h-4" />
      Smart Search
      <span
        className="ml-1 w-8 h-4 rounded-full relative transition-colors"
        style={{ backgroundColor: on ? GOLD : "#cbd5e1" }}
      >
        <span
          className="absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all"
          style={{ left: on ? "18px" : "2px" }}
        />
      </span>
    </button>
  );
}

function Dropdown({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <button className="flex items-center gap-2.5 w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-left hover:border-slate-300 transition-colors">
      <span style={{ color: GOLD }}>{icon}</span>
      <span className="flex flex-col leading-tight">
        <span className="text-[11px] uppercase tracking-wide text-slate-400 font-medium">
          {label}
        </span>
        <span className="text-sm font-medium text-slate-700">{value}</span>
      </span>
    </button>
  );
}

export function RedesignedSearch() {
  const [mode, setMode] = useState("Buy");
  const [smart, setSmart] = useState(true);

  return (
    <div className="min-h-screen w-full font-sans" style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
      {/* Nav (context only, matches current header) */}
      <div
        className="w-full flex items-center justify-between px-8 py-4"
        style={{ backgroundColor: NAVY }}
      >
        <div className="flex items-center gap-2 text-white font-bold text-lg">
          <div
            className="w-8 h-8 rounded-md flex items-center justify-center"
            style={{ backgroundColor: GOLD }}
          >
            <Home className="w-4 h-4 text-white" />
          </div>
          Ethio Property
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm text-slate-200">
          <span>Home</span>
          <span>Properties</span>
          <span>Favorites</span>
          <span>Blog</span>
          <span>Contact</span>
        </div>
        <button
          className="px-4 py-1.5 rounded-md text-sm font-semibold"
          style={{ backgroundColor: GOLD, color: "white" }}
        >
          Sign In
        </button>
      </div>

      {/* Hero */}
      <div className="relative">
        <div
          className="relative w-full flex flex-col items-center justify-center px-6 pt-20 pb-24 md:pt-28 md:pb-32"
          style={{
            backgroundImage: `linear-gradient(180deg, rgba(15,23,41,0.55), rgba(15,23,41,0.72)), url('/__mockup/images/hero-addis.jpg')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {/* Headline */}
          <div className="text-center max-w-2xl mb-10">
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">
              Find Your Perfect Property
            </h1>
            <p className="text-slate-200 text-base md:text-lg">
              Browse verified homes, apartments and land across Addis Ababa — curated
              by Ethio Property.
            </p>
          </div>

          {/* Search Card */}
          <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl p-5 md:p-7">
            {/* Row 1: toggles */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-5 border-b border-slate-100">
              <SegToggle options={["Buy", "Rent"]} value={mode} onChange={setMode} />
              <SmartSearchToggle on={smart} setOn={setSmart} />
            </div>

            {/* Row 2: dropdowns + search button */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-3 items-stretch">
              <Dropdown icon={<Building2 className="w-4 h-4" />} label="Property Category" value="Residential" />
              <Dropdown icon={<Home className="w-4 h-4" />} label="Property Type" value="Apartment" />
              <Dropdown icon={<MapPin className="w-4 h-4" />} label="Location" value="Bole, Addis Ababa" />
              <button
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-white shadow-md hover:opacity-95 transition-opacity md:min-w-[190px]"
                style={{ backgroundColor: GOLD }}
              >
                <Search className="w-4 h-4" />
                Search Properties
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Continuation of page for context */}
      <div className="px-8 py-16 text-center text-slate-400 text-sm">
        (Page continues below — property listings, featured section, etc.)
      </div>
    </div>
  );
}
