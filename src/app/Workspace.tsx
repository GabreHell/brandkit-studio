import { useEffect, useRef, useState, type ReactNode } from "react";
import type { BrandProject } from "../types/brand";
import type { Screen } from "./routing";
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronRight,
  Columns2,
  Folder,
  Grid2X2,
  Image,
  Layers,
  Leaf,
  Menu,
  Palette,
  PanelRight,
  Type,
  X,
} from "lucide-react";
import { BrandPreview, type PreviewMode } from "../components/BrandPreview";

const navigation = [
  { label: "Overview", icon: Grid2X2 },
  { label: "Brand assets", icon: Image },
  { label: "Colors", icon: Palette },
  { label: "Typography", icon: Type },
  { label: "Guidelines", icon: BookOpen },
  { label: "Export", icon: ArrowDownToLine },
] as const;
const stages: Record<Screen, string> = {
  Overview: "1",
  Projects: "2",
  "Brand assets": "3",
  Colors: "4",
  Typography: "4",
  Guidelines: "5",
  Export: "6",
};

export function Workspace({
  project,
  screen,
  onNavigate,
  children,
}: {
  project: BrandProject | null;
  screen: Screen;
  onNavigate: (screen: Screen) => void;
  children?: ReactNode;
}) {
  const [mode, setMode] = useState<PreviewMode>("Cover");
  const [menuOpen, setMenuOpen] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);
  const menuTrigger = useRef<HTMLButtonElement>(null);
  const projectId = project?.id;
  const projectName = project?.name;
  const previousView = useRef(`${projectId}-${screen}`);
  useEffect(() => {
    document.title = `${screen}${projectName ? ` · ${projectName}` : ""} | BrandKit Studio`;
    const view = `${projectId}-${screen}`;
    if (previousView.current !== view)
      document.getElementById("workspace")?.focus();
    previousView.current = view;
  }, [projectId, projectName, screen]);
  useEffect(() => {
    if (!menuOpen) return;
    const sidebar = sidebarRef.current;
    const trigger = menuTrigger.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const controls = () =>
      Array.from(
        sidebar?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") ??
          [],
      );
    controls()[0]?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setMenuOpen(false);
      }
      if (event.key === "Tab") {
        const buttons = controls();
        const first = buttons[0];
        const last = buttons.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    const resize = () => {
      if (window.innerWidth > 600) setMenuOpen(false);
    };
    document.addEventListener("keydown", keydown);
    window.addEventListener("resize", resize);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", keydown);
      window.removeEventListener("resize", resize);
      trigger?.focus();
    };
  }, [menuOpen]);
  const isDemo = project?.id === "demo-forma";
  const navigate = (next: Screen) => {
    onNavigate(next);
    setMenuOpen(false);
  };
  return (
    <div className="app-shell">
      <a
        href="#workspace"
        className="skip-link"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById("workspace")?.focus();
        }}
      >
        Skip to workspace
      </a>
      <aside
        ref={sidebarRef}
        id="project-navigation"
        className={`sidebar ${menuOpen ? "is-open" : ""}`}
        aria-label="Project navigation"
      >
        <button
          className="mobile-menu close-menu"
          onClick={() => setMenuOpen(false)}
          aria-label="Close menu"
        >
          <X size={20} />
          <span>Close</span>
        </button>
        <button className="app-logo" onClick={() => navigate("Projects")}>
          <span className="logo-icon">
            <Columns2 size={20} />
          </span>
          BrandKit <span>Studio</span>
        </button>
        <button className="all-projects" onClick={() => navigate("Projects")}>
          <ArrowLeft size={15} /> All projects
        </button>
        <div className="project-switch">
          <span className="project-avatar">
            <Leaf size={21} />
          </span>
          <div>
            <strong>{project?.name ?? "Your projects"}</strong>
            <small>
              {isDemo ? "Sample brand project" : "Stored on this browser"}
            </small>
          </div>
        </div>
        <p className="nav-caption">Workspace</p>
        <nav>
          {navigation.map(({ label, icon: Icon }) => (
            <button
              key={label}
              aria-current={screen === label ? "page" : undefined}
              disabled={!project}
              onClick={() => navigate(label)}
            >
              <Icon size={18} />
              {label}
              {screen === label && <span className="active-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="foundation-label">
            <span /> Local workspace
          </div>
          <p>
            A space for your brand.
            <br />
            Built around your decisions.
          </p>
          <div className="profile">
            <span>DS</span>
            <div>
              <strong>Designer workspace</strong>
              <small>Local development</small>
            </div>
          </div>
        </div>
      </aside>
      {menuOpen && (
        <button
          className="menu-backdrop"
          tabIndex={-1}
          aria-label="Close navigation"
          onClick={() => setMenuOpen(false)}
        />
      )}
      <div className="app-body" inert={menuOpen}>
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="mobile-menu icon-button"
              ref={menuTrigger}
              aria-controls="project-navigation"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <span>Projects</span>
            <ChevronRight size={14} />
            <strong>{project?.name ?? "Your projects"}</strong>
            <ChevronRight size={14} />
            <span>{screen}</span>
          </div>
          <span className="sample-badge">
            {isDemo ? "Sample project" : "Local projects"}
          </span>
        </header>
        <div className="workspace-layout">
          <main id="workspace" tabIndex={-1}>
            <div className="page-heading">
              <div>
                <p className="section-kicker">Your brand, at a glance</p>
                <h1>{screen === "Overview" ? "Brand overview" : screen}</h1>
              </div>
              <span className="version">v0.7</span>
            </div>
            <p className="page-description">
              {screen === "Overview"
                ? "One home for the elements that make your brand, yours."
                : `Explore the ${screen.toLowerCase()} workspace for your brand.`}
            </p>
            {children ??
              (project &&
                (screen === "Overview" ? (
                  <>
                    <section
                      className="identity-card"
                      aria-label="Sample brand identity"
                    >
                      <div className="identity-top">
                        <span>
                          <Leaf size={15} /> Botanical skincare
                        </span>
                        <span>Demo identity</span>
                      </div>
                      <div className="identity-wordmark">
                        forma<span>®</span>
                      </div>
                      <div className="identity-bottom">
                        <p>
                          Everyday rituals,
                          <br />
                          rooted in nature.
                        </p>
                        <span>Considered. Essential. Natural.</span>
                      </div>
                    </section>
                    <div className="section-heading">
                      <h2>Brand essentials</h2>
                      <span>A consistent starting point</span>
                    </div>
                    <div className="essential-grid">
                      <button
                        className="essential-card"
                        onClick={() => navigate("Brand assets")}
                      >
                        <div className="card-label">
                          <span>
                            <Image size={17} /> Brand assets
                          </span>
                          <ArrowUpRight size={16} />
                        </div>
                        <div className="logo-samples">
                          <span>forma</span>
                          <span>
                            <Leaf size={34} />
                          </span>
                        </div>
                        <div className="card-foot">
                          <strong>Logo system</strong>
                          <span>Illustrative placeholders</span>
                        </div>
                      </button>
                      <button
                        className="essential-card"
                        onClick={() => navigate("Colors")}
                      >
                        <div className="card-label">
                          <span>
                            <Palette size={17} /> Color palette
                          </span>
                          <ArrowUpRight size={16} />
                        </div>
                        <div className="swatches">
                          {project.colors.map((color) => (
                            <span
                              key={color.id}
                              style={{ background: color.hex }}
                              title={`${color.name}: ${color.hex}`}
                            />
                          ))}
                        </div>
                        <div className="card-foot">
                          <strong>Natural by design</strong>
                          <span>4 sample colors</span>
                        </div>
                      </button>
                    </div>
                    <button
                      className="typography-card"
                      onClick={() => navigate("Typography")}
                    >
                      <div>
                        <div className="card-label">
                          <span>
                            <Type size={17} /> Typography
                          </span>
                        </div>
                        <div className="type-pair">
                          <span>Aa</span>
                          <span>Aa</span>
                        </div>
                      </div>
                      <div className="type-details">
                        <strong>
                          Georgia <span>+ Arial</span>
                        </strong>
                        <p>Expressive headings. Effortless reading.</p>
                        <small>System font pairing</small>
                      </div>
                      <ArrowUpRight size={17} />
                    </button>
                    <div className="guidelines-link">
                      <span className="book-icon">
                        <BookOpen size={22} />
                      </span>
                      <div>
                        <h3>A clear story for your brand.</h3>
                        <p>
                          Your assets and decisions, brought together in
                          guidelines.
                        </p>
                      </div>
                      <button
                        onClick={() => navigate("Guidelines")}
                        aria-label="View guidelines workspace"
                      >
                        <ChevronRight size={21} />
                      </button>
                    </div>
                  </>
                ) : (
                  <section className="feature-panel">
                    {screen === "Projects" && (
                      <button
                        className="project-tile"
                        onClick={() => navigate("Overview")}
                      >
                        <Leaf size={32} />
                        <strong>{project?.name ?? "Your projects"}</strong>
                        <span>Sample project</span>
                        <ChevronRight size={18} />
                      </button>
                    )}
                    {screen === "Colors" && (
                      <div className="color-list">
                        {project.colors.map((color) => (
                          <div key={color.id}>
                            <span style={{ background: color.hex }} />
                            <strong>{color.name}</strong>
                            <code>{color.hex}</code>
                            <small>{color.role}</small>
                          </div>
                        ))}
                      </div>
                    )}
                    {screen === "Typography" && (
                      <div className="type-specimen">
                        <span>Aa Bb Cc</span>
                        <h2>Everyday rituals, rooted in nature.</h2>
                        <p>Georgia / Headings / 48px</p>
                        <hr />
                        <p>Thoughtful essentials. Naturally made.</p>
                        <small>Arial / Body / 16px / Line height 1.6</small>
                      </div>
                    )}
                    {screen === "Brand assets" && (
                      <div className="asset-placeholder">
                        <Leaf size={52} />
                        <h2>Space for your existing identity</h2>
                        <p>
                          Primary logos, variations, and supporting graphics
                          will live here.
                        </p>
                        <small>
                          No uploaded assets. Overview logos are illustrative
                          placeholders.
                        </small>
                      </div>
                    )}
                    {screen === "Guidelines" && (
                      <>
                        <h2>Your brand, documented</h2>
                        <ol className="guideline-outline">
                          {[
                            "Brand cover",
                            "Logo presentation & variations",
                            "Color palette",
                            "Typography system",
                            "Brand applications",
                            "Designer-defined usage notes",
                          ].map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ol>
                      </>
                    )}
                    {screen === "Export" && (
                      <>
                        <h2>Ready for a considered handoff</h2>
                        <p>
                          Planned formats: brand guidelines PDF, color values,
                          and JSON design tokens.
                        </p>
                      </>
                    )}
                    <div className="phase-note">
                      <Layers size={18} />
                      <div>
                        <strong>Coming in Phase {stages[screen]}</strong>
                        <p>
                          This is a read-only foundation preview.{" "}
                          {screen === "Projects"
                            ? "Project creation and local saving"
                            : screen === "Export"
                              ? "File generation"
                              : "Editing and management"}{" "}
                          will be added in this milestone.
                        </p>
                      </div>
                    </div>
                  </section>
                )))}
            <footer className="workspace-footer">
              <Check size={14} />{" "}
              {isDemo
                ? "Sample content only. This demo is read-only."
                : "Stored in this browser only. Clearing site data removes your projects. This is not a backup."}
            </footer>
          </main>
          <aside className="preview-panel" aria-label="Brand preview">
            {project ? (
              <>
                <div className="preview-heading">
                  <span>
                    <PanelRight size={17} /> Brand preview
                  </span>
                  <span className="live-label">
                    {isDemo ? "Demo" : "Live preview"}
                  </span>
                </div>
                <p>A little context goes a long way.</p>
                <label htmlFor="preview-mode">Application</label>
                <select
                  id="preview-mode"
                  value={mode}
                  onChange={(event) =>
                    setMode(event.target.value as PreviewMode)
                  }
                >
                  {(
                    [
                      "Cover",
                      "Business card",
                      "Social post",
                      "Website",
                    ] as PreviewMode[]
                  ).map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
                <div className="preview-canvas">
                  <BrandPreview project={project} mode={mode} />
                </div>
                <div className="preview-caption">
                  <span>
                    {mode === "Cover" ? "Brand presentation cover" : mode}
                  </span>
                  <span>{isDemo ? "Sample" : "Scaled 55%"}</span>
                </div>
                <div className="preview-note">
                  <Grid2X2 size={17} />
                  <p>
                    Your identity, in context.
                    <br />
                    <span>Application examples follow your brand system.</span>
                  </p>
                </div>
                <div className="palette-summary">
                  <h3>Behind the preview</h3>
                  <div>
                    {project.colors.map((color) => (
                      <span
                        key={color.id}
                        style={{ background: color.hex }}
                        title={color.name}
                      />
                    ))}
                    <small>
                      {project.colors.length
                        ? `${project.name} palette`
                        : "Neutral preview defaults"}
                    </small>
                  </div>
                  <p>
                    {project.typography.heading.family} &amp;{" "}
                    {project.typography.body.family}
                  </p>
                </div>
                <div className="preview-bottom">
                  <Folder size={15} />
                  <span>Your creative decisions come first.</span>
                </div>
              </>
            ) : (
              <>
                <div className="preview-heading">Brand preview</div>
                <div className="empty-preview">
                  <Image size={32} />
                  <h2>Your identity, in context</h2>
                  <p>Open a project to see its brand workspace.</p>
                </div>
              </>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
