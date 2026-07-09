import { describe, expect, it } from "vitest";
import { filterAudioInputDevices, formatAudioInputDeviceLabel, getSelectedMicrophoneLabel } from "./audioDevices";

describe("audio device helpers", () => {
  it("filters browser devices to microphone inputs", () => {
    expect(
      filterAudioInputDevices([
        { deviceId: "mic-1", kind: "audioinput", label: "Desk mic" },
        { deviceId: "camera-1", kind: "videoinput", label: "Camera" },
        { deviceId: "speaker-1", kind: "audiooutput", label: "Speakers" },
      ]),
    ).toEqual([{ deviceId: "mic-1", kind: "audioinput", label: "Desk mic" }]);
  });

  it("formats named and unnamed microphone devices", () => {
    expect(formatAudioInputDeviceLabel({ deviceId: "abc123456", label: "Built-in microphone" })).toBe("Built-in microphone");
    expect(formatAudioInputDeviceLabel({ deviceId: "abc123456", label: "" }, 2)).toBe("Microphone 2");
  });

  it("resolves the selected microphone label from available devices", () => {
    const devices = [
      { deviceId: "default", label: "Default - MacBook Air Microphone (Built-in)" },
      { deviceId: "usb-123456", label: "USB microphone" },
    ];

    expect(getSelectedMicrophoneLabel(devices, null)).toBe("Browser default microphone");
    expect(getSelectedMicrophoneLabel(devices, "usb-123456")).toBe("USB microphone");
    expect(getSelectedMicrophoneLabel(devices, "missing-123456")).toBe("Saved microphone (missin)");
  });
});
