import { Editor } from "@tiptap/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { MacroRecord, TemplateRecord, UserSettingsRecord } from "../../lib/api";
import {
  applyTranscriptEvent,
  ConnectionState,
  isBlankAudioTranscript,
  resolveSttUrl,
  routeFinalText,
  shouldInsertFinalTranscript,
  shouldInsertFinalTranscriptText,
  TranscriptState,
} from "../../lib/corestt";
import { confirmationMessages } from "../../lib/editorFlow";
import { getDeleteLastSentenceRange, getDeleteLastWordRange, TextblockDeleteRange } from "../../lib/editorVoiceCommands";
import { getMicrophoneCaptureErrorMessage, isMicrophoneCaptureSupported, MicrophoneCapture } from "../../lib/micCapture";
import {
  clearRealtimeTranscriptPreview,
  setRealtimeTranscriptPreview,
} from "../../lib/realtimeTranscriptPreview";
import { SttClient } from "../../lib/sttClient";
import {
  routeTemplateVoiceCommand,
  shouldInsertTemplateVoiceCommand,
} from "../../lib/templateFlow";

export function useDictationSession({
  editor,
  settings,
  macros,
  templates,
  microOpen,
  saveDocument,
  setWarning,
  setMicroOpen,
  setMicroText,
}: {
  editor: Editor | null;
  settings: UserSettingsRecord;
  macros: MacroRecord[];
  templates: TemplateRecord[];
  microOpen: boolean;
  saveDocument: () => Promise<void>;
  setWarning: (message: string) => void;
  setMicroOpen: (open: boolean) => void;
  setMicroText: (text: string | ((current: string) => string)) => void;
}) {
  const [connectionState, setConnectionState] = useState<ConnectionState>("DISCONNECTED");
  const [transcripts, setTranscripts] = useState<TranscriptState>({ realtimeBySegment: {}, finalBySegment: {} });
  const [micStatus, setMicStatus] = useState("idle");
  const [audioPacketCount, setAudioPacketCount] = useState(0);
  const [audioSampleRate, setAudioSampleRate] = useState(0);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const sttRef = useRef<SttClient | null>(null);
  const micRef = useRef<MicrophoneCapture | null>(null);
  const micStartingRef = useRef(false);
  const dictationRequestedRef = useRef(false);
  const macrosRef = useRef(macros);
  const templatesRef = useRef(templates);
  const settingsRef = useRef(settings);
  const microOpenRef = useRef(microOpen);
  const editorRef = useRef<Editor | null>(null);
  const insertedFinalSegmentsRef = useRef(new Set<number>());
  const recentFinalTranscriptTextRef = useRef(new Map<string, number>());
  const recentTemplateVoiceCommandsRef = useRef(new Map<string, number>());
  const lastSmartEditorDictationRangeRef = useRef<{ from: number; to: number; text: string } | null>(null);

  const realtimeText = useMemo(() => Object.values(transcripts.realtimeBySegment).join(" "), [transcripts]);

  useEffect(() => {
    macrosRef.current = macros;
  }, [macros]);

  useEffect(() => {
    templatesRef.current = templates;
  }, [templates]);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    microOpenRef.current = microOpen;
  }, [microOpen]);

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  useEffect(() => {
    if (connectionState === "STREAMING" && dictationRequestedRef.current) {
      void startMicrophoneCapture();
    }
    if (connectionState === "CLOSED" || connectionState === "DISCONNECTED" || connectionState === "ERROR") {
      if (editorRef.current) clearRealtimeTranscriptPreview(editorRef.current);
      stopMicrophoneCapture();
    }
  }, [connectionState]);

  function connectStt() {
    if (sttRef.current) {
      sttRef.current.connect();
      return;
    }
    const client = new SttClient(resolveSttUrl(), {
      onState: (state) => {
        setConnectionState(state);
        if (state === "READY" || state === "STREAMING") setRetryAttempt(0);
      },
      onWarning: setWarning,
      onRetry: (attempt) => setRetryAttempt(attempt),
      onMessage: (message) => {
        const typed = message as { type?: string; segmentId?: number; text?: string; displayText?: string };
        if ((typed.type === "realtime" || typed.type === "final") && typeof typed.segmentId === "number") {
          setTranscripts((current) => applyTranscriptEvent(current, typed as never));
          if (typed.type === "realtime") {
            const previewText = typed.displayText ?? typed.text ?? "";
            const previewEditor = editorRef.current;
            if (previewEditor) setRealtimeTranscriptPreview(previewEditor, previewText);
          }
          if (typed.type === "final") {
            const previewEditor = editorRef.current;
            if (previewEditor) clearRealtimeTranscriptPreview(previewEditor);
          }
          if (
            typed.type === "final" &&
            typed.text &&
            !(settingsRef.current.ignore_blank_audio_enabled && isBlankAudioTranscript(typed.text)) &&
            shouldInsertFinalTranscript(insertedFinalSegmentsRef.current, typed.segmentId) &&
            shouldInsertFinalTranscriptText(recentFinalTranscriptTextRef.current, typed.text, Date.now(), {
              enabled: settingsRef.current.duplicate_transcript_protection_enabled,
              windowMs: settingsRef.current.duplicate_transcript_window_ms,
            })
          ) {
            insertFinalText(typed.text);
          }
        }
        if (typed.type === "clear") {
          const previewEditor = editorRef.current;
          if (previewEditor) clearRealtimeTranscriptPreview(previewEditor);
          insertedFinalSegmentsRef.current.clear();
          recentFinalTranscriptTextRef.current.clear();
          recentTemplateVoiceCommandsRef.current.clear();
          setTranscripts({ realtimeBySegment: {}, finalBySegment: {} });
        }
      },
    });
    sttRef.current = client;
    client.connect();
  }

  function disconnectStt() {
    sttRef.current?.disconnect();
  }

  function startDictation() {
    setWarning("");
    setAudioPacketCount(0);
    dictationRequestedRef.current = true;
    if (!sttRef.current) {
      connectStt();
    }
    sttRef.current?.start();
  }

  function stopDictation() {
    dictationRequestedRef.current = false;
    if (editorRef.current) clearRealtimeTranscriptPreview(editorRef.current);
    stopMicrophoneCapture();
    sttRef.current?.stop();
  }

  async function startMicrophoneCapture() {
    if (micStartingRef.current || micRef.current?.isCapturing) return;
    if (!isMicrophoneCaptureSupported()) {
      setWarning("Microphone capture requires browser microphone access on localhost or HTTPS.");
      setMicStatus("error");
      dictationRequestedRef.current = false;
      sttRef.current?.stop();
      return;
    }

    micStartingRef.current = true;
    setMicStatus("starting");
    const capture = new MicrophoneCapture({
      audioDeviceId: settings.audio_device_id || undefined,
      onWarning: setWarning,
      onSamples: (samples, sampleRate) => {
        if (sttRef.current?.sendFloatSamples(samples, sampleRate)) {
          setAudioPacketCount((count) => count + 1);
        }
      },
    });
    micRef.current = capture;

    try {
      const sampleRate = await capture.start();
      if (!dictationRequestedRef.current) {
        capture.stop();
        if (micRef.current === capture) micRef.current = null;
        setMicStatus("stopped");
        return;
      }
      setAudioSampleRate(sampleRate);
      setMicStatus("capturing");
    } catch (error) {
      if (micRef.current === capture) micRef.current = null;
      setMicStatus("error");
      setWarning(getMicrophoneCaptureErrorMessage(error));
      dictationRequestedRef.current = false;
      sttRef.current?.stop();
    } finally {
      micStartingRef.current = false;
    }
  }

  function stopMicrophoneCapture() {
    micRef.current?.stop();
    micRef.current = null;
    micStartingRef.current = false;
    setAudioSampleRate(0);
    setMicStatus("stopped");
  }

  function insertFinalText(text: string) {
    const currentSettings = settingsRef.current;
    const template = routeTemplateVoiceCommand(text, templatesRef.current, {
      voiceCommandsEnabled: currentSettings.voice_commands_enabled,
    });
    if (template) {
      if (!shouldInsertTemplateVoiceCommand(recentTemplateVoiceCommandsRef.current, template, text, Date.now())) return;
      lastSmartEditorDictationRangeRef.current = null;
      editorRef.current?.chain().focus().insertContent(template.content_html || "").run();
      return;
    }
    const target = microOpenRef.current || currentSettings.default_editor_target === "micro-editor" ? "micro-editor" : "smart-editor";
    const routed = routeFinalText(text, target, macrosRef.current, {
      voiceCommandsEnabled: currentSettings.voice_commands_enabled,
      macrosEnabled: currentSettings.macros_enabled,
      voiceCommandVariantsEnabled: currentSettings.voice_command_variants_enabled,
    });
    if (routed.kind === "command") {
      runCommand(routed.command);
      return;
    }
    if (target === "micro-editor") {
      setMicroOpen(true);
      lastSmartEditorDictationRangeRef.current = null;
      setMicroText((current) => `${current}${current ? " " : ""}${routed.text}`);
    } else {
      const currentEditor = editorRef.current;
      if (!currentEditor) return;
      const insertedText = `${routed.text} `;
      const from = currentEditor.state.selection.from;
      currentEditor.chain().focus().insertContent(insertedText).run();
      const to = currentEditor.state.selection.from;
      lastSmartEditorDictationRangeRef.current = to > from ? { from, to, text: insertedText } : null;
    }
  }

  function runCommand(command: string) {
    if (command === "stop-dictation") {
      stopDictation();
      return;
    }
    const currentEditor = editorRef.current;
    if (!currentEditor) return;
    if (command === "scratch-that") {
      deleteLastSmartEditorDictationRange(currentEditor);
      return;
    }
    if (command === "delete-last-word") {
      deleteTextblockRange(currentEditor, getDeleteLastWordRange);
      return;
    }
    if (command === "delete-last-sentence") {
      deleteTextblockRange(currentEditor, getDeleteLastSentenceRange);
      return;
    }
    if (command === "save-document") {
      void saveDocument();
      return;
    }
    if (command === "insert-newline") currentEditor.chain().focus().setHardBreak().run();
    if (command === "insert-paragraph") currentEditor.chain().focus().createParagraphNear().run();
    if (command === "undo") currentEditor.chain().focus().undo().run();
    if (command === "redo") currentEditor.chain().focus().redo().run();
    if (command === "bold") currentEditor.chain().focus().toggleBold().run();
    if (command === "italic") currentEditor.chain().focus().toggleItalic().run();
    if (command === "underline") currentEditor.chain().focus().toggleUnderline().run();
    if (command === "clear-formatting") currentEditor.chain().focus().unsetAllMarks().clearNodes().run();
    if (command === "select-all") currentEditor.commands.selectAll();
    if (command === "clear-all" && (!settingsRef.current.confirm_destructive_actions || window.confirm(confirmationMessages.clearEditor))) {
      currentEditor.commands.clearContent();
    }
  }

  function deleteLastSmartEditorDictationRange(currentEditor: Editor) {
    const range = lastSmartEditorDictationRangeRef.current;
    if (!range) return;
    const documentSize = currentEditor.state.doc.content.size;
    const from = Math.max(0, Math.min(range.from, documentSize));
    const to = Math.max(from, Math.min(range.to, documentSize));
    if (to <= from) {
      lastSmartEditorDictationRangeRef.current = null;
      return;
    }
    if (currentEditor.state.doc.textBetween(from, to, " ", " ") !== range.text) {
      lastSmartEditorDictationRangeRef.current = null;
      return;
    }
    currentEditor.chain().focus().deleteRange({ from, to }).run();
    lastSmartEditorDictationRangeRef.current = null;
  }

  function deleteTextblockRange(
    currentEditor: Editor,
    getRange: (text: string, cursorOffset: number) => TextblockDeleteRange | null,
  ) {
    const { state } = currentEditor;
    const { empty } = state.selection;
    if (!empty) {
      currentEditor.chain().focus().deleteSelection().run();
      lastSmartEditorDictationRangeRef.current = null;
      return;
    }
    const textblockStart = state.selection.$from.start();
    const cursorOffset = state.selection.$from.parentOffset;
    const range = getRange(state.selection.$from.parent.textContent, cursorOffset);
    if (!range) return;
    currentEditor
      .chain()
      .focus()
      .deleteRange({ from: textblockStart + range.fromOffset, to: textblockStart + range.toOffset })
      .run();
    lastSmartEditorDictationRangeRef.current = null;
  }

  return {
    connectionState,
    realtimeText,
    micStatus,
    audioPacketCount,
    audioSampleRate,
    retryAttempt,
    connectStt,
    disconnectStt,
    startDictation,
    stopDictation,
  };
}
