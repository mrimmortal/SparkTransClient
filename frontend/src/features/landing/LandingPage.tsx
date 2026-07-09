import {
  Activity,
  ArrowRight,
  CheckCircle2,
  FileText,
  HeartPulse,
  Mic,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Wand2,
} from "lucide-react";
import { getWorkspaceBrand } from "../workspace/workspaceBrand";

type LandingPageProps = {
  onSignIn: () => void;
};

const featureCards = [
  {
    icon: FileText,
    title: "Smart clinical editor",
    copy: "Draft, review, format, search, save, manage, and export clinical notes from one focused workspace.",
  },
  {
    icon: Mic,
    title: "CoreSTT-powered dictation",
    copy: "Connect to your CoreSTT service for realtime preview and final transcript insertion into the active document.",
  },
  {
    icon: Wand2,
    title: "Voice commands and macros",
    copy: "Control formatting, navigation, template fields, repeated phrases, save actions, and cleanup with spoken commands.",
  },
  {
    icon: Stethoscope,
    title: "Clinical profiles",
    copy: "Manage prompts and hotwords through domain profiles so future sessions can bias toward the right terminology.",
  },
];

const workflowSteps = [
  "Open or create a document",
  "Start dictation from the floating control",
  "Use templates, macros, and commands",
  "Review, save, manage, and export",
];

const trustPoints = [
  "Authenticated document workspace",
  "FastAPI proxy for CoreSTT traffic",
  "Docker and terminal deployment paths",
  "Diagnostics for service and microphone status",
];

export function LandingPage({ onSignIn }: LandingPageProps) {
  const brand = getWorkspaceBrand();

  return (
    <main className="landing-page theme-neo-cool">
      <header className="landing-nav">
        <div className="brand-lockup landing-brand" aria-label={brand.ariaLabel}>
          <span className="brand-mark" aria-hidden="true">
            <span>{brand.mark}</span>
            <span className="brand-mark-lines">
              <span />
              <span />
              <span />
            </span>
          </span>
          <span className="brand-copy">
            <strong>{brand.name}</strong>
            <small>{brand.subtitle}</small>
          </span>
        </div>
        <nav className="landing-nav-links" aria-label="Landing page">
          <a href="#features">Features</a>
          <a href="#workflow">Workflow</a>
          <a href="#deployment">Deployment</a>
        </nav>
        <button type="button" className="primary" onClick={onSignIn}>
          Sign in <ArrowRight size={16} />
        </button>
      </header>

      <section className="landing-hero">
        <div className="landing-hero-copy">
          <span className="landing-eyebrow"><HeartPulse size={16} /> Clinical dictation workspace</span>
          <h1>Turn clinical speech into structured documents faster.</h1>
          <p>
            Next Line Spark brings dictation, Smart Editor controls, templates, macros, document management, and PDF export
            into one focused workspace for clinical teams.
          </p>
          <div className="landing-hero-actions">
            <button type="button" className="primary" onClick={onSignIn}>
              Try Next Line Spark <ArrowRight size={16} />
            </button>
            <a className="landing-secondary-link" href="#workflow">View workflow</a>
          </div>
          <div className="landing-proof-strip" aria-label="Product highlights">
            <span><CheckCircle2 size={15} /> Smart Editor</span>
            <span><CheckCircle2 size={15} /> Templates</span>
            <span><CheckCircle2 size={15} /> CoreSTT proxy</span>
          </div>
        </div>

        <div className="landing-product-visual" aria-label="Next Line Spark workspace preview">
          <div className="landing-visual-toolbar">
            <span className="landing-status-pill"><span /> CoreSTT ready</span>
            <span>Smart</span>
            <span>Medical</span>
          </div>
          <div className="landing-visual-editor">
            <div>
              <strong>Clinical note</strong>
              <small>Saved · Updated now</small>
            </div>
            <p>Chest is clear. No pleural or pericardial effusion.</p>
            <p><strong>Plan:</strong> Continue current medication and review results at follow-up.</p>
            <span className="landing-realtime-line">Realtime: patient reports improved breathing...</span>
          </div>
          <div className="landing-visual-rail">
            <span><Activity size={16} /> Dictation Status</span>
            <span><Sparkles size={16} /> Quick Actions</span>
            <span><ShieldCheck size={16} /> Safety prompts</span>
          </div>
        </div>
      </section>

      <section className="landing-section landing-problem">
        <div>
          <span className="landing-section-kicker">Documentation burden</span>
          <h2>Clinical documentation should not slow down the work.</h2>
        </div>
        <p>
          Notes, reports, summaries, and follow-ups need to be accurate, structured, and available quickly. Next Line Spark
          keeps dictation, editing, reusable templates, common phrases, and export controls in one practical workspace.
        </p>
      </section>

      <section className="landing-section" id="features">
        <div className="landing-section-heading">
          <span className="landing-section-kicker">Product capability</span>
          <h2>One workspace for dictation and document completion.</h2>
        </div>
        <div className="landing-feature-grid">
          {featureCards.map((feature) => {
            const Icon = feature.icon;
            return (
              <article className="landing-card" key={feature.title}>
                <span className="landing-card-icon"><Icon size={20} /></span>
                <h3>{feature.title}</h3>
                <p>{feature.copy}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="landing-section landing-workflow" id="workflow">
        <div className="landing-section-heading">
          <span className="landing-section-kicker">Workflow</span>
          <h2>From spoken note to finished document.</h2>
        </div>
        <div className="landing-workflow-list">
          {workflowSteps.map((step, index) => (
            <article key={step}>
              <span>{index + 1}</span>
              <p>{step}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section landing-trust" id="deployment">
        <div>
          <span className="landing-section-kicker">Deployment and control</span>
          <h2>Built for controlled clinical workflows.</h2>
          <p>
            The app includes authenticated access, document ownership checks, local and Docker deployment paths, and a
            FastAPI proxy for CoreSTT traffic. Production teams should still complete their own hardening and compliance review.
          </p>
        </div>
        <div className="landing-trust-list">
          {trustPoints.map((point) => (
            <span key={point}><ShieldCheck size={16} /> {point}</span>
          ))}
        </div>
      </section>

      <section className="landing-section landing-final-cta">
        <span className="landing-section-kicker">Next Line Spark</span>
        <h2>Bring dictation, editing, templates, and document management into one clinical workspace.</h2>
        <button type="button" className="primary" onClick={onSignIn}>
          Open the workspace <ArrowRight size={16} />
        </button>
      </section>
    </main>
  );
}
