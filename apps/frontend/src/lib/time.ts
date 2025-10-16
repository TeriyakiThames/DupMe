// lib/time.ts
export function classNames(...s: Array<string | false | undefined>) {
  return s.filter(Boolean).join(" ");
}
