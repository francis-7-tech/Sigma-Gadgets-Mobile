export function formatNaira(kobo: number): string {
  if (!Number.isInteger(kobo)) throw new Error(`Expected whole kobo, got ${kobo}`);
  const sign = kobo < 0 ? "-" : "";
  const absolute = Math.abs(kobo);
  const naira = Math.floor(absolute / 100).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const remainder = absolute % 100;
  return `${sign}₦${naira}${remainder ? `.${remainder.toString().padStart(2, "0")}` : ""}`;
}
