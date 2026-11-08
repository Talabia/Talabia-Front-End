/**
 * Converts Arabic-Indic (٠-٩) and Extended Arabic-Indic / Persian (۰-۹) digits to ASCII 0-9,
 * so numbers typed on an Arabic keyboard are accepted like Latin digits.
 */
export function toAsciiDigits(value: string): string {
  return value
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
}

/** Keeps only the digits of `value` (after normalising Arabic digits). */
export function digitsOnly(value: string): string {
  return toAsciiDigits(value).replace(/[^0-9]/g, '');
}

/** True when a keydown would insert a single character that is not a digit (letters, symbols, space). */
export function isNonDigitCharacterKey(event: KeyboardEvent): boolean {
  if (event.ctrlKey || event.metaKey || event.altKey) {
    return false; // copy/paste/select-all shortcuts
  }
  return event.key.length === 1 && !/^[0-9]$/.test(toAsciiDigits(event.key));
}
