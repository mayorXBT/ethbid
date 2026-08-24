/** Runtime env read. Dynamic key so Next cannot inline a missing build-time value. */
export function serverEnv(name: string): string {
  const value = process.env[name];
  return typeof value === "string" ? value.trim() : "";
}
