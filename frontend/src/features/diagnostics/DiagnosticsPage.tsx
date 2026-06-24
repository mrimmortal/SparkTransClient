import { useEffect, useState } from "react";
import { Activity, HeartPulse } from "lucide-react";
import { PageHeader } from "../../components/PageHeader";
import { HealthStatus, PublicConfig, VersionInfo, api } from "../../lib/api";
import { resolveSttUrl } from "../../lib/corestt";
import { WorkspaceContext } from "../workspace/types";
import { withWarning } from "../workspace/withWarning";

export function DiagnosticsPage({ context }: { context: WorkspaceContext }) {
  const [live, setLive] = useState<HealthStatus | null>(null);
  const [ready, setReady] = useState<HealthStatus | null>(null);
  const [version, setVersion] = useState<VersionInfo | null>(null);
  const [config, setConfig] = useState<PublicConfig | null>(null);

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

  return (
    <section className="manager-page">
      <PageHeader title="Diagnostics" />
      <div className="button-row">
        <button onClick={() => void refreshDiagnostics()}><HeartPulse size={16} /> Refresh diagnostics</button>
        <button onClick={() => void context.refreshWorkspace()}><Activity size={16} /> Refresh workspace</button>
      </div>
      <dl className="diagnostics-grid">
        <dt>Live</dt>
        <dd>{live ? String(live.ok) : "Unknown"}</dd>
        <dt>Ready</dt>
        <dd>{ready ? String(ready.ok) : "Unknown"}</dd>
        <dt>App</dt>
        <dd>{version ? `${version.app} ${version.version} (${version.environment})` : "Unknown"}</dd>
        <dt>Config</dt>
        <dd>{config ? `${config.sttProxyUrl}, ${config.audioFormat}, protocol ${config.sttProtocolVersion}` : "Unknown"}</dd>
        <dt>Connection</dt>
        <dd>{context.connectionState}</dd>
        <dt>STT URL</dt>
        <dd>{resolveSttUrl()}</dd>
        <dt>Microphone</dt>
        <dd>{context.micStatus}</dd>
        <dt>Audio sample rate</dt>
        <dd>{context.audioSampleRate || "Not capturing"}</dd>
        <dt>Audio packets</dt>
        <dd>{context.audioPacketCount}</dd>
        <dt>Reconnect attempt</dt>
        <dd>{context.retryAttempt || "None"}</dd>
        <dt>Documents</dt>
        <dd>{context.documents.length}</dd>
        <dt>Templates</dt>
        <dd>{context.templates.length}</dd>
        <dt>Macros</dt>
        <dd>{context.macros.length}</dd>
        <dt>Settings</dt>
        <dd>{context.settings.profile}</dd>
      </dl>
    </section>
  );
}
