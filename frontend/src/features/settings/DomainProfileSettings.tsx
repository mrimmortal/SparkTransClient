import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Save, Trash2 } from "lucide-react";
import { api, DomainProfilesResponse, UserSettingsRecord } from "../../lib/api";
import { buildDomainProfilePayload, domainProfileToDraft, DomainProfileFormDraft } from "./domainProfileForm";

type DomainProfileSettingsProps = {
  profile: string;
  onProfileChange: (profile: UserSettingsRecord["profile"]) => void;
  setWarning: (message: string) => void;
};

export function DomainProfileSettings({ profile, onProfileChange, setWarning }: DomainProfileSettingsProps) {
  const [profiles, setProfiles] = useState<DomainProfilesResponse>({ domainProfiles: [], profiles: {} });
  const [editingName, setEditingName] = useState(profile || "general");
  const [draft, setDraft] = useState<DomainProfileFormDraft>(() => domainProfileToDraft(undefined));
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const availableProfiles = useMemo(() => {
    const names = new Set(profiles.domainProfiles);
    if (profile) names.add(profile);
    if (editingName) names.add(editingName);
    return Array.from(names).sort((left, right) => left.localeCompare(right));
  }, [editingName, profile, profiles.domainProfiles]);

  useEffect(() => {
    void loadProfiles();
  }, []);

  useEffect(() => {
    if (!editingName && profile) setEditingName(profile);
  }, [editingName, profile]);

  async function loadProfiles() {
    setLoading(true);
    try {
      const response = await api.domainProfiles();
      setProfiles(response);
      const nextName = profile || response.domainProfiles[0] || "general";
      setEditingName(nextName);
      setDraft(domainProfileToDraft(response.profiles[nextName]));
    } catch (error) {
      setWarning(error instanceof Error ? error.message : "Unable to load domain profiles.");
    } finally {
      setLoading(false);
    }
  }

  function selectProfile(nextProfile: string) {
    onProfileChange(nextProfile);
    setEditingName(nextProfile);
    setDraft(domainProfileToDraft(profiles.profiles[nextProfile]));
  }

  function updateDraft<Field extends keyof DomainProfileFormDraft>(field: Field, value: DomainProfileFormDraft[Field]) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  async function saveProfile() {
    const name = editingName.trim();
    if (!name) {
      setWarning("Domain profile name is required.");
      return;
    }
    setSaving(true);
    try {
      const response = await api.updateDomainProfile(name, buildDomainProfilePayload(draft));
      setProfiles(response);
      onProfileChange(name);
      setEditingName(name);
      setDraft(domainProfileToDraft(response.profiles[name] ?? response.profile));
    } catch (error) {
      setWarning(error instanceof Error ? error.message : "Unable to save domain profile.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteProfile() {
    const name = editingName.trim();
    if (!name) return;
    setSaving(true);
    try {
      const response = await api.deleteDomainProfile(name);
      setProfiles(response);
      const nextName = response.domainProfiles.includes(profile) ? profile : response.domainProfiles[0] || "general";
      onProfileChange(nextName);
      setEditingName(nextName);
      setDraft(domainProfileToDraft(response.profiles[nextName]));
    } catch (error) {
      setWarning(error instanceof Error ? error.message : "Unable to delete domain profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="domain-profile-settings stack">
      <div className="panel-heading">
        <h3>Transcription profile</h3>
        <button type="button" onClick={() => void loadProfiles()} disabled={loading || saving} title="Refresh domain profiles">
          <RefreshCw size={16} /> {loading ? "Loading" : "Refresh"}
        </button>
      </div>
      <label>
        Active profile
        <select value={profile} onChange={(event) => selectProfile(event.target.value)} disabled={loading || saving}>
          {availableProfiles.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </label>
      <div className="domain-profile-form stack">
        <label>
          Profile name
          <input value={editingName} onChange={(event) => setEditingName(event.target.value)} disabled={saving} />
        </label>
        <label>
          Initial prompt
          <textarea
            rows={3}
            value={draft.initialPrompt}
            onChange={(event) => updateDraft("initialPrompt", event.target.value)}
            disabled={saving}
          />
        </label>
        <label>
          Realtime prompt
          <textarea
            rows={2}
            value={draft.realtimePrompt}
            onChange={(event) => updateDraft("realtimePrompt", event.target.value)}
            disabled={saving}
          />
        </label>
        <label>
          Hotwords
          <textarea
            rows={3}
            value={draft.hotwordsText}
            onChange={(event) => updateDraft("hotwordsText", event.target.value)}
            disabled={saving}
          />
        </label>
        <div className="button-row domain-profile-actions">
          <button className="primary" type="button" onClick={() => void saveProfile()} disabled={saving || !editingName.trim()}>
            <Save size={16} /> {saving ? "Saving" : "Save profile"}
          </button>
          <button type="button" onClick={() => void deleteProfile()} disabled={saving || !editingName.trim()}>
            <Trash2 size={16} /> Delete
          </button>
        </div>
      </div>
    </section>
  );
}
