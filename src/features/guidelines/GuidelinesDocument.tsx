import type { BrandProject } from "../../types/brand";
import { AssetImage } from "../assets/AssetImage";
import { BrandPreview } from "../../components/BrandPreview";
import { rgbValue } from "../brand-system/model";
export function GuidelinesDocument({ project }: { project: BrandProject }) {
  const primary = project.assets.find((asset) => asset.category === "primary");
  const variations = project.assets.filter((asset) => asset.id !== primary?.id);
  return (
    <article
      className="guidelines-document"
      aria-label="Brand guidelines document"
    >
      <header className="guidelines-cover">
        <p>Brand guidelines</p>
        <h2>{project.name}</h2>
        <p>{project.description || "Brand identity reference"}</p>
        <small>
          Working document · {new Date(project.updatedAt).toLocaleDateString()}
        </small>
      </header>
      <section>
        <h3>Introduction</h3>
        <p className="guideline-copy">
          {project.guidelines.introduction.trim() ||
            "No introduction provided. Add an introduction in the editor above."}
        </p>
      </section>
      <section>
        <h3>Primary logo</h3>
        {primary ? (
          <figure>
            <AssetImage key={primary.blobId} asset={primary} />
            <figcaption>{primary.name}</figcaption>
          </figure>
        ) : (
          <p className="guideline-empty">
            No primary logo selected. Upload a logo and assign the primary
            category in Brand assets.
          </p>
        )}
      </section>
      <section>
        <h3>Logo variations & supporting graphics</h3>
        {variations.length ? (
          <div className="guideline-assets">
            {variations.map((asset) => (
              <figure key={asset.id}>
                <AssetImage key={asset.blobId} asset={asset} />
                <figcaption>
                  {asset.name} — {asset.category}
                </figcaption>
              </figure>
            ))}
          </div>
        ) : (
          <p className="guideline-empty">No additional assets provided.</p>
        )}
      </section>
      <section>
        <h3>Logo usage</h3>
        <p className="guideline-copy">
          {project.guidelines.logoUsage.trim() ||
            "No usage rules provided by the designer."}
        </p>
      </section>
      <section>
        <h3>Color palette</h3>
        {project.colors.length ? (
          <div className="guideline-colors">
            {project.colors.map((color) => (
              <div key={color.id}>
                <span
                  className="guideline-swatch"
                  style={{ background: color.hex }}
                />
                <h4>{color.name}</h4>
                <p>{color.role}</p>
                <code>
                  {color.hex}
                  <br />
                  {rgbValue(color.hex)}
                </code>
              </div>
            ))}
          </div>
        ) : (
          <p className="guideline-empty">
            No brand colors defined. Add your palette in Colors.
          </p>
        )}
      </section>
      <section>
        <h3>Typography</h3>
        <p className="guideline-empty">
          Current project settings. Review these choices before client handoff;
          initial system-font defaults are not automatically approved brand
          rules.
        </p>
        {(["heading", "body"] as const).map((key) => {
          const style = project.typography[key];
          return (
            <div className="guideline-type" key={key}>
              <h4>{key === "heading" ? "Headings" : "Body text"}</h4>
              <p
                style={{
                  fontFamily: style.family,
                  fontSize: style.size,
                  fontWeight: style.weight,
                  lineHeight: style.lineHeight,
                }}
              >
                {key === "heading"
                  ? project.name
                  : project.description ||
                    "A clear and readable voice for your brand."}
              </p>
              <small>
                {style.family} · {style.size}px · Weight {style.weight} · Line
                height {style.lineHeight}
              </small>
            </div>
          );
        })}
      </section>
      <section>
        <h3>Brand applications</h3>
        <p className="guideline-empty">
          Illustrative layouts using the current project. Missing color roles
          use neutral preview defaults; these are not prescribed layouts.
        </p>
        <div className="guideline-applications">
          {(["Cover", "Business card", "Social post", "Website"] as const).map(
            (mode) => (
              <figure key={mode}>
                <BrandPreview project={project} mode={mode} />
                <figcaption>{mode} · typography scaled to 55%</figcaption>
              </figure>
            ),
          )}
        </div>
      </section>
      <section>
        <h3>Application notes</h3>
        <p className="guideline-copy">
          {project.guidelines.applicationNotes.trim() ||
            "No application notes provided by the designer."}
        </p>
      </section>
    </article>
  );
}
