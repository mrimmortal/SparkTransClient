import { Editor } from "@tiptap/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { MacroRecord, TemplateRecord, UserSettingsRecord } from "../../lib/api";
import { CommandEmbeddingMatcher } from "../../lib/commandEmbeddings";
import {
  applyDictationCaseMode,
  applyTranscriptEvent,
  ConnectionState,
  DictationCaseMode,
  isBlankAudioTranscript,
  resolveSttUrl,
  routeFinalText,
  routeFinalTextSemantic,
  shouldCheckFinalTranscriptTextDedupe,
  shouldInsertFinalTranscript,
  shouldInsertFinalTranscriptText,
  TranscriptState,
} from "../../lib/corestt";
import { confirmationMessages, runEnterLikeVoiceCommand, runHistoryVoiceCommand, runListModeVoiceCommand } from "../../lib/editorFlow";
import { getDeleteLastSentenceRange, getDeleteLastWordRange, TextblockDeleteRange } from "../../lib/editorVoiceCommands";
import { getMicrophoneCaptureErrorMessage, isMicrophoneCaptureSupported, MicrophoneCapture } from "../../lib/micCapture";
import {
  clearRealtimeTranscriptPreview,
  setRealtimeTranscriptPreview,
} from "../../lib/realtimeTranscriptPreview";
import { SttClient } from "../../lib/sttClient";
import {
  cancelTemplateMarkerNavigation,
  moveToFirstTemplateMarker,
  moveToFirstTemplateMarkerAtOrAfter,
  moveToNextTemplateMarker,
  moveToPreviousTemplateMarker,
  replaceSelectedTemplateMarker,
  skipTemplateMarker,
} from "../../lib/templateMarkerNavigation";
import {
  highlightTemplatePlaceholders,
  routeTemplateVoiceCommand,
  routeTemplateVoiceCommandSemantic,
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
  const dictationCaseModeRef = useRef<DictationCaseMode>("normal");
  const matcherRef = useRef<CommandEmbeddingMatcher | null>(null);
  const templateEmbeddingsRef = useRef<Map<number, number[]>>(new Map());
  const computedTemplatesHashRef = useRef("");

  useEffect(() => {
    const matcher = new CommandEmbeddingMatcher();
    matcherRef.current = matcher;
    matcher.init();
  }, []);

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
            shouldRouteFinalTranscriptText(typed.text)
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

  function shouldRouteFinalTranscriptText(text: string): boolean {
    const currentSettings = settingsRef.current;
    const target = microOpenRef.current || currentSettings.default_editor_target === "micro-editor" ? "micro-editor" : "smart-editor";
    const routingOptions = {
      voiceCommandsEnabled: currentSettings.voice_commands_enabled,
      voiceCommandVariantsEnabled: currentSettings.voice_command_variants_enabled,
      templateMarkerNavigationEnabled: currentSettings.template_marker_navigation_enabled,
    };
    if (!shouldCheckFinalTranscriptTextDedupe(text, target, routingOptions)) return true;
    return shouldInsertFinalTranscriptText(recentFinalTranscriptTextRef.current, text, Date.now(), {
      enabled: currentSettings.duplicate_transcript_protection_enabled,
      windowMs: currentSettings.duplicate_transcript_window_ms,
    });
  }

  async function insertFinalText(text: string) {
    const currentSettings = settingsRef.current;
    const matcher = matcherRef.current;

    if (matcher?.ready) {
      const currentHash = templatesRef.current.map((t) => t.id).join(",");
      if (currentHash !== computedTemplatesHashRef.current) {
        templateEmbeddingsRef.current = await matcher.computeTemplateEmbeddings(templatesRef.current);
        computedTemplatesHashRef.current = currentHash;
      }
    }

    const template = await routeTemplateVoiceCommandSemantic(
      text,
      templatesRef.current,
      { voiceCommandsEnabled: currentSettings.voice_commands_enabled },
      matcher,
      templateEmbeddingsRef.current,
    );
    if (template) {
      if (!shouldInsertTemplateVoiceCommand(recentTemplateVoiceCommandsRef.current, template, text, Date.now())) return;
      lastSmartEditorDictationRangeRef.current = null;
      const currentEditor = editorRef.current;
      if (!currentEditor) return;
      const insertionStart = currentEditor.state.selection.from;
      currentEditor.chain().focus().insertContent(highlightTemplatePlaceholders(template.content_html || "")).run();
      if (currentSettings.template_marker_navigation_enabled) {
        moveToFirstTemplateMarkerAtOrAfter(currentEditor, insertionStart);
      }
      return;
    }
    const target = microOpenRef.current || currentSettings.default_editor_target === "micro-editor" ? "micro-editor" : "smart-editor";
    const routed = await routeFinalTextSemantic(text, target, macrosRef.current, matcher, {
      voiceCommandsEnabled: currentSettings.voice_commands_enabled,
      macrosEnabled: currentSettings.macros_enabled,
      voiceCommandVariantsEnabled: currentSettings.voice_command_variants_enabled,
      templateMarkerNavigationEnabled: currentSettings.template_marker_navigation_enabled,
    });
    if (routed.kind === "command") {
      runCommand(routed.command);
      return;
    }
    const routedText = applyDictationCaseMode(routed.text, dictationCaseModeRef.current);
    if (target === "micro-editor") {
      setMicroOpen(true);
      lastSmartEditorDictationRangeRef.current = null;
      setMicroText((current) => `${current}${current ? " " : ""}${routedText}`);
    } else {
      const currentEditor = editorRef.current;
      if (!currentEditor) return;
      const insertedText = `${routedText} `;
      if (
        currentSettings.template_marker_navigation_enabled &&
        replaceSelectedTemplateMarker(currentEditor, routedText, { autoAdvance: currentSettings.template_marker_auto_advance_enabled })
      ) {
        lastSmartEditorDictationRangeRef.current = null;
        return;
      }
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
    if (command === "start-upper-case") {
      dictationCaseModeRef.current = "upper";
      return;
    }
    if (command === "stop-upper-case") {
      if (dictationCaseModeRef.current === "upper") dictationCaseModeRef.current = "normal";
      return;
    }
    if (command === "start-lower-case") {
      dictationCaseModeRef.current = "lower";
      return;
    }
    if (command === "stop-lower-case") {
      if (dictationCaseModeRef.current === "lower") dictationCaseModeRef.current = "normal";
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
    if (command === "next-template-field") {
      if (!moveToNextTemplateMarker(currentEditor)) setWarning("No next template field found.");
      return;
    }
    if (command === "previous-template-field") {
      if (!moveToPreviousTemplateMarker(currentEditor)) setWarning("No previous template field found.");
      return;
    }
    if (command === "first-template-field") {
      if (!moveToFirstTemplateMarker(currentEditor)) setWarning("No template field found.");
      return;
    }
    if (command === "skip-template-field") {
      if (!skipTemplateMarker(currentEditor)) setWarning("No next template field found.");
      return;
    }
    if (command === "cancel-template-field-navigation") {
      cancelTemplateMarkerNavigation(currentEditor);
      return;
    }
    if (command === "insert-newline") {
      runEnterLikeVoiceCommand(currentEditor);
      return;
    }
    if (command === "insert-paragraph") {
      currentEditor.chain().focus().createParagraphNear().run();
      return;
    }
    if (command === "undo") {
      runHistoryVoiceCommand(currentEditor, "undo");
      return;
    }
    if (command === "redo") {
      runHistoryVoiceCommand(currentEditor, "redo");
      return;
    }
    if (command === "start-bold") {
      if (!currentEditor.isActive("bold")) currentEditor.chain().focus().toggleBold().run();
      return;
    }
    if (command === "stop-bold") {
      if (currentEditor.isActive("bold")) currentEditor.chain().focus().toggleBold().run();
      return;
    }
    if (command === "start-italic") {
      if (!currentEditor.isActive("italic")) currentEditor.chain().focus().toggleItalic().run();
      return;
    }
    if (command === "stop-italic") {
      if (currentEditor.isActive("italic")) currentEditor.chain().focus().toggleItalic().run();
      return;
    }
    if (command === "start-underline") {
      if (!currentEditor.isActive("underline")) currentEditor.chain().focus().toggleUnderline().run();
      return;
    }
    if (command === "stop-underline") {
      if (currentEditor.isActive("underline")) currentEditor.chain().focus().toggleUnderline().run();
      return;
    }
    if (command === "start-bullet-list") {
      runListModeVoiceCommand(currentEditor, "bullet");
      return;
    }
    if (command === "stop-bullet-list") {
      runListModeVoiceCommand(currentEditor, "bullet", "stop");
      return;
    }
    if (command === "start-numbered-list") {
      runListModeVoiceCommand(currentEditor, "ordered");
      return;
    }
    if (command === "stop-numbered-list") {
      runListModeVoiceCommand(currentEditor, "ordered", "stop");
      return;
    }
    if (command === "start-heading") {
      if (!currentEditor.isActive("heading", { level: 2 })) currentEditor.chain().focus().toggleHeading({ level: 2 }).run();
      return;
    }
    if (command === "stop-heading" || command === "start-paragraph") {
      currentEditor.chain().focus().setParagraph().run();
      return;
    }
    if (command === "start-quote") {
      if (!currentEditor.isActive("blockquote")) currentEditor.chain().focus().toggleBlockquote().run();
      return;
    }
    if (command === "stop-quote") {
      if (currentEditor.isActive("blockquote")) currentEditor.chain().focus().toggleBlockquote().run();
      return;
    }
    if (command === "start-code-block") {
      if (!currentEditor.isActive("codeBlock")) currentEditor.chain().focus().toggleCodeBlock().run();
      return;
    }
    if (command === "stop-code-block") {
      if (currentEditor.isActive("codeBlock")) currentEditor.chain().focus().toggleCodeBlock().run();
      return;
    }
    if (command === "insert-horizontal-rule") {
      currentEditor.chain().focus().setHorizontalRule().run();
      return;
    }
    if (command === "clear-formatting") {
      currentEditor.chain().focus().unsetAllMarks().clearNodes().run();
      return;
    }
    if (command === "select-all") {
      currentEditor.commands.selectAll();
      return;
    }
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
