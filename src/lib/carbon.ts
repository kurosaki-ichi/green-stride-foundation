// Emission factors in kg CO2 per km (rough industry averages)
export const EMISSION_FACTORS = {
  walk: 0,
  cycle: 0,
  bike: 0.103,
  bus: 0.089,
  metro: 0.041,
  car: 0.192,
  ev: 0.053,
  auto: 0.108,
} as const;

export type TransportMode = keyof typeof EMISSION_FACTORS;

// Baseline = average car. Saved = (baseline - actual) * distance, capped at >=0.
const BASELINE = EMISSION_FACTORS.car;

export function calcCo2(mode: TransportMode, distanceKm: number) {
  const factor = EMISSION_FACTORS[mode] ?? 0;
  const generated = +(factor * distanceKm).toFixed(3);
  const saved = +Math.max(0, (BASELINE - factor) * distanceKm).toFixed(3);
  return { generated, saved };
}

export const TRANSPORT_LABELS: Record<TransportMode, string> = {
  walk: "Walking",
  cycle: "Cycling",
  bike: "Bike",
  bus: "Bus",
  metro: "Metro",
  car: "Car",
  ev: "EV",
  auto: "Auto Rickshaw",
};
