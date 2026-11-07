const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  '\'': '&#39;'
}

/**
 * Escapes a value for safe interpolation into HTML (text content and quoted attributes).
 */
export const escapeHtml = (value: string): string => value.replace(/[&<>"']/g, char => HTML_ESCAPES[char]!)
