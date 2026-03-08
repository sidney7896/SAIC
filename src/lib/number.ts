export function roundToNearestPlate(value: number, increment = 2.5) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.round(value / increment) * increment;
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function percentChange(oldValue: number, newValue: number) {
  if (!Number.isFinite(oldValue) || oldValue === 0 || !Number.isFinite(newValue)) {
    return 0;
  }

  return ((newValue - oldValue) / oldValue) * 100;
}

export function parseFirstNumber(input: string | undefined) {
  if (!input) {
    return null;
  }

  const match = input.match(/-?\d+(?:\.\d+)?/);

  return match ? Number(match[0]) : null;
}
