export function normalize(string: string) {
  return typeof string === "string"
    ? string.trim().replace(/\s+/g, " ").toLowerCase()
    : string;
}
