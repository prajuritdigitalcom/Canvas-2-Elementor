import { ValidationIssue, ValidationResult } from '../types';

export function validateConvertedHtml(html: string, rawHtml?: string): ValidationResult {
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

  const classAttrMatches = html.match(/class=["']([^"']+)["']/gi) || [];
  for (const attr of classAttrMatches) {
    const valueMatch = attr.match(/class=["']([^"']+)["']/i);
    if (!valueMatch) continue;
    const tokens = valueMatch[1].split(/\s+/);
    const rootToken = tokens.find((t) => /^[a-zA-Z0-9]+-container-root$/i.test(t));
    if (rootToken) {
      detectedPrefix = rootToken.replace(/-container-root$/i, '').toLowerCase();
      break;
    }
  }

  if (!detectedPrefix) {
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
    const requiredPrefix = `${detectedPrefix.toLowerCase()}-`;
    scriptIds.forEach((id) => {
      if (!id.toLowerCase().startsWith(requiredPrefix)) {
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
    isJsProtected = isJsSafelyProtected(fullScriptContent);

    if (!isJsProtected) {
      issues.push({
        type: 'warning',
        code: 'JS_UNPROTECTED',
        message: 'Script JavaScript tidak menggunakan proteksi DOMContentLoaded atau pengecekan null yang jelas pada variabel hasil getElementById/querySelector.',
      });
    }
  }

  // 6. Check CSS reset (body/html margin) — pengganti Tailwind Preflight yang dihapus
  const styleBlocks = (html.match(/<style[\s\S]*?>[\s\S]*?<\/style>/gi) || []).join('\n');
  const hasBodyMarginReset =
    /html\s*,\s*body\s*\{[^}]*margin\s*:\s*0/i.test(styleBlocks) ||
    /body\s*\{[^}]*margin\s*:\s*0/i.test(styleBlocks) ||
    /\*\s*\{[^}]*margin\s*:\s*0/i.test(styleBlocks);

  if (!hasBodyMarginReset) {
    issues.push({
      type: 'error',
      code: 'MISSING_BODY_MARGIN_RESET',
      message: 'Tidak ditemukan reset "margin: 0" untuk html/body/* di <style>. Karena Tailwind Preflight dihapus, browser akan pakai margin default 8px pada <body>, menyebabkan gap terlihat di semua tepi halaman.',
    });
  }

  // 7. Check responsive prefixes conversion
  if (rawHtml) {
    const responsivePrefixesInSource = new Set(
      (rawHtml.match(/\b(sm|md|lg|xl):[a-zA-Z0-9_.\/\[\]-]+/g) || [])
    );
    const mediaQueryCount = (html.match(/@media[^{]+\{/g) || []).length;

    if (responsivePrefixesInSource.size > 0 && mediaQueryCount === 0) {
      issues.push({
        type: 'error',
        code: 'RESPONSIVE_PREFIX_DROPPED',
        message: `Source punya ${responsivePrefixesInSource.size} pola class responsif (sm:/md:/lg:/xl:), tapi hasil konversi tidak punya satupun @media block. Kemungkinan besar semua breakpoint dikonversi jadi nilai flat.`,
      });
    } else if (responsivePrefixesInSource.size > 3 && mediaQueryCount < 2) {
      issues.push({
        type: 'warning',
        code: 'RESPONSIVE_PREFIX_UNDERCONVERTED',
        message: `Source punya ${responsivePrefixesInSource.size} pola class responsif tapi hasil konversi cuma ${mediaQueryCount} @media block — kemungkinan sebagian breakpoint hilang.`,
      });
    }
  }

  // 8. Check for conflicts between inline style and @media responsive classes
  const RESPONSIVE_LAYOUT_PROPS = [
    'display',
    'grid-template-columns',
    'grid-template-rows',
    'flex-direction',
    'text-align',
    'justify-content',
    'align-items',
    'gap',
    'grid-column',
    'grid-row',
    'flex-wrap',
    'flex',
  ];

  const mediaBlocks = html.match(/@media[^{]+\{[\s\S]*?(?:\}\s*\}|\}(?=\s*@media|\s*<\/style>|$))/gi) || [];
  const responsiveClassProps = new Map<string, Set<string>>();

  mediaBlocks.forEach((block) => {
    const ruleMatches = Array.from(block.matchAll(/\.([a-zA-Z0-9_-]+)\s*\{([^}]*)\}/g));
    ruleMatches.forEach(([, className, body]) => {
      RESPONSIVE_LAYOUT_PROPS.forEach((prop) => {
        if (new RegExp(`\\b${prop}\\s*:`, 'i').test(body)) {
          if (!responsiveClassProps.has(className)) responsiveClassProps.set(className, new Set());
          responsiveClassProps.get(className)!.add(prop);
        }
      });
    });
  });

  if (responsiveClassProps.size > 0) {
    const tagMatches = html.match(/<[a-z][a-z0-9]*\b[^>]*>/gi) || [];
    const conflicts: string[] = [];

    tagMatches.forEach((tag) => {
      const classAttrMatch = tag.match(/\bclass=["']([^"']+)["']/i);
      const styleAttrMatch = tag.match(/\bstyle=["']([^"']+)["']/i);

      if (classAttrMatch && styleAttrMatch) {
        const classNames = classAttrMatch[1].trim().split(/\s+/);
        const styleAttr = styleAttrMatch[1];

        classNames.forEach((cls) => {
          const respProps = responsiveClassProps.get(cls);
          if (!respProps) return;
          respProps.forEach((prop) => {
            if (new RegExp(`\\b${prop}\\s*:`, 'i').test(styleAttr)) {
              conflicts.push(`.${cls} (property "${prop}")`);
            }
          });
        });
      }
    });

    if (conflicts.length > 0) {
      const uniqueConflicts = Array.from(new Set(conflicts));
      issues.push({
        type: 'error',
        code: 'INLINE_STYLE_OVERRIDES_MEDIA_QUERY',
        message: `Ditemukan ${uniqueConflicts.length} elemen dengan inline style yang property-nya bentrok dengan override responsif di class yang sama — override di @media TIDAK AKAN PERNAH berlaku karena inline style selalu menang: ${uniqueConflicts.slice(0, 5).join(', ')}${uniqueConflicts.length > 5 ? ', ...' : ''}`,
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

function isJsSafelyProtected(scriptContent: string): boolean {
  // Pendekatan A: seluruh pemanggilan DOM lookup terjadi SETELAH listener DOMContentLoaded dibuka.
  const domReadyMatch = scriptContent.match(/document\.addEventListener\s*\(\s*['"]DOMContentLoaded['"]/i);
  if (domReadyMatch && domReadyMatch.index !== undefined) {
    const beforeListener = scriptContent.slice(0, domReadyMatch.index);
    const hasLookupBeforeListener = /getElementById\s*\(|querySelector(?:All)?\s*\(/.test(beforeListener);
    if (!hasLookupBeforeListener) return true;
  }

  // Pendekatan B: setiap variabel hasil getElementById/querySelector dijaga null-check sebelum dipakai.
  const assignMatches = Array.from(
    scriptContent.matchAll(
      /(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*(?:document\.)?(?:getElementById|querySelector(?:All)?)\s*\(/g
    )
  );

  if (assignMatches.length === 0) {
    // Tidak ada pola assignment langsung yang bisa dianalisis — jangan asal loloskan.
    return false;
  }

  return assignMatches.every(([, varName]) => {
    const guarded = new RegExp(`if\\s*\\(\\s*${varName}\\s*(?:\\)|!==?\\s*null\\s*\\)|&&)`).test(scriptContent);
    const optionalChained = new RegExp(`${varName}\\?\\.`).test(scriptContent);
    return guarded || optionalChained;
  });
}

