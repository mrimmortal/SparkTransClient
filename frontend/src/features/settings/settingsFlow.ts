import { UserSettingsRecord } from "../../lib/api";

export function shouldSaveSettingImmediately(field: keyof UserSettingsRecord): boolean {
  void field;
  return false;
}
