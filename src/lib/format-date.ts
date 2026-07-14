export function formatMalaysiaDateTime(value: string | Date) {
  return new Date(value).toLocaleString("ms-MY", {
    timeZone: "Asia/Kuala_Lumpur",
  });
}
