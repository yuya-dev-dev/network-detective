const previousKey = "networkDetectivePrevious";
const notify = () => window.dispatchEvent(new Event("hashchange"));

// Only entries created by the game can take the header button through history.
// This survives reloads and never relies on history.length or document.referrer.
export function navigateGame(target: string) {
  if (location.hash === target) return;
  history.pushState(
    { ...history.state, [previousKey]: location.hash || "#title" },
    "",
    target,
  );
  notify();
}

export function replaceGameRoute(target: string) {
  history.replaceState(history.state, "", target);
  notify();
}

export function previousGameRoute(): string | null {
  const previous: unknown = history.state?.[previousKey];
  return typeof previous === "string" && previous.startsWith("#")
    ? previous
    : null;
}

export function backGame(
  fallback: string,
  allowed: (previous: string) => boolean,
) {
  const previous = previousGameRoute();
  if (previous && allowed(previous)) {
    history.back();
  } else {
    history.replaceState(
      { ...history.state, [previousKey]: null },
      "",
      fallback,
    );
    notify();
  }
}
