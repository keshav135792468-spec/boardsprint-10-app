import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import { extractAndSanitizeSvg, getDiagramDimensions } from './src/utils/svgSanitizer.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';

function getGenAIClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw Object.assign(
      new Error('GEMINI_API_KEY is not configured on the server. Add your Gemini API key in Settings > Secrets.'),
      { statusCode: 500, code: 'MISSING_API_KEY' }
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function formatGeminiError(err: unknown): { status: number; message: string; hint?: string } {
  const errorObj = err as { status?: number; statusCode?: number; message?: string; code?: string };
  const rawMessage = errorObj?.message || 'An unexpected error occurred while contacting Gemini.';
  const status = errorObj?.status || errorObj?.statusCode || 500;

  if (status === 429 || rawMessage.includes('RESOURCE_EXHAUSTED')) {
    return {
      status: 429,
      message: 'Free-tier rate limit reached momentarily.',
      hint: 'Wait a few seconds and retry, or switch Mentor Chat to Gemini 3.1 Flash-Lite for lighter quota usage.',
    };
  }
  if (status === 403 || (status === 400 && rawMessage.includes('API_KEY_INVALID'))) {
    return {
      status,
      message: 'API key permission denied or invalid.',
      hint: 'Verify your GEMINI_API_KEY in the Settings > Secrets panel.',
    };
  }
  if (status === 404 || rawMessage.includes('NOT_FOUND')) {
    return {
      status: 404,
      message: 'Requested Gemini model is currently unavailable for this key or region.',
      hint: 'Verify your GEMINI_API_KEY in Settings > Secrets or retry with Gemini 4 Hydrogen.',
    };
  }
  return { status: status >= 400 && status < 600 ? status : 500, message: rawMessage };
}

// Strictly Gemini API Free Tier models across all routes
const ALLOWED_CHAT_MODELS = new Set([
  'gemini-4-hydrogen',
  'gemini-3.1-flash-lite',
]);

const ALLOWED_DIAGRAM_STYLES = new Set([
  'schematic',
  'mindmap',
  'flowchart',
  'timeline',
]);

const ALLOWED_ASPECT_RATIOS = new Set(['16:9', '4:3', '1:1', '3:4']);

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '12mb' }));

  // Health endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      ok: true,
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
      tier: 'free-tier-compatible',
    });
  });

  // 1. Low-Latency Fast Drill & Quick Tips (gemini-3.1-flash-lite — Free Tier)
  app.post('/api/ai/fast', async (req: Request, res: Response) => {
    try {
      const { prompt, subject, mode } = req.body as {
        prompt?: string;
        subject?: string;
        mode?: string;
      };
      if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
        res.status(400).json({ error: 'Please enter a topic or question first.' });
        return;
      }

      const ai = getGenAIClient();
      const systemInstruction = `You are a lightning-fast CBSE Class 10th Board Exam tutor.
The student is preparing for December Pre-Boards across 7 subjects: Maths, Science, SST, English Communicative (Course A), Hindi Course A (Kshitij & Kritika), Artificial Intelligence (Code 417), and Punjabi (Code 004).
Resources available: NCERT textbooks, offline sample papers, 10-year solved PYQs, competency workbooks (Maths/SST/Science), and online notes.
Mode: ${mode || 'quick-drill'}. Subject focus: ${subject || 'General Class 10'}.
Keep your output concise, structured with clean headings or numbered points, exam-scoring oriented, and directly aligned to CBSE NCERT marking schemes.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: prompt.trim(),
        config: {
          systemInstruction,
        },
      });

      res.json({
        model: 'gemini-3.1-flash-lite',
        text: response.text || '',
      });
    } catch (err) {
      const formatted = formatGeminiError(err);
      res.status(formatted.status).json({ error: formatted.message, hint: formatted.hint });
    }
  });

  // 2. High-Thinking Deep Strategy & Tough Problem Solver (gemini-4-hydrogen + ThinkingLevel.HIGH — Free Tier)
  app.post('/api/ai/think', async (req: Request, res: Response) => {
    try {
      const { prompt, progressSummary } = req.body as {
        prompt?: string;
        progressSummary?: string;
      };
      if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
        res.status(400).json({ error: 'Please describe your syllabus dilemma or complex question.' });
        return;
      }

      const ai = getGenAIClient();
      const systemInstruction = `You are an elite CBSE Class 10th Academic Strategist and Board Paper Examiner.
The student has an intensive schedule from Nov 21 to Nov 30, 2026 to finish their entire syllabus before December Pre-Boards.
Subjects: Maths, Science, Social Science (SST), English Communicative (Course A), Hindi Course A (Kshitij + Kritika), AI (417), and Punjabi (004).
Resources: NCERT textbooks, offline sample papers, previous 10 years solved papers (PYQs), competency workbooks for Maths/SST/Science, plus online materials for AI & Punjabi.
Current Student Progress Context:
${progressSummary || 'Starting the 10-day Pre-Board Sprint.'}

Provide rigorous, step-by-step reasoning, chapter-weightage prioritization, exact NCERT/PYQ practice actions, and high-yield exam presentation advice.`;

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt.trim(),
        config: {
          systemInstruction,
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.HIGH,
          },
        },
      });

      res.json({
        model: 'gemini-4-hydrogen',
        thinkingLevel: 'HIGH',
        text: response.text || '',
      });
    } catch (err) {
      const formatted = formatGeminiError(err);
      res.status(formatted.status).json({ error: formatted.message, hint: formatted.hint });
    }
  });

  // 3. Multi-Turn CBSE Study Mentor Chatbot (gemini-4-hydrogen default, gemini-3.1-flash-lite option — Free Tier)
  app.post('/api/ai/chat', async (req: Request, res: Response) => {
    try {
      const { messages, model, progressSummary } = req.body as {
        messages?: Array<{ role: 'user' | 'model'; text: string }>;
        model?: string;
        progressSummary?: string;
      };

      if (!Array.isArray(messages) || messages.length === 0) {
        res.status(400).json({ error: 'Message history cannot be empty.' });
        return;
      }

      const lastMessage = messages[messages.length - 1];
      if (!lastMessage || lastMessage.role !== 'user' || !lastMessage.text?.trim()) {
        res.status(400).json({ error: 'The latest message must be a non-empty user prompt.' });
        return;
      }

      const selectedModel = model && ALLOWED_CHAT_MODELS.has(model) ? model : 'gemini-4-hydrogen';
      const ai = getGenAIClient();

      const systemInstruction = `You are BoardSprint Mentor, a warm, focused, no-nonsense CBSE Class 10th Pre-Board Study Coach.
Student Profile:
- Goal: Complete full Class 10th syllabus from Nov 21 to Nov 30, 2026 for December Pre-Boards.
- 7 Subjects: Mathematics, Science, Social Science (SST), English Communicative (Course A — Code 101), Hindi Course A (Code 002 — Kshitij & Kritika), Artificial Intelligence (Code 417), and Punjabi (Code 004).
- Resources owned: NCERT textbooks, offline sample papers, previous 10 years solved papers (PYQs), competency workbooks for Maths/SST/Science, and online materials for AI, Punjabi, and any unavailable papers.
- Live Progress: ${progressSummary || 'Tracking 10-day schedule.'}

Guidelines:
- Give concrete, CBSE-aligned answers referencing NCERT exercises, competency-based questions, and 10-year PYQ patterns.
- When asked about English Course A Communicative, use the Communicative syllabus (Two Gentlemen of Verona, Mrs. Packletide's Tiger, Patol Babu, Julius Caesar, Ozymandias, etc. — NOT First Flight!).
- Keep responses clear, encouraging, and structured for quick revision.`;

      const priorHistory = messages.slice(0, -1).map((m) => ({
        role: m.role,
        parts: [{ text: m.text }],
      }));

      const chat = ai.chats.create({
        model: selectedModel,
        history: priorHistory,
        config: {
          systemInstruction,
        },
      });

      const response = await chat.sendMessage({
        message: lastMessage.text.trim(),
      });

      res.json({
        model: selectedModel,
        text: response.text || '',
      });
    } catch (err) {
      const formatted = formatGeminiError(err);
      res.status(formatted.status).json({ error: formatted.message, hint: formatted.hint });
    }
  });

  // 4. Photo / Worksheet / Doubt Analyzer (gemini-4-hydrogen Multimodal Vision — Free Tier)
  app.post('/api/ai/analyze-image', async (req: Request, res: Response) => {
    try {
      const { imageBase64, mimeType, question, subject } = req.body as {
        imageBase64?: string;
        mimeType?: string;
        question?: string;
        subject?: string;
      };

      if (!imageBase64 || !mimeType) {
        res.status(400).json({ error: 'Please upload a photo of your textbook page, worksheet, or question.' });
        return;
      }

      const ai = getGenAIClient();
      const promptText =
        question?.trim() ||
        'Read this Class 10th study photo carefully. Explain the core concept, solve any visible problems step-by-step according to CBSE board marking schemes, and highlight common mistakes to avoid.';

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType,
                data: imageBase64,
              },
            },
            {
              text: `Subject context: ${subject || 'CBSE Class 10th'}.\n${promptText}`,
            },
          ],
        },
        config: {
          systemInstruction:
            'You are a CBSE Class 10th Subject Examiner analyzing a student photo of an NCERT page, handwritten derivation, diagram, or competency workbook question. Provide an accurate, step-by-step breakdown with formulas, NCERT keywords, and exam marking-scheme checkpoints.',
        },
      });

      res.json({
        model: 'gemini-4-hydrogen',
        text: response.text || '',
      });
    } catch (err) {
      const formatted = formatGeminiError(err);
      res.status(formatted.status).json({ error: formatted.message, hint: formatted.hint });
    }
  });

  // 5. Crisp Vector SVG Study Diagram & Mind-Map Generator (gemini-4-hydrogen — Free Tier)
  app.post('/api/ai/generate-diagram', async (req: Request, res: Response) => {
    try {
      const { prompt, diagramStyle, aspectRatio, subject } = req.body as {
        prompt?: string;
        diagramStyle?: string;
        aspectRatio?: string;
        subject?: string;
      };

      if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
        res.status(400).json({ error: 'Please enter a diagram or visual mind-map topic.' });
        return;
      }

      const validStyle = diagramStyle && ALLOWED_DIAGRAM_STYLES.has(diagramStyle) ? diagramStyle : 'schematic';
      const validRatio = aspectRatio && ALLOWED_ASPECT_RATIOS.has(aspectRatio) ? aspectRatio : '16:9';
      const dims = getDiagramDimensions(validRatio);

      const ai = getGenAIClient();
      const styleInstructions: Record<string, string> = {
        schematic:
          'Create a crisp, well-labeled CBSE textbook schematic diagram with clean vector shapes, directional arrows, clear callout lines, and a compact legend.',
        mindmap:
          'Create a radial/hierarchical revision mind-map with a central topic node, color-coded subject branches, sub-nodes with concise exam keywords, and curved connector paths.',
        flowchart:
          'Create a clean step-by-step process flowchart with rounded boxes, decision diamonds where appropriate, numbered stages, and crisp directional arrowheads.',
        timeline:
          'Create a structured chronological timeline with a central horizontal or vertical spine, milestone nodes, exact dates/years, and concise exam-ready event annotations.',
      };

      const systemInstruction = `You are an expert CBSE Class 10th educational vector illustrator.
Generate a clean, self-contained, publication-grade SVG diagram for exam revision.
Strict SVG rules:
- Root element MUST be <svg xmlns="http://www.w3.org/2000/svg" viewBox="${dims.viewBox}" width="${dims.width}" height="${dims.height}">.
- Draw a soft luminous parchment background rect (#FBF6F9 or #FFFFFF) with a subtle border (#E8D7E4).
- Use an enchanted botanical & jewel-tone high-contrast academic palette: Velvet Ink (#221329) for primary labels, Arcane Amethyst (#6D28D9), Botanical Rose (#BE185D), Enchanted Emerald (#047857), Antique Gold (#B45309), and Sapphire (#1D4ED8).
- Keep all text strictly inside the viewBox with generous padding (at least 24px margins), readable font sizes (13px–22px), and zero overlapping text labels.
- Use ONLY standard SVG primitives (<rect>, <circle>, <ellipse>, <line>, <polyline>, <polygon>, <path>, <text>, <tspan>, <g>, <defs>, <marker>, <linearGradient>, <stop>).
- NEVER include <script>, <foreignObject>, <style>, external URLs, or inline event handlers.`;

      const userPrompt = `Subject: ${subject || 'CBSE Class 10th'}
Visual Format: ${validStyle} — ${styleInstructions[validStyle]}
Topic: ${prompt.trim()}
Return a crisp SVG diagram sized to viewBox="${dims.viewBox}", a concise title, a short revision caption, and 3–5 exam-scoring key points.`;

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: userPrompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: {
                type: Type.STRING,
                description: 'Short title for the study diagram.',
              },
              svgMarkup: {
                type: Type.STRING,
                description: `Complete self-contained <svg xmlns="http://www.w3.org/2000/svg" viewBox="${dims.viewBox}">...</svg> vector markup.`,
              },
              caption: {
                type: Type.STRING,
                description: 'Concise 1-2 sentence CBSE exam summary explaining the diagram.',
              },
              keyPoints: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '3 to 5 bullet points of key CBSE marking-scheme takeaways.',
              },
            },
            required: ['title', 'svgMarkup', 'caption', 'keyPoints'],
          },
        },
      });

      const rawJson = (response.text || '').trim();
      let parsed: {
        title?: string;
        svgMarkup?: string;
        caption?: string;
        keyPoints?: string[];
      };

      try {
        parsed = JSON.parse(rawJson);
      } catch {
        // Fallback if model returned raw SVG directly
        const fallbackSvg = extractAndSanitizeSvg(rawJson, dims.viewBox);
        if (!fallbackSvg) {
          res.status(502).json({
            error: 'Could not parse the generated SVG diagram. Please refine your prompt and try again.',
          });
          return;
        }
        parsed = {
          title: `${subject || 'Class 10'} Study Diagram`,
          svgMarkup: fallbackSvg,
          caption: prompt.trim(),
          keyPoints: [],
        };
      }

      const sanitizedSvg = extractAndSanitizeSvg(parsed.svgMarkup || '', dims.viewBox);
      if (!sanitizedSvg) {
        res.status(502).json({
          error: 'The model did not produce valid SVG vector markup. Please try rephrasing the diagram topic.',
        });
        return;
      }

      res.json({
        model: 'gemini-4-hydrogen',
        title: parsed.title || `${subject || 'Class 10'} Revision Diagram`,
        diagramStyle: validStyle,
        aspectRatio: validRatio,
        width: dims.width,
        height: dims.height,
        svgMarkup: sanitizedSvg,
        caption: (parsed.caption || '').trim(),
        keyPoints: Array.isArray(parsed.keyPoints)
          ? parsed.keyPoints.filter((p) => typeof p === 'string' && p.trim()).slice(0, 6)
          : [],
      });
    } catch (err) {
      const formatted = formatGeminiError(err);
      res.status(formatted.status).json({ error: formatted.message, hint: formatted.hint });
    }
  });

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`BoardSprint 10 server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
