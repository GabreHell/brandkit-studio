import { expect, it } from "vitest";
import { readRoute, routeHash } from "./routing";
it("round-trips project sections and rejects invalid deep links", () => {
  const route = {
    kind: "project",
    id: "some-id",
    screen: "Brand assets",
  } as const;
  expect(readRoute(routeHash(route))).toEqual(route);
  expect(readRoute("#/project/id/Unknown")).toEqual({ kind: "missing" });
  expect(readRoute("#/project/%ZZ/Overview")).toEqual({ kind: "missing" });
  expect(readRoute("")).toEqual({ kind: "projects" });
});
