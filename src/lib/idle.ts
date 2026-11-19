/**
 * Espera o `load` da página e um momento ocioso. Usado para tudo que não pode
 * competir com o LCP: o chunk 3D e o chunk de coreografia.
 */
export function afterLoadAndIdle(cb: () => void, timeout = 2500): () => void {
  let cancelled = false;
  let idleId: number | undefined;
  const run = () => {
    if (cancelled) return;
    const ric =
      window.requestIdleCallback ??
      ((fn: () => void) => window.setTimeout(fn, 200) as unknown as number);
    idleId = ric(() => !cancelled && cb(), { timeout });
  };
  if (document.readyState === "complete") run();
  else addEventListener("load", run, { once: true });
  return () => {
    cancelled = true;
    removeEventListener("load", run);
    if (idleId !== undefined) (window.cancelIdleCallback ?? clearTimeout)(idleId);
  };
}
