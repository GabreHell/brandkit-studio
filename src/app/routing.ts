export const screens = [
  "Overview",
  "Brand assets",
  "Colors",
  "Typography",
  "Guidelines",
  "Export",
] as const;
export type Screen = (typeof screens)[number] | "Projects";
export type Route =
  | { kind: "projects" }
  | { kind: "new" }
  | { kind: "project"; id: string; screen: Exclude<Screen, "Projects"> }
  | { kind: "missing" };
export function readRoute(hash = window.location.hash): Route {
  if (!hash || hash === "#/" || hash === "#/projects")
    return { kind: "projects" };
  if (hash === "#/new") return { kind: "new" };
  const match = /^#\/project\/([^/]+)\/([^/]+)$/.exec(hash);
  if (!match) return { kind: "missing" };
  try {
    const screen = decodeURIComponent(match[2]);
    if (screens.includes(screen as (typeof screens)[number]))
      return {
        kind: "project",
        id: decodeURIComponent(match[1]),
        screen: screen as (typeof screens)[number],
      };
  } catch {
    /* Malformed URL; display the recoverable not-found screen. */
  }
  return { kind: "missing" };
}
export function routeHash(route: Route): string {
  if (route.kind === "new") return "#/new";
  if (route.kind === "project")
    return `#/project/${encodeURIComponent(route.id)}/${encodeURIComponent(route.screen)}`;
  return "#/projects";
}
