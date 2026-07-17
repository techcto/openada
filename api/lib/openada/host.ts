export function comparableHostname(value: string): string {
  return value.trim().toLowerCase().replace(/^www\./, '')
}

export function hostnamesMatch(left: string, right: string): boolean {
  return comparableHostname(left) === comparableHostname(right)
}
