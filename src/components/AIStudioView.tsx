import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Brain,
  Check,
  Download,
  Image as ImageIcon,
  Loader2,
  MessageSquare,
  Send,
  Trash2,
  Upload,
  Zap,
} from 'lucide-react';
import { SUBJECTS } from '../data/syllabusData';

export type AITab = 'chat' | 'fast' | 'think' | 'vision' | 'diagram';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  modelUsed?: string;
}

interface AIStudioViewProps {
  progressSummary: string;
  initialTab?: AITab;
  prefillPrompt?: { subject: string; prompt: string; tab: AITab } | null;
  onConsumePrefill: () => void;
}

const STUDIO_BANNER_PATH = '/src/assets/images/floral_magic_studio_banner_1795289199871.jpg';

const CHAT_MODELS = [
  { id: 'gemini-4-hydrogen', label: 'Gemini 4 Hydrogen (Free Tier Tutor)' },
  { id: 'gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash-Lite (Fastest Free Tier)' },
] as const;

const DIAGRAM_STYLES = [
  { id: 'schematic', label: 'Schematic' },
  { id: 'mindmap', label: 'Mind-Map' },
  { id: 'flowchart', label: 'Flowchart' },
  { id: 'timeline', label: 'Timeline' },
] as const;

const ASPECT_RATIOS = ['16:9', '4:3', '1:1', '3:4'] as const;

interface GeneratedDiagram {
  title: string;
  svgMarkup: string;
  caption: string;
  keyPoints: string[];
  width: number;
  height: number;
}

