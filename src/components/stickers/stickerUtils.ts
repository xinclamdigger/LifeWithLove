/** Convert client coordinates to basis-point percentages (0-10000) relative to a container element. */
export function clientToPercent(
  container: HTMLElement,
  clientX: number,
  clientY: number
): { xPercent: number; yPercent: number } {
  const rect = container.getBoundingClientRect();
  const xPct = ((clientX - rect.left) / rect.width) * 100;
  const yPct = ((clientY - rect.top) / rect.height) * 100;
  return {
    xPercent: Math.round(Math.max(0, Math.min(10000, xPct * 100))),
    yPercent: Math.round(Math.max(0, Math.min(10000, yPct * 100))),
  };
}
