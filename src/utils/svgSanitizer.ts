export interface DiagramDimensions {
  width: number;
  height: number;
  viewBox: string;
}

export function getDiagramDimensions(aspectRatio?: string): DiagramDimensions {
  switch (aspectRatio) {
    case '4:3':
      return { width: 880, height: 660, viewBox: '0 0 880 660' };
    case '1:1':
      return { width: 760, height: 760, viewBox: '0 0 760 760' };
    case '3:4':
      return { width: 660, height: 880, viewBox: '0 0 660 880' };
    case '16:9':
    default:
      return { width: 960, height: 540, viewBox: '0 0 960 540' };
  }
}

const FORBIDDEN_TAG_BLOCKS = [
  'script',
  'foreignObject',
  'iframe',
  'object',
  'embed',
  'link',
  'meta',
  'audio',
  'video',
  'style',
];

/**
 * Extracts and strictly sanitizes an SVG study diagram returned by Gemini so it
 * can be safely rendered inside an <img> Blob URL or downloaded as a standalone .svg.
 */
export function extractAndSanitizeSvg(
  raw: string,
  fallbackViewBox = '0 0 960 540'
): string | null {
  if (!raw || typeof raw !== 'string') return null;

  // Strip optional markdown code fences
  const unfenced = raw
    .replace(/```(?:svg|xml|html)?\s*/gi, '')
    .replace(/```/g, '')
    .trim();

  const match = unfenced.match(/<svg\b[\s\S]*?<\/svg>/i);
  if (!match) return null;

  let svg = match[0];

  // Remove dangerous tag blocks and self-closing dangerous tags
  for (const tag of FORBIDDEN_TAG_BLOCKS) {
    const blockRe = new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`, 'gi');
    const selfClosingRe = new RegExp(`<${tag}\\b[^>]*\\/?>`, 'gi');
    svg = svg.replace(blockRe, '').replace(selfClosingRe, '');
  }

  // Strip inline event handlers (onload, onclick, onerror, etc.)
  svg = svg.replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');

  // Block external or executable href / xlink:href / src references (allow internal #id fragment links only)
  svg = svg.replace(
    /\s+(?:xlink:)?(?:href|src)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi,
    (full, dQuoted?: string, sQuoted?: string) => {
      const val = (dQuoted ?? sQuoted ?? '').trim();
      if (val.startsWith('#')) {
        return full;
      }
      return '';
    }
  );

  // Strip javascript: or vbscript: inside any remaining attribute values
  svg = svg.replace(/(?:javascript|vbscript)\s*:/gi, '');

  // Ensure XML namespace and viewBox exist on the root <svg> element
  svg = svg.replace(/<svg\b([^>]*)>/i, (_whole, attrs: string) => {
    let nextAttrs = attrs;
    if (!/\bxmlns\s*=/i.test(nextAttrs)) {
      nextAttrs += ' xmlns="http://www.w3.org/2000/svg"';
    }
    if (!/\bviewBox\s*=/i.test(nextAttrs)) {
      nextAttrs += ` viewBox="${fallbackViewBox}"`;
    }
    return `<svg${nextAttrs}>`;
  });

  // Final check: must still open with <svg and close with </svg>
  if (!/^<svg\b[\s\S]*<\/svg>$/i.test(svg.trim())) {
    return null;
  }

  return svg.trim();
}
