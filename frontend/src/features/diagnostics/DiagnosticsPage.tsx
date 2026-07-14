import { useEffect, useState } from "react";
import { Activity, HeartPulse } from "lucide-react";
import { PageHeader } from "../../components/PageHeader";
import { HealthStatus, PublicConfig, VersionInfo, api } from "../../lib/api";
import { filterAudioInputDevices, getSelectedMicrophoneLabel } from "../../lib/audioDevices";
import { resolveSttUrl } from "../../lib/corestt";
import { WorkspaceContext } from "../workspace/types";
import { withWarning } from "../workspace/withWarning";

export function DiagnosticsPage({ context }: { context: WorkspaceContext }) {
  const [live, setLive] = useState<HealthStatus | null>(null);
  const [ready, setReady] = useState<HealthStatus | null>(null);
  const [version, setVersion] = useState<VersionInfo | null>(null);
  const [config, setConfig] = useState<PublicConfig | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);

  async function refreshDiagnostics() {
    await withWarning(context, async () => {
      const [nextLive, nextReady, nextVersion, nextConfig] = await Promise.all([
        api.healthLive(),
        api.healthReady(),
        api.version(),
        api.config(),
      ]);
      setLive(nextLive);
      setReady(nextReady);
      setVersion(nextVersion);
      setConfig(nextConfig);
    });
  }

  useEffect(() => {
    void refreshDiagnostics();
  }, []);

  useEffect(() => {
    async function loadDevices() {
      if (!navigator.mediaDevices?.enumerateDevices) return;
      try {
        setDevices(filterAudioInputDevices(await navigator.mediaDevices.enumerateDevices()));
      } catch {
        setDevices([]);
      }
    }

    void loadDevices();
  }, []);

  const systemStatusItems = [
    {
      label: "App",
      value: ready ? (ready.ok ? "Ready" : "Not ready") : "Unknown",
      tone: ready?.ok ? "good" : "warn",
      detail: version ? `${version.app} ${version.version} (${version.environment})` : "Version unknown",
    },
    {
      label: "STT",
      value: formatConnectionState(context.connectionState),
      tone: context.connectionState === "STREAMING" || context.connectionState === "READY" ? "good" : "warn",
      detail: resolveSttUrl(),
    },
    {
      label: "Microphone",
      value: formatStatusValue(context.micStatus),
      tone: context.micStatus.toLowerCase().includes("capturing") ? "good" : "warn",
      detail: getSelectedMicrophoneLabel(devices, context.settings.audio_device_id),
    },
    {
      label: "Audio",
      value: context.audioSampleRate ? `${context.audioSampleRate} Hz` : "Not capturing",
      tone: context.audioSampleRate ? "good" : "neutral",
      detail: `${context.audioPacketCount} packets`,
    },
  ] as const;

  const connectionDetails = [
    ["Live check", live ? String(live.ok) : "Unknown"],
    ["Ready check", ready ? String(ready.ok) : "Unknown"],
    ["Config", config ? `${config.sttProxyUrl}, ${config.audioFormat}, protocol ${config.sttProtocolVersion}` : "Unknown"],
    ["Reconnect attempt", context.retryAttempt || "None"],
  ];

  const workspaceCounts = [
    ["Documents", context.documents.length],
    ["Templates", context.templates.length],
    ["Macros", context.macros.length],
  ];

  return (
    <section className="manager-page">
      <PageHeader title="Diagnostics" />
      <div className="button-row">
        <button onClick={() => void refreshDiagnostics()}><HeartPulse size={16} /> Refresh diagnostics</button>
        <button onClick={() => void context.refreshWorkspace()}><Activity size={16} /> Refresh workspace</button>
      </div>
      <div className="diagnostics-dashboard">
        <section className="diagnostics-status-grid" aria-label="System status">
          {systemStatusItems.map((item) => (
            <article className="diagnostics-status-card" key={item.label}>
              <span>{item.label}</span>
              <strong className={`diagnostics-pill ${item.tone}`}>{item.value}</strong>
              <small>{item.detail}</small>
            </article>
          ))}
        </section>

        <section className="diagnostics-panel">
          <h2>Connection details</h2>
          <dl className="diagnostics-detail-grid">
            {connectionDetails.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="diagnostics-count-grid" aria-label="Workspace counts">
          {workspaceCounts.map(([label, value]) => (
            <article className="diagnostics-count-card" key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </article>
          ))}
        </section>
      </div>
    </section>
  );
}

function formatConnectionState(state: string): string {
  return state.toLowerCase().replace(/^\w/, (letter) => letter.toUpperCase());
}

function formatStatusValue(status: string): string {
  return status.replace(/_/g, " ").toLowerCase().replace(/^\w/, (letter) => letter.toUpperCase());
}
