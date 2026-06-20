import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Loader2 } from "lucide-react";
import { usePlaceAutocomplete, type PlaceSuggestion } from "@/hooks/use-location";

type Props = {
  label?: string;
  placeholder?: string;
  defaultValue?: string;
  onSelect: (s: PlaceSuggestion) => void;
};

export function LocationAutocomplete({ label, placeholder, defaultValue, onSelect }: Props) {
  const [q, setQ] = useState(defaultValue ?? "");
  const [open, setOpen] = useState(false);
  const { suggestions, loading, search, clear } = usePlaceAutocomplete();

  useEffect(() => { search(q); }, [q, search]);

  return (
    <div className="relative space-y-1.5">
      {label && <Label>{label}</Label>}
      <div className="relative">
        <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={placeholder ?? "Search address or area"}
          className="h-11 rounded-xl pl-9"
        />
        {loading && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
      </div>
      {open && suggestions.length > 0 && (
        <ul className="absolute z-30 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-border bg-card shadow-[var(--shadow-card-hover)]">
          {suggestions.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onSelect(s);
                  setQ(s.label);
                  setOpen(false);
                  clear();
                }}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-accent"
              >
                <p className="truncate font-medium">{s.label}</p>
                <p className="truncate text-xs text-muted-foreground">{s.address}</p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
