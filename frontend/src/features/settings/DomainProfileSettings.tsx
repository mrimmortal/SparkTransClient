import { useEffect, useMemo, useState } from "react";
import { Plus, RefreshCw, Save, Search, Trash2, X } from "lucide-react";
import { api, DomainProfilesResponse, UserSettingsRecord } from "../../lib/api";
import {
  buildAvailableProfileNames,
  buildDomainProfilePayload,
  createNewDomainProfileDraft,
  domainProfileToDraft,
  DomainProfileFormDraft,
  filterDomainProfileNames,
  getNextProfileNameAfterDelete,
} from "./domainProfileForm";

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
  const [deleteConfirming, setDeleteConfirming] = useState(false);
  const [profileSearch, setProfileSearch] = useState("");

  const availableProfiles = useMemo(
    () => buildAvailableProfileNames({ domainProfiles: profiles.domainProfiles, activeProfile: profile, editingName }),
    [editingName, profile, profiles.domainProfiles],
  );
  const trimmedEditingName = editingName.trim();
  const selectedProfileExists = profiles.domainProfiles.includes(trimmedEditingName);
  const canDeleteProfile = Boolean(trimmedEditingName && selectedProfileExists);
  const filteredProfiles = useMemo(() => filterDomainProfileNames(availableProfiles, profileSearch), [availableProfiles, profileSearch]);
  const profileCountLabel = loading
    ? "Loading profiles"
    : profileSearch.trim()
      ? `${filteredProfiles.length} of ${availableProfiles.length} shown`
      : `${availableProfiles.length} available`;

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
      setDeleteConfirming(false);
    } catch (error) {
      setWarning(error instanceof Error ? error.message : "Unable to load domain profiles.");
    } finally {
      setLoading(false);
    }
  }

  function selectProfile(nextProfile: string) {
    if (profiles.domainProfiles.includes(nextProfile)) onProfileChange(nextProfile);
    setEditingName(nextProfile);
    setDraft(domainProfileToDraft(profiles.profiles[nextProfile]));
    setDeleteConfirming(false);
  }

  function updateDraft<Field extends keyof DomainProfileFormDraft>(field: Field, value: DomainProfileFormDraft[Field]) {
    setDraft((current) => ({ ...current, [field]: value }));
    setDeleteConfirming(false);
  }

  function createProfile() {
    const next = createNewDomainProfileDraft(availableProfiles);
    setEditingName(next.name);
    setDraft(next.draft);
    setDeleteConfirming(false);
  }

  async function saveProfile() {
    if (!trimmedEditingName) {
      setWarning("Domain profile name is required.");
      return;
    }
    setSaving(true);
    try {
      const response = await api.updateDomainProfile(trimmedEditingName, buildDomainProfilePayload(draft));
      setProfiles(response);
      onProfileChange(trimmedEditingName);
      setEditingName(trimmedEditingName);
      setDraft(domainProfileToDraft(response.profiles[trimmedEditingName] ?? response.profile));
      setDeleteConfirming(false);
    } catch (error) {
      setWarning(error instanceof Error ? error.message : "Unable to save domain profile.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteProfile() {
    if (!canDeleteProfile) return;
    setSaving(true);
    try {
      const response = await api.deleteDomainProfile(trimmedEditingName);
      setProfiles(response);
      const nextName = getNextProfileNameAfterDelete({ domainProfiles: response.domainProfiles, activeProfile: profile });
      onProfileChange(nextName);
      setEditingName(nextName);
      setDraft(domainProfileToDraft(response.profiles[nextName]));
      setDeleteConfirming(false);
    } catch (error) {
      setWarning(error instanceof Error ? error.message : "Unable to delete domain profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="domain-profile-settings">
      <div className="domain-profile-picker">
        <div className="domain-profile-panel-header">
          <div>
            <h3>Profiles</h3>
            <span>{profileCountLabel}</span>
          </div>
          <button className="icon-button" type="button" onClick={() => void loadProfiles()} disabled={loading || saving} title="Refresh domain profiles" aria-label="Refresh domain profiles">
            <RefreshCw size={16} />
          </button>
        </div>
        <label className="domain-profile-search">
          Search profiles
          <div className="input-with-icon">
            <Search size={16} />
            <input
              value={profileSearch}
              onChange={(event) => setProfileSearch(event.target.value)}
              placeholder="Search profile name"
              disabled={loading || saving || availableProfiles.length === 0}
            />
          </div>
        </label>
        <div className="domain-profile-list" role="list" aria-label="Transcription profiles">
          {filteredProfiles.length === 0 ? (
            <div className="domain-profile-empty-state">
              {profileSearch.trim() ? "No profiles match your search." : "No profiles available."}
            </div>
          ) : filteredProfiles.map((name) => {
            const active = name === profile;
            const selected = name === editingName;
            return (
              <button
                key={name}
                type="button"
                className={selected ? "domain-profile-list-item active" : "domain-profile-list-item"}
                onClick={() => selectProfile(name)}
                disabled={loading || saving}
              >
                <span>{name}</span>
                {active && <strong>Active</strong>}
              </button>
            );
          })}
        </div>
        <button className="domain-profile-new-button" type="button" onClick={createProfile} disabled={loading || saving}>
          <Plus size={16} /> New profile
        </button>
      </div>
      <div className="domain-profile-editor">
        <div className="domain-profile-editor-header">
          <div>
            <h3>Profile definition</h3>
            <span>{selectedProfileExists ? "Editing saved profile" : "New unsaved profile"}</span>
          </div>
          {trimmedEditingName === profile && <span className="domain-profile-active-badge">Active profile</span>}
        </div>
        <div className="domain-profile-form">
          <label>
            Profile name
            <input
              value={editingName}
              onChange={(event) => {
                setEditingName(event.target.value);
                setDeleteConfirming(false);
              }}
              disabled={saving}
            />
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
        </div>
        <div className="domain-profile-actions">
          {deleteConfirming ? (
            <div className="domain-profile-delete-confirm">
              <span>Delete {trimmedEditingName}?</span>
              <button className="danger" type="button" onClick={() => void deleteProfile()} disabled={saving || !canDeleteProfile}>
                <Trash2 size={16} /> Confirm
              </button>
              <button type="button" onClick={() => setDeleteConfirming(false)} disabled={saving}>
                <X size={16} /> Cancel
              </button>
            </div>
          ) : (
            <button className="danger" type="button" onClick={() => setDeleteConfirming(true)} disabled={saving || !canDeleteProfile}>
              <Trash2 size={16} /> Delete
            </button>
          )}
          <button className="primary" type="button" onClick={() => void saveProfile()} disabled={saving || !trimmedEditingName}>
            <Save size={16} /> {saving ? "Saving" : "Save profile"}
          </button>
        </div>
      </div>
    </div>
  );
}