export function AIStudioView({
  progressSummary,
  initialTab = 'chat',
  prefillPrompt,
  onConsumePrefill,
}: AIStudioViewProps) {
  const [activeTab, setActiveTab] = useState<AITab>(initialTab);
  const [bannerImgFailed, setBannerImgFailed] = useState(false);

  // --- Tab 1: Multi-Turn Chatbot State (Free Tier: gemini-4-hydrogen / gemini-3.1-flash-lite) ---
  const [chatModel, setChatModel] = useState<string>('gemini-4-hydrogen');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: 'Welcome to BoardSprint Mentor. I know your 10-day Pre-Board schedule (Nov 21–30), all 7 subjects (including English Communicative Course A, Hindi Course A, AI 417, and Punjabi), and your NCERT/Competency/PYQ resources. Ask me to explain a tough concept, check an answer, or adjust today’s plan.',
      modelUsed: 'gemini-4-hydrogen',
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<{ message: string; hint?: string } | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  // --- Tab 2: Fast Flash-Lite Quick Drill State (gemini-3.1-flash-lite) ---
  const [fastSubject, setFastSubject] = useState<string>('Science');
  const [fastMode, setFastMode] = useState<'mcq-drill' | 'formula-sheet' | 'mnemonics'>('mcq-drill');
  const [fastPrompt, setFastPrompt] = useState(
    'Give me 5 high-probability CBSE Class 10 board MCQs on Electricity & Magnetic Effects with answers at the end.'
  );
  const [fastResult, setFastResult] = useState('');
  const [fastLoading, setFastLoading] = useState(false);
  const [fastLatencyMs, setFastLatencyMs] = useState<number | null>(null);
  const [fastError, setFastError] = useState<{ message: string; hint?: string } | null>(null);

  // --- Tab 3: High-Thinking Deep Strategist State (gemini-4-hydrogen + ThinkingLevel.HIGH) ---
  const [thinkPrompt, setThinkPrompt] = useState(
    'Analyze my remaining 10-day schedule and design a high-scoring strategy for balancing Maths Competency Workbook, Science derivations, and Punjabi/AI without burning out before December Pre-Boards.'
  );
  const [thinkResult, setThinkResult] = useState('');
  const [thinkLoading, setThinkLoading] = useState(false);
  const [thinkError, setThinkError] = useState<{ message: string; hint?: string } | null>(null);

  // --- Tab 4: Photo / Worksheet Analyzer (gemini-4-hydrogen Vision) ---
  const [visionSubject, setVisionSubject] = useState<string>('Mathematics');
  const [visionQuestion, setVisionQuestion] = useState(
    'Solve this question step-by-step using CBSE Class 10 board marking-scheme steps and point out common errors.'
  );
  const [uploadedPreviewUrl, setUploadedPreviewUrl] = useState<string | null>(null);
  const [uploadedBase64, setUploadedBase64] = useState<string | null>(null);
  const [uploadedMimeType, setUploadedMimeType] = useState<string>('image/jpeg');
  const [visionResult, setVisionResult] = useState('');
  const [visionLoading, setVisionLoading] = useState(false);
  const [visionError, setVisionError] = useState<{ message: string; hint?: string } | null>(null);

  // --- Tab 5: Crisp Vector SVG Diagram Studio (gemini-4-hydrogen Free Tier) ---
  const [diagramSubject, setDiagramSubject] = useState<string>('Science');
  const [diagramPrompt, setDiagramPrompt] = useState(
    'Labeled schematic diagram of Human Heart double circulation showing oxygenated and deoxygenated blood flow pathways for Class 10 Biology revision'
  );
  const [diagramStyle, setDiagramStyle] =
    useState<(typeof DIAGRAM_STYLES)[number]['id']>('schematic');
  const [diagramRatio, setDiagramRatio] = useState<(typeof ASPECT_RATIOS)[number]>('16:9');
  const [generatedDiagram, setGeneratedDiagram] = useState<GeneratedDiagram | null>(null);
  const [diagramLoading, setDiagramLoading] = useState(false);
  const [diagramError, setDiagramError] = useState<{ message: string; hint?: string } | null>(null);

  // Safe Blob URL for rendering sanitized SVG inside <img> (zero script execution)
  const diagramSvgBlobUrl = useMemo(() => {
    if (!generatedDiagram?.svgMarkup) return null;
    const blob = new Blob([generatedDiagram.svgMarkup], {
      type: 'image/svg+xml;charset=utf-8',
    });
    return URL.createObjectURL(blob);
  }, [generatedDiagram]);

  useEffect(() => {
    return () => {
      if (diagramSvgBlobUrl) {
        URL.revokeObjectURL(diagramSvgBlobUrl);
      }
    };
  }, [diagramSvgBlobUrl]);

  useEffect(() => {
    if (prefillPrompt) {
      setActiveTab(prefillPrompt.tab);
      if (prefillPrompt.tab === 'fast') {
        setFastSubject(prefillPrompt.subject);
        setFastPrompt(prefillPrompt.prompt);
      } else if (prefillPrompt.tab === 'chat') {
        setChatInput(prefillPrompt.prompt);
      }
      onConsumePrefill();
    }
  }, [prefillPrompt, onConsumePrefill]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, chatLoading]);

  // Handlers
  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = chatInput.trim();
    if (!trimmed || chatLoading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: trimmed,
    };
    const nextHistory = [...chatMessages, userMsg];
    setChatMessages(nextHistory);
    setChatInput('');
    setChatError(null);
    setChatLoading(true);

    try {
      const apiMessages = nextHistory
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({ role: m.role, text: m.text }));

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          model: chatModel,
          progressSummary,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setChatError({ message: data.error || 'Chat request failed.', hint: data.hint });
        return;
      }
      setChatMessages((prev) => [
        ...prev,
        {
          id: `m-${Date.now()}`,
          role: 'model',
          text: data.text || '(No text returned)',
          modelUsed: data.model,
        },
      ]);
    } catch (err) {
      setChatError({
        message: err instanceof Error ? err.message : 'Network error contacting chat endpoint.',
      });
    } finally {
      setChatLoading(false);
    }
  };

  const handleRunFastDrill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fastPrompt.trim() || fastLoading) return;
    setFastLoading(true);
    setFastError(null);
    const t0 = performance.now();

    try {
      const res = await fetch('/api/ai/fast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: fastPrompt,
          subject: fastSubject,
          mode: fastMode,
        }),
      });
      const data = await res.json();
      setFastLatencyMs(Math.round(performance.now() - t0));
      if (!res.ok) {
        setFastError({ message: data.error || 'Fast drill failed.', hint: data.hint });
        return;
      }
      setFastResult(data.text || '');
    } catch (err) {
      setFastError({
        message: err instanceof Error ? err.message : 'Network error contacting fast drill.',
      });
    } finally {
      setFastLoading(false);
    }
  };

  const handleRunDeepThink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!thinkPrompt.trim() || thinkLoading) return;
    setThinkLoading(true);
    setThinkError(null);

    try {
      const res = await fetch('/api/ai/think', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: thinkPrompt,
          progressSummary,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setThinkError({ message: data.error || 'Deep thinking request failed.', hint: data.hint });
        return;
      }
      setThinkResult(data.text || '');
    } catch (err) {
      setThinkError({
        message: err instanceof Error ? err.message : 'Network error contacting deep thinking.',
      });
    } finally {
      setThinkLoading(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setVisionError({ message: 'Please upload a valid image file (PNG, JPG, or WEBP).' });
      return;
    }
    setVisionError(null);
    setUploadedMimeType(file.type);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      setUploadedPreviewUrl(dataUrl);
      const commaIdx = dataUrl.indexOf(',');
      setUploadedBase64(commaIdx >= 0 ? dataUrl.slice(commaIdx + 1) : dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyzePhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadedBase64) {
      setVisionError({ message: 'Please upload a photo of a question, page, or diagram first.' });
      return;
    }
    setVisionLoading(true);
    setVisionError(null);

    try {
      const res = await fetch('/api/ai/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: uploadedBase64,
          mimeType: uploadedMimeType,
          question: visionQuestion,
          subject: visionSubject,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setVisionError({ message: data.error || 'Image analysis failed.', hint: data.hint });
        return;
      }
      setVisionResult(data.text || '');
    } catch (err) {
      setVisionError({
        message: err instanceof Error ? err.message : 'Network error analyzing image.',
      });
    } finally {
      setVisionLoading(false);
    }
  };

  const handleGenerateDiagram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!diagramPrompt.trim() || diagramLoading) return;
    setDiagramLoading(true);
    setDiagramError(null);

    try {
      const res = await fetch('/api/ai/generate-diagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: diagramPrompt,
          diagramStyle,
          aspectRatio: diagramRatio,
          subject: diagramSubject,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDiagramError({ message: data.error || 'Diagram generation failed.', hint: data.hint });
        return;
      }
      setGeneratedDiagram({
        title: data.title || `${diagramSubject} Study Diagram`,
        svgMarkup: data.svgMarkup || '',
        caption: data.caption || '',
        keyPoints: Array.isArray(data.keyPoints) ? data.keyPoints : [],
        width: Number(data.width) || 960,
        height: Number(data.height) || 540,
      });
    } catch (err) {
      setDiagramError({
        message: err instanceof Error ? err.message : 'Network error generating diagram.',
      });
    } finally {
      setDiagramLoading(false);
    }
  };

  const handleDownloadPng = () => {
    if (!generatedDiagram || !diagramSvgBlobUrl) return;
    const img = new window.Image();
    img.onload = () => {
      const scale = 2;
      const canvas = document.createElement('canvas');
      canvas.width = generatedDiagram.width * scale;
      canvas.height = generatedDiagram.height * scale;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const pngUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = pngUrl;
      a.download = `boardsprint-${diagramStyle}-diagram.png`;
      a.click();
    };
    img.src = diagramSvgBlobUrl;
  };

  const renderErrorBox = (err: { message: string; hint?: string } | null) => {
    if (!err) return null;
    return (
      <div
        role="alert"
        className="rounded-lg border border-[#BE123C]/30 bg-[#FFF1F2] p-4 text-sm text-[#881337] flex items-start gap-3"
      >
        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#BE123C]" />
        <div className="space-y-1">
          <div className="font-semibold">{err.message}</div>
          {err.hint && <p className="text-xs text-[#9F1239]">{err.hint}</p>}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Enchanted Botanical Studio Banner */}
      <section className="relative rounded-xl overflow-hidden enchanted-card">
        {!bannerImgFailed && (
          <img
            src={STUDIO_BANNER_PATH}
            alt="Ornate floral amethyst and gold botanical frame"
            referrerPolicy="no-referrer"
            onError={() => setBannerImgFailed(true)}
            className="absolute inset-0 w-full h-full object-cover opacity-30 pointer-events-none"
          />
        )}
        <div className="relative p-6 sm:p-8 bg-gradient-to-r from-[#FBF6F9]/95 via-[#FBF6F9]/88 to-[#F6ECF3]/75">
          <p className="text-xs font-medium text-[#614B69]">
            Gemini API Free Tier · Gemini 4 Hydrogen · Gemini 3.1 Flash-Lite · Vector SVG Diagrams
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#221329] mt-1">
            AI Study Studio
          </h1>
          <p className="text-sm text-[#614B69] mt-1.5 max-w-2xl leading-relaxed">
            Every study tool runs on Gemini Free-Tier models—tuned to CBSE Class 10th marking
            schemes, NCERT exercises, competency workbooks, and your live 10-day sprint progress.
          </p>
        </div>
      </section>

      {/* Segmented Tool Selector */}
      <div
        role="tablist"
        aria-label="AI Study Studio tools"
        className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-[#E8D7E4]"
      >
        {[
          { id: 'chat' as const, label: 'Mentor Chat', icon: MessageSquare },
          { id: 'fast' as const, label: 'Quick Drill (Fast)', icon: Zap },
          { id: 'think' as const, label: 'Deep Strategist', icon: Brain },
          { id: 'vision' as const, label: 'Photo Doubt Solver', icon: Upload },
          { id: 'diagram' as const, label: 'Visual Diagram Studio', icon: ImageIcon },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 -mb-px cursor-pointer ${
                active
                  ? 'border-[#7E22CE] text-[#5B21B6]'
                  : 'border-transparent text-[#614B69] hover:text-[#221329]'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: Multi-Turn Mentor Chat */}
      {activeTab === 'chat' && (
        <section className="enchanted-card rounded-xl overflow-hidden flex flex-col min-h-[540px]">
          <div className="px-5 py-3.5 bg-[#F6ECF3]/70 border-b border-[#E8D7E4] flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-[#221329]">
                BoardSprint Multi-Turn Study Mentor
              </h2>
              <p className="text-xs text-[#614B69]">
                Remembers conversation history and your current 10-day syllabus progress.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <label htmlFor="chat-model-select" className="sr-only">
                Select Gemini chat model
              </label>
              <select
                id="chat-model-select"
                value={chatModel}
                onChange={(e) => setChatModel(e.target.value)}
                className="text-xs bg-white border border-[#E8D7E4] rounded-md px-2.5 py-1.5 text-[#221329] focus:outline-none focus:border-[#7E22CE]"
              >
                {CHAT_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setChatMessages((prev) => prev.slice(0, 1))}
                aria-label="Clear chat history"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-[#614B69] hover:text-[#221329] border border-[#E8D7E4] rounded-md bg-white cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Reset
              </button>
            </div>
          </div>

          <div
            ref={chatScrollRef}
            className="flex-1 p-5 space-y-4 overflow-y-auto max-h-[400px]"
          >
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[82%] rounded-xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-[#2A1438] text-white'
                      : 'bg-[#FBF6F9] border border-[#E8D7E4] text-[#221329]'
                  }`}
                >
                  {msg.role === 'model' && msg.modelUsed && (
                    <div className="text-[11px] font-mono text-[#614B69] mb-1">
                      Mentor · {msg.modelUsed}
                    </div>
                  )}
                  {msg.text}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex items-center gap-2 text-xs text-[#614B69]">
                <Loader2 className="w-4 h-4 animate-spin text-[#7E22CE]" />
                Thinking through your CBSE syllabus question...
              </div>
            )}
          </div>

          {chatError && <div className="px-5 pb-3">{renderErrorBox(chatError)}</div>}

          <div className="px-5 py-3 bg-[#F6ECF3]/65 border-t border-[#E8D7E4] space-y-2.5">
            <div className="flex flex-wrap gap-2">
              {[
                'Summarize Julius Caesar Act II & III for English Communicative',
                'Give me a 1-page formula cheat sheet for Surface Areas & Volumes',
                'Key Hindi Course A Vyakaran rules for Vachya & Pad Parichay',
                'Explain Confusion Matrix Precision vs Recall with a board example',
              ].map((starter) => (
                <button
                  key={starter}
                  type="button"
                  onClick={() => setChatInput(starter)}
                  className="text-xs px-2.5 py-1 rounded-md border border-[#E8D7E4] bg-white text-[#614B69] hover:text-[#221329] hover:border-[#7E22CE]/50 transition-colors cursor-pointer"
                >
                  {starter}
                </button>
              ))}
            </div>

            <form onSubmit={handleSendChat} className="flex items-center gap-2">
              <label htmlFor="chat-message-input" className="sr-only">
                Ask BoardSprint Mentor
              </label>
              <input
                id="chat-message-input"
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask a doubt from NCERT, PYQs, English Comm., Hindi A, AI, or Punjabi..."
                className="flex-1 bg-white border border-[#E8D7E4] rounded-lg px-3.5 py-2.5 text-sm text-[#221329] focus:outline-none focus:border-[#7E22CE]"
              />
              <button
                type="submit"
                disabled={chatLoading || !chatInput.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-lg enchanted-cta text-white disabled:opacity-50 transition-all whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                Send
              </button>
            </form>
          </div>
        </section>
      )}

      {/* TAB 2: Low-Latency Flash-Lite Quick Drill */}
      {activeTab === 'fast' && (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form
            onSubmit={handleRunFastDrill}
            className="lg:col-span-5 enchanted-card rounded-xl p-6 space-y-4"
          >
            <div>
              <div className="text-xs font-mono text-[#614B69]">
                Model: gemini-3.1-flash-lite · Free Tier
              </div>
              <h2 className="font-display text-2xl font-bold text-[#221329] mt-0.5">
                Low-Latency Quick Drill
              </h2>
              <p className="text-xs text-[#614B69] mt-1">
                Fast generation for rapid 1-mark MCQs, formula sheets, and revision mnemonics.
              </p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="fast-subject" className="block text-xs font-semibold text-[#221329]">
                Subject
              </label>
              <select
                id="fast-subject"
                value={fastSubject}
                onChange={(e) => setFastSubject(e.target.value)}
                className="w-full bg-[#FBF6F9] border border-[#E8D7E4] rounded-lg px-3 py-2 text-sm text-[#221329]"
              >
                {SUBJECTS.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <span className="block text-xs font-semibold text-[#221329]">Drill Format</span>
              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    { id: 'mcq-drill', label: '5 MCQs' },
                    { id: 'formula-sheet', label: 'Formulas' },
                    { id: 'mnemonics', label: 'Mnemonics' },
                  ] as const
                ).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setFastMode(m.id)}
                    className={`py-2 px-2 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
                      fastMode === m.id
                        ? 'bg-[#2A1438] text-white border-[#2A1438]'
                        : 'bg-white text-[#614B69] border-[#E8D7E4] hover:text-[#221329]'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="fast-prompt" className="block text-xs font-semibold text-[#221329]">
                Chapter or Topic Prompt
              </label>
              <textarea
                id="fast-prompt"
                rows={4}
                value={fastPrompt}
                onChange={(e) => setFastPrompt(e.target.value)}
                className="w-full bg-[#FBF6F9] border border-[#E8D7E4] rounded-lg p-3 text-sm text-[#221329] focus:outline-none focus:border-[#7E22CE]"
              />
            </div>

            <button
              type="submit"
              disabled={fastLoading}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg enchanted-cta text-white disabled:opacity-50 transition-all cursor-pointer"
            >
              {fastLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              {fastLoading ? 'Generating Fast Drill...' : 'Run Flash-Lite Drill'}
            </button>
          </form>

          <div className="lg:col-span-7 enchanted-card rounded-xl p-6 min-h-[360px] space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8D7E4] pb-3">
              <span className="text-sm font-semibold text-[#221329]">Fast Response Output</span>
              {fastLatencyMs !== null && (
                <span className="font-mono text-xs text-[#614B69] tabular-nums">
                  Completed in {fastLatencyMs} ms
                </span>
              )}
            </div>
            {renderErrorBox(fastError)}
            {fastResult ? (
              <div className="text-sm text-[#221329] leading-relaxed whitespace-pre-wrap">
                {fastResult}
              </div>
            ) : (
              <p className="text-sm text-[#614B69]">
                Select any Class 10th chapter and run a rapid Flash-Lite drill to test your recall
                between study sessions.
              </p>
            )}
          </div>
        </section>
      )}

      {/* TAB 3: High-Thinking Deep Strategist (gemini-4-hydrogen + ThinkingLevel.HIGH) */}
      {activeTab === 'think' && (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form
            onSubmit={handleRunDeepThink}
            className="lg:col-span-5 enchanted-card rounded-xl p-6 space-y-4"
          >
            <div>
              <div className="text-xs font-mono text-[#614B69]">
                Model: gemini-4-hydrogen · ThinkingLevel.HIGH · Free Tier
              </div>
              <h2 className="font-display text-2xl font-bold text-[#221329] mt-0.5">
                Deep Pre-Board Strategist
              </h2>
              <p className="text-xs text-[#614B69] mt-1">
                Uses high-depth reasoning on Gemini 4 Hydrogen to untangle difficult proofs,
                rebalance weak chapters, or critique your exam strategy.
              </p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="think-prompt" className="block text-xs font-semibold text-[#221329]">
                Complex Problem or Schedule Optimization Query
              </label>
              <textarea
                id="think-prompt"
                rows={5}
                value={thinkPrompt}
                onChange={(e) => setThinkPrompt(e.target.value)}
                className="w-full bg-[#FBF6F9] border border-[#E8D7E4] rounded-lg p-3 text-sm text-[#221329] focus:outline-none focus:border-[#7E22CE]"
              />
            </div>

            <button
              type="submit"
              disabled={thinkLoading}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg enchanted-cta text-white disabled:opacity-50 transition-all cursor-pointer"
            >
              {thinkLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Brain className="w-4 h-4" />
              )}
              {thinkLoading ? 'Deep Reasoning in Progress...' : 'Run High-Thinking Analysis'}
            </button>
          </form>

          <div className="lg:col-span-7 enchanted-card rounded-xl p-6 min-h-[360px] space-y-4">
            <div className="border-b border-[#E8D7E4] pb-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-[#221329]">Deep Analysis Report</span>
              <span className="font-mono text-xs text-[#614B69]">gemini-4-hydrogen · HIGH</span>
            </div>
            {renderErrorBox(thinkError)}
            {thinkResult ? (
              <div className="text-sm text-[#221329] leading-relaxed whitespace-pre-wrap">
                {thinkResult}
              </div>
            ) : (
              <p className="text-sm text-[#614B69]">
                Submit a multi-step NCERT proof, competency case-study puzzle, or ask for a deep
                weightage-based adjustment to your Nov 21–30 sprint.
              </p>
            )}
          </div>
        </section>
      )}

      {/* TAB 4: Photo & Worksheet Doubt Analyzer (gemini-4-hydrogen Multimodal Vision) */}
      {activeTab === 'vision' && (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form
            onSubmit={handleAnalyzePhoto}
            className="lg:col-span-5 enchanted-card rounded-xl p-6 space-y-4"
          >
            <div>
              <div className="text-xs font-mono text-[#614B69]">
                Model: gemini-4-hydrogen (Vision) · Free Tier
              </div>
              <h2 className="font-display text-2xl font-bold text-[#221329] mt-0.5">
                Photo &amp; Worksheet Doubt Solver
              </h2>
              <p className="text-xs text-[#614B69] mt-1">
                Upload a photo of any NCERT question, competency workbook page, SST map, or
                handwritten math attempt for CBSE marking-scheme guidance.
              </p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="vision-subject" className="block text-xs font-semibold text-[#221329]">
                Subject
              </label>
              <select
                id="vision-subject"
                value={visionSubject}
                onChange={(e) => setVisionSubject(e.target.value)}
                className="w-full bg-[#FBF6F9] border border-[#E8D7E4] rounded-lg px-3 py-2 text-sm text-[#221329]"
              >
                {SUBJECTS.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="vision-file-upload"
                className="block text-xs font-semibold text-[#221329]"
              >
                Upload Question or Page Photo
              </label>
              <input
                id="vision-file-upload"
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="block w-full text-xs text-[#614B69] file:mr-3 file:py-2 file:px-3 file:rounded-md file:border file:border-[#E8D7E4] file:text-xs file:font-medium file:bg-[#F6ECF3] file:text-[#221329] hover:file:bg-[#EDE0EB]"
              />
            </div>

            {uploadedPreviewUrl && (
              <div className="rounded-lg border border-[#E8D7E4] overflow-hidden bg-[#FBF6F9]">
                <img
                  src={uploadedPreviewUrl}
                  alt="Uploaded study question preview"
                  className="w-full max-h-52 object-contain"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="vision-question" className="block text-xs font-semibold text-[#221329]">
                What should Gemini check or explain?
              </label>
              <textarea
                id="vision-question"
                rows={3}
                value={visionQuestion}
                onChange={(e) => setVisionQuestion(e.target.value)}
                className="w-full bg-[#FBF6F9] border border-[#E8D7E4] rounded-lg p-3 text-sm text-[#221329]"
              />
            </div>

            <button
              type="submit"
              disabled={visionLoading}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg enchanted-cta text-white disabled:opacity-50 transition-all cursor-pointer"
            >
              {visionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {visionLoading ? 'Analyzing Study Photo...' : 'Analyze Study Photo'}
            </button>
          </form>

          <div className="lg:col-span-7 enchanted-card rounded-xl p-6 min-h-[360px] space-y-4">
            <div className="border-b border-[#E8D7E4] pb-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-[#221329]">
                Step-by-Step Board Solution
              </span>
              <span className="font-mono text-xs text-[#614B69]">gemini-4-hydrogen</span>
            </div>
            {renderErrorBox(visionError)}
            {visionResult ? (
              <div className="text-sm text-[#221329] leading-relaxed whitespace-pre-wrap">
                {visionResult}
              </div>
            ) : (
              <p className="text-sm text-[#614B69]">
                Upload a clear photo of an exercise problem, ray diagram, circuit, or handwritten
                attempt to receive an examiner-grade walkthrough.
              </p>
            )}
          </div>
        </section>
      )}

      {/* TAB 5: Crisp Vector SVG Study Diagram Studio (gemini-4-hydrogen Free Tier) */}
      {activeTab === 'diagram' && (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form
            onSubmit={handleGenerateDiagram}
            className="lg:col-span-5 enchanted-card rounded-xl p-6 space-y-4"
          >
            <div>
              <div className="text-xs font-mono text-[#614B69]">
                Model: gemini-4-hydrogen · Crisp SVG Vector Studio · Free Tier
              </div>
              <h2 className="font-display text-2xl font-bold text-[#221329] mt-0.5">
                Visual Study Diagram Studio
              </h2>
              <p className="text-xs text-[#614B69] mt-1">
                Generate razor-sharp vector SVG schematics, revision mind-maps, process flowcharts,
                and SST history timelines—downloadable as SVG or crisp PNG.
              </p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="diagram-subject" className="block text-xs font-semibold text-[#221329]">
                Subject
              </label>
              <select
                id="diagram-subject"
                value={diagramSubject}
                onChange={(e) => setDiagramSubject(e.target.value)}
                className="w-full bg-[#FBF6F9] border border-[#E8D7E4] rounded-lg px-3 py-2 text-sm text-[#221329]"
              >
                {SUBJECTS.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Visual Style Selector */}
            <div className="space-y-1.5">
              <span className="block text-xs font-semibold text-[#221329]">Visual Format</span>
              <div
                className="grid grid-cols-2 sm:grid-cols-4 gap-2"
                role="radiogroup"
                aria-label="Diagram format"
              >
                {DIAGRAM_STYLES.map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    role="radio"
                    aria-checked={diagramStyle === st.id}
                    onClick={() => setDiagramStyle(st.id)}
                    className={`py-2 px-2 text-xs font-medium rounded-md border transition-colors whitespace-nowrap cursor-pointer ${
                      diagramStyle === st.id
                        ? 'bg-[#6D28D9] text-white border-[#6D28D9]'
                        : 'bg-white text-[#221329] border-[#E8D7E4] hover:bg-[#F6ECF3]'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Aspect Ratio Selector */}
            <div className="space-y-1.5">
              <span className="block text-xs font-semibold text-[#221329]">Canvas Aspect Ratio</span>
              <div className="grid grid-cols-4 gap-2">
                {ASPECT_RATIOS.map((ar) => (
                  <button
                    key={ar}
                    type="button"
                    onClick={() => setDiagramRatio(ar)}
                    className={`py-1.5 px-2 text-xs font-mono rounded-md border transition-colors cursor-pointer ${
                      diagramRatio === ar
                        ? 'bg-[#2A1438] text-white border-[#2A1438]'
                        : 'bg-white text-[#614B69] border-[#E8D7E4] hover:text-[#221329]'
                    }`}
                  >
                    {ar}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="diagram-prompt" className="block text-xs font-semibold text-[#221329]">
                Diagram or Mind-Map Topic
              </label>
              <textarea
                id="diagram-prompt"
                rows={4}
                value={diagramPrompt}
                onChange={(e) => setDiagramPrompt(e.target.value)}
                className="w-full bg-[#FBF6F9] border border-[#E8D7E4] rounded-lg p-3 text-sm text-[#221329] focus:outline-none focus:border-[#7E22CE]"
              />
            </div>

            <button
              type="submit"
              disabled={diagramLoading}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg enchanted-cta text-white disabled:opacity-50 transition-all cursor-pointer"
            >
              {diagramLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ImageIcon className="w-4 h-4" />
              )}
              {diagramLoading ? 'Generating Vector Diagram...' : 'Generate SVG Diagram'}
            </button>
          </form>

          <div className="lg:col-span-7 enchanted-card rounded-xl p-6 min-h-[380px] space-y-4">
            <div className="border-b border-[#E8D7E4] pb-3 flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold text-[#221329]">
                {generatedDiagram?.title || 'Generated Vector Study Map'}
              </span>
              {diagramSvgBlobUrl && generatedDiagram && (
                <div className="flex items-center gap-3">
                  <a
                    href={diagramSvgBlobUrl}
                    download={`boardsprint-${diagramStyle}-diagram.svg`}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6D28D9] hover:underline whitespace-nowrap"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download SVG
                  </a>
                  <button
                    type="button"
                    onClick={handleDownloadPng}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[#BE185D] hover:underline whitespace-nowrap cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export PNG
                  </button>
                </div>
              )}
            </div>
            {renderErrorBox(diagramError)}
            {diagramSvgBlobUrl && generatedDiagram ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-[#E8D7E4] overflow-hidden bg-white p-2">
                  <img
                    src={diagramSvgBlobUrl}
                    alt={generatedDiagram.title}
                    className="w-full h-auto block"
                  />
                </div>
                {generatedDiagram.caption && (
                  <p className="text-xs text-[#614B69] leading-relaxed">
                    {generatedDiagram.caption}
                  </p>
                )}
                {generatedDiagram.keyPoints.length > 0 && (
                  <div className="pt-3 border-t border-[#E8D7E4] space-y-2">
                    <div className="text-xs font-semibold text-[#221329]">
                      CBSE Exam Key Takeaways
                    </div>
                    <ul className="space-y-1.5 text-xs text-[#614B69]">
                      {generatedDiagram.keyPoints.map((pt, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-[#047857] shrink-0 mt-0.5" />
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-64 rounded-lg border border-dashed border-[#D8C1D3] bg-[#FBF6F9] flex flex-col items-center justify-center text-center p-6">
                <ImageIcon className="w-8 h-8 text-[#7E22CE]/60 mb-2" />
                <p className="text-sm font-medium text-[#221329]">No study diagram generated yet</p>
                <p className="text-xs text-[#614B69] mt-1 max-w-sm">
                  Pick Schematic, Mind-Map, Flowchart, or Timeline and describe a Class 10th topic
                  to craft a crisp, printable vector study map on the Gemini Free Tier.
                </p>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
