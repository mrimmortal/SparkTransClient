export type AudioInputDeviceLike = {
  deviceId: string;
  kind?: string;
  label?: string;
};

export function filterAudioInputDevices<Device extends AudioInputDeviceLike>(devices: Device[]): Device[] {
  return devices.filter((device) => device.kind === "audioinput");
}

export function formatAudioInputDeviceLabel(device: Pick<AudioInputDeviceLike, "deviceId" | "label">, fallbackIndex?: number): string {
  const label = device.label?.trim();
  if (label) return label;
  if (fallbackIndex) return `Microphone ${fallbackIndex}`;
  return `Microphone ${device.deviceId.slice(0, 6)}`;
}

export function getSelectedMicrophoneLabel(
  devices: Pick<AudioInputDeviceLike, "deviceId" | "label">[],
  selectedDeviceId: string | null | undefined,
): string {
  if (!selectedDeviceId) return "Browser default microphone";
  const matchingDevice = devices.find((device) => device.deviceId === selectedDeviceId);
  if (matchingDevice) return formatAudioInputDeviceLabel(matchingDevice);
  return `Saved microphone (${selectedDeviceId.slice(0, 6)})`;
}
