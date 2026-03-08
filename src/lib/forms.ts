export function readString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

export function readOptionalNumber(formData: FormData, key: string) {
  const value = readString(formData, key);

  if (!value) {
    return undefined;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : undefined;
}

export function readRequiredNumber(formData: FormData, key: string) {
  const value = readString(formData, key);
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : NaN;
}

export function readCheckbox(formData: FormData, key: string) {
  return formData.get(key) === "on";
}
