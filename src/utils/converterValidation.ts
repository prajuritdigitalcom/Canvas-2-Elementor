import { ValidationIssue, ValidationResult } from '../types';

export function validateConvertedHtml(html: string): ValidationResult {
  const issues: ValidationIssue[] = [];

  // 1. Check Document Structure
  const hasDoctype = /<!DOCTYPE\s+html/i.test(html);
  const hasHtml = /<html[\s>]/i.test(html) && /<\/html>/i.test(html);
  const hasHead = /<head[\s>]/i.test(html) && /<\/head>/i.test(html);
  const hasBody = /<body[\s>]/i.test(html) && /<\/body>/i.test(html);

  const isValidDocStructure = hasDoctype && hasHtml && hasHead && hasBody;
  if (!isValidDocStructure) {
    issues.push({
      type: 'warning',
      code: 'DOC_STRUCTURE',
      message: 'Struktur dokumen HTML utuh tidak lengkap (<!DOCTYPE>, <html>, <head>, atau <body> tidak ditemukan).',
    });
  }

  // 2. Check Tailwind CDN & Config Removal
  const isTailwindCdnRemoved = !html.includes('cdn.tailwindcss.com');
  if (!isTailwindCdnRemoved) {
    issues.push({
      type: 'error',
      code: 'TAILWIND_CDN_PRESENT',
      message: 'Script Tailwind CDN ("cdn.tailwindcss.com") masih ditemukan di output.',
    });
  }

  const isTailwindConfigRemoved = !/tailwind\.config\s*=/i.test(html);
  if (!isTailwindConfigRemoved) {
    issues.push({
      type: 'error',
      code: 'TAILWIND_CONFIG_PRESENT',
      message: 'Konfigurasi tailwind.config masih ditemukan di output.',
    });
  }

  // 3. Detect Prefix
  // Look for root container class "{prefix}-container-root" or common CSS class prefixes
  let detectedPrefix: string | null = null;
  const rootMatch = html.match(/class=["']([a-zA-Z0-9]+)-container-root["']/i);
  if (rootMatch && rootMatch[1]) {
    detectedPrefix = rootMatch[1].toLowerCase();
  } else {
    // Fallback: look for repeated class prefixes in style block like .wn2-nav or .psp-btn
    const classPrefixMatch = html.match(/\.([a-z0-9]{2,5})-[a-z0-9-_]+\s*\{/gi);
    if (classPrefixMatch && classPrefixMatch.length > 0) {
      const counts: Record<string, number> = {};
      classPrefixMatch.forEach((m) => {
        const prefix = m.substring(1, m.indexOf('-')).toLowerCase();
        counts[prefix] = (counts[prefix] || 0) + 1;
      });
      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
      if (sorted[0]) {
        detectedPrefix = sorted[0][0];
      }
    }
  }

  // 4. Scan IDs and check for prefix consistency
  const unprefixedIds: string[] = [];
  const scriptBlocks = html.match(/<script[\s\S]*?>[\s\S]*?<\/script>/gi) || [];
  const fullScriptContent = scriptBlocks.join('\n');

  // Find all getElementById or querySelector calls in JS
  const getElemMatches = Array.from(
    fullScriptContent.matchAll(/getElementById\s*\(\s*['"]([^'"]+)['"]\s*\)/g)
  );
  const queryMatches = Array.from(
    fullScriptContent.matchAll(/querySelector(?:All)?\s*\(\s*['"]#([^'"]+)['"]\s*\)/g)
  );

  const scriptIds = new Set<string>();
  getElemMatches.forEach((m) => scriptIds.add(m[1]));
  queryMatches.forEach((m) => scriptIds.add(m[1]));

  if (detectedPrefix) {
    const prefix = detectedPrefix.toLowerCase();
    scriptIds.forEach((id) => {
      if (!id.toLowerCase().startsWith(`${prefix}-`) && !id.toLowerCase().startsWith(prefix)) {
        unprefixedIds.push(id);
      }
    });
  }

  if (unprefixedIds.length > 0) {
    issues.push({
      type: 'warning',
      code: 'UNPREFIXED_IDS',
      message: `Ditemukan ${unprefixedIds.length} ID di JavaScript yang belum diberi prefix "${detectedPrefix || 'brand'}":`,
      details: unprefixedIds,
    });
  }

  // 5. Check JS Safety Protection (DOMContentLoaded or null-check)
  let isJsProtected = true;
  if (scriptBlocks.length > 0 && scriptIds.size > 0) {
    const hasDomContentLoaded = /DOMContentLoaded/i.test(fullScriptContent);
    const hasNullCheck = /if\s*\(\s*[a-zA-Z0-9_$]+\s*\)/i.test(fullScriptContent);
    isJsProtected = hasDomContentLoaded || hasNullCheck;

    if (!isJsProtected) {
      issues.push({
        type: 'warning',
        code: 'JS_UNPROTECTED',
        message: 'Script JavaScript tidak menggunakan proteksi DOMContentLoaded atau pengecekan null (if elem), berpotensi error jika widget dimuat secara dinamis.',
      });
    }
  }

  return {
    isValidDocStructure,
    isTailwindCdnRemoved,
    isTailwindConfigRemoved,
    detectedPrefix,
    unprefixedIds,
    isJsProtected,
    issues,
  };
}

export function maskApiKey(key: string): string {
  if (!key || key.length < 8) return '****';
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
}

export function parseKeysFromText(rawText: string): string[] {
  if (!rawText) return [];
  return rawText
    .split(/[\n,]+/)
    .map((k) => k.trim())
    .filter((k) => k.length > 0 && !k.startsWith('#'));
}
