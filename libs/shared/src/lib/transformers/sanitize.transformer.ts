import { Transform } from 'class-transformer';

// Use require for sanitize-html to avoid import issues
const sanitizeHtml = require('sanitize-html');

interface SanitizeOptions {
  allowedTags?: string[];
  allowedAttributes?: Record<string, string[]>;
  disallowedTagsMode?: 'discard' | 'escape';
  allowedSchemes?: string[];
}

const defaultOptions: SanitizeOptions = {
  allowedTags: [], // No HTML tags allowed
  allowedAttributes: {}, // No HTML attributes allowed
  disallowedTagsMode: 'discard',
  allowedSchemes: ['http', 'https', 'ftp', 'mailto', 'tel']
};

export function Sanitize(options: SanitizeOptions = defaultOptions) {
  return Transform(({ value }) => {
    if (typeof value !== 'string') {
      return value;
    }
    return sanitizeHtml(value, options);
  });
}
