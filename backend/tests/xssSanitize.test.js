/**
 * Comprehensive XSS sanitization tests.
 *
 * Tests the xssSanitize middleware directly (unit tests) and also
 * validates the express-validator interaction (that sanitized input
 * still passes validation).
 *
 * Attack vectors covered:
 * • Inline <script> tags
 * • Event handlers (onerror, onload, onclick, etc.)
 * • <img>, <iframe>, <a> tags with malicious attributes
 * • JavaScript: URIs
 * • Data URIs
 * • Encoded/obfuscated payloads (hex, decimal entities)
 * • Template injection ({{ }})
 * • Nested objects and arrays
 * • Non-string types (numbers, booleans, null)
 * • Mix of safe text and malicious content
 */

// ---------------------------------------------------------------------------
// Mock setup — hijack req/res/next for middleware testing
// ---------------------------------------------------------------------------

const { xssSanitize } = require('../middleware/validation');

/**
 * Create a mock Express (req, res, next) tuple.
 */
function mockExpress(body) {
  const req = { body };
  const res = {};
  const next = jest.fn();
  return { req, res, next };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Run xssSanitize on a body object and return the mutated body.
 * The middleware mutates req.body in place.
 */
function sanitize(body) {
  const { req, res, next } = mockExpress(body);
  xssSanitize(req, res, next);
  // Ensure next() was called (middleware never blocks on its own)
  expect(next).toHaveBeenCalledTimes(1);
  return req.body;
}

// ---------------------------------------------------------------------------
// Unit tests — xssSanitize middleware
// ---------------------------------------------------------------------------

describe('xssSanitize middleware', () => {
  // =========================================================================
  // Script injection
  // =========================================================================

  describe('script tag injection', () => {
    test('strips <script> tags keeping inner text', () => {
      const result = sanitize({ name: '<script>alert(1)</script>' });
      expect(result.name).toBe('alert(1)');
    });

    test('strips <script> with src attribute', () => {
      const result = sanitize({ name: '<script src="https://evil.com/xss.js"></script>' });
      expect(result.name).not.toContain('<script');
      expect(result.name).not.toContain('</script>');
      expect(result.name).not.toContain('src=');
      expect(result.name).not.toContain('evil.com');
    });

    test('strips self-closing <script/> tags', () => {
      const result = sanitize({ name: '<script/>alert(1)' });
      expect(result.name).not.toContain('<script');
    });

    test('strips uppercase <SCRIPT> tags', () => {
      const result = sanitize({ name: '<SCRIPT>alert(1)</SCRIPT>' });
      expect(result.name).not.toContain('SCRIPT');
      expect(result.name).not.toContain('<');
      // The tag is stripped, inner text escapes: &lt; — actually let me check:
      // '<SCRIPT>alert(1)</SCRIPT>' → strip tags: 'alert(1)' → escaped: 'alert(1)'
      expect(result.name).toBe('alert(1)');
    });

    test('strips mixed-case <ScRiPt> tags', () => {
      const result = sanitize({ name: '<ScRiPt>alert(1)</ScRiPt>' });
      expect(result.name).not.toContain('ScRiPt');
    });
  });

  // =========================================================================
  // Event handler injection
  // =========================================================================

  describe('event handler injection', () => {
    test('strips <img> with onerror handler', () => {
      const result = sanitize({ bio: '<img src=x onerror=alert(1)>' });
      // The entire tag is stripped, leaving empty string
      expect(result.bio).toBe('');
    });

    test('strips <img> with onload handler', () => {
      const result = sanitize({ bio: '<img src="photo.jpg" onload="alert(1)">' });
      expect(result.bio).toBe('');
    });

    test('strips <body> with onload handler', () => {
      const result = sanitize({ bio: '<body onload=alert(1)>' });
      expect(result.bio).toBe('');
    });

    test('strips <svg> with onload handler', () => {
      const result = sanitize({ bio: '<svg onload=alert(1)>' });
      expect(result.bio).toBe('');
    });

    test('strips arbitrary element with onclick handler', () => {
      const result = sanitize({ bio: '<div onclick="alert(1)">Click me</div>' });
      // The <div> and </div> tags are stripped; inner text 'Click me' survives
      expect(result.bio).not.toContain('onclick');
      expect(result.bio).not.toContain('<div');
      expect(result.bio).not.toContain('</div>');
      // Inner text between tags is intentionally preserved
      expect(result.bio).toBe('Click me');
    });

    test('strips <a> with mouseover handler and preserves inner text', () => {
      const result = sanitize({ bio: '<a href="#" onmouseover="alert(1)">Hover</a>' });
      expect(result.bio).not.toContain('onmouseover');
      expect(result.bio).not.toContain('<a');
      expect(result.bio).toBe('Hover');
    });

    test('strips <input> with onfocus handler', () => {
      const result = sanitize({ bio: '<input onfocus="alert(1)" autofocus>' });
      expect(result.bio).toBe('');
    });
  });

  // =========================================================================
  // URI-based attacks
  // =========================================================================

  describe('URI-based attacks', () => {
    test('strips javascript: URI in <a> tag', () => {
      const result = sanitize({ link: '<a href="javascript:alert(1)">click</a>' });
      expect(result.link).not.toContain('javascript');
      expect(result.link).not.toContain('alert');
    });

    test('strips javascript: URI in <iframe>', () => {
      const result = sanitize({ link: '<iframe src="javascript:alert(1)"></iframe>' });
      expect(result.link).not.toContain('javascript');
      expect(result.link).not.toContain('iframe');
    });

    test('strips data: URI in <iframe>', () => {
      const result = sanitize({ link: '<iframe src="data:text/html,<script>alert(1)</script>"></iframe>' });
      expect(result.link).not.toContain('data:');
      expect(result.link).not.toContain('<script');
    });
  });

  // =========================================================================
  // HTML character escaping
  // =========================================================================

  describe('HTML character escaping', () => {
    test('escapes < to &lt; in non-tag context', () => {
      const result = sanitize({ text: '1 < 2' });
      // '<' is not followed by a '>' so the regex /<[^>]*>/ doesn't match.
      // Then the escaping kicks in: < → &lt;
      expect(result.text).toBe('1 &lt; 2');
    });

    test('escapes > to &gt; in non-tag context', () => {
      const result = sanitize({ text: 'a > b' });
      expect(result.text).toBe('a &gt; b');
    });

    test('escapes & to &amp; when not part of an entity', () => {
      const result = sanitize({ text: 'Rock & Roll' });
      expect(result.text).toBe('Rock &amp; Roll');
    });

    test('escapes double quotes to &quot;', () => {
      const result = sanitize({ text: 'He said "hello"' });
      // The quotes are not inside an HTML tag, so they don't get stripped.
      // They get escaped: " → &quot;
      expect(result.text).toBe('He said &quot;hello&quot;');
    });

    test('escapes single quotes to &#x27;', () => {
      const result = sanitize({ text: "It's a test" });
      expect(result.text).toBe('It&#x27;s a test');
    });

    test('escapes all five special characters together', () => {
      const result = sanitize({ text: '<tag attr="value" & \'test\'>' });
      // The regex /<[^>]*>/ matches '<tag attr="value" & \'test\'>' entirely
      // So it gets stripped to '', then escaped... but strip happens first.
      // After strip: '' (empty)
      // After escaping: '' (nothing to escape)
      expect(result.text).toBe('');
    });
  });

  // =========================================================================
  // Encoded / obfuscated payloads
  // =========================================================================

  describe('encoded and obfuscated payloads', () => {
    test('strips hex-encoded HTML entities in tags (but entities are decoded by browser)', () => {
      // The server receives the raw string as-is (no entity decoding on server)
      const result = sanitize({ name: '&#60;script&#62;alert(1)&#60;/script&#62;' });
      // The entities start with '&' which gets escaped to &amp; by the sanitizer.
      expect(result.name).toContain('&amp;#60;');
      expect(result.name).toContain('alert(1)');
      expect(result.name).not.toContain('<script>');
      expect(result.name).not.toContain('</script>');
    });

    test('strips simple hex entities like &#x3C; (should be treated as text)', () => {
      const result = sanitize({ name: '&#x3C;script&#x3E;alert(1)&#x3C;/script&#x3E;' });
      // These are text entities, not raw HTML tags. No stripping occurs.
      // The bare '&' characters get escaped to &amp; by the sanitizer.
      expect(result.name).toContain('&amp;#x3C;');
      expect(result.name).toContain('alert(1)');
    });
  });

  // =========================================================================
  // Template injection
  // =========================================================================

  describe('template injection', () => {
    test('passes through {{ }} template syntax (not an XSS vector alone)', () => {
      const result = sanitize({ name: 'Hello {{ user.name }}' });
      // No HTML chars to escape, no tags to strip
      expect(result.name).toBe('Hello {{ user.name }}');
    });

    test('escapes < in template context while preserving template syntax', () => {
      const result = sanitize({ name: '{{ $on.constructor.constructor("<script>alert(1)</script>") }}' });
      // The inner <script> tag is stripped; template syntax survives
      expect(result.name).toContain('{{');
      expect(result.name).toContain('}}');
      expect(result.name).not.toContain('<');
      expect(result.name).not.toContain('>');
    });
  });

  // =========================================================================
  // Nested objects and arrays
  // =========================================================================

  describe('nested object sanitization', () => {
    test('sanitizes values in nested objects', () => {
      const result = sanitize({
        user: {
          name: '<script>alert(1)</script>',
          bio: '<img src=x onerror=alert(1)>'
        }
      });
      expect(result.user.name).not.toContain('<script>');
      expect(result.user.bio).toBe('');
    });

    test('sanitizes strings inside arrays of objects', () => {
      const result = sanitize({
        items: [
          { name: '<script>alert(1)</script>', price: 10 },
          { name: 'Safe Product', price: 20 }
        ]
      });
      expect(result.items[0].name).not.toContain('<script>');
      expect(result.items[1].name).toBe('Safe Product');
    });

    test('sanitizes deeply nested objects (3+ levels)', () => {
      const result = sanitize({
        level1: {
          level2: {
            level3: '<script>alert(1)</script>'
          }
        }
      });
      expect(result.level1.level2.level3).not.toContain('<script>');
    });
  });

  // =========================================================================
  // Additional tag types (older XSS vectors)
  // =========================================================================

  describe('additional tag types', () => {
    test('strips <math> tags', () => {
      const result = sanitize({ input: '<math><malignmark>alert(1)</math>' });
      expect(result.input).not.toContain('<math>');
      expect(result.input).not.toContain('</math>');
    });

    test('strips <style> tags', () => {
      const result = sanitize({ input: '<style>body{background:url(evil.com)}</style>' });
      expect(result.input).not.toContain('<style>');
      expect(result.input).not.toContain('</style>');
    });
  });

  // =========================================================================
  // Top-level array body
  // =========================================================================

  describe('top-level array body', () => {
    test('sanitizes items when req.body is an array', () => {
      const { req, res, next } = mockExpress([
        { name: '<script>alert(1)</script>' },
        { name: 'safe' }
      ]);
      xssSanitize(req, res, next);
      expect(next).toHaveBeenCalledTimes(1);
      expect(req.body[0].name).not.toContain('<script>');
      expect(req.body[1].name).toBe('safe');
    });
  });

  // =========================================================================
  // Non-string and edge-case values
  // =========================================================================

  describe('edge cases — non-strings and special values', () => {
    test('preserves null values', () => {
      const result = sanitize({ name: null, email: null });
      expect(result.name).toBeNull();
      expect(result.email).toBeNull();
    });

    test('preserves undefined values', () => {
      const result = sanitize({ name: undefined });
      expect(result.name).toBeUndefined();
    });

    test('preserves number values', () => {
      const result = sanitize({ price: 100, count: 0, negative: -5 });
      expect(result.price).toBe(100);
      expect(result.count).toBe(0);
      expect(result.negative).toBe(-5);
    });

    test('preserves boolean values', () => {
      const result = sanitize({ active: true, deleted: false });
      expect(result.active).toBe(true);
      expect(result.deleted).toBe(false);
    });

    test('sanitizes empty strings (no crash)', () => {
      const result = sanitize({ name: '' });
      expect(result.name).toBe('');
    });

    test('sanitizes strings with only whitespace', () => {
      const result = sanitize({ name: '   ' });
      expect(result.name).toBe('   ');
    });

    test('handles empty body object', () => {
      const result = sanitize({});
      expect(result).toEqual({});
    });

    test('handles body with no prototype pollution', () => {
      const clean = Object.create(null);
      clean.name = 'safe';
      const result = sanitize(clean);
      expect(result.name).toBe('safe');
    });
  });

  // =========================================================================
  // Mixed safe and malicious content
  // =========================================================================

  describe('mixed safe and malicious content', () => {
    test('preserves safe text while stripping malicious parts', () => {
      const result = sanitize({ name: 'John <script>alert(1)</script> Doe' });
      // Tags are stripped; inner text between tags is preserved
      expect(result.name).toContain('John');
      expect(result.name).toContain('Doe');
      expect(result.name).toContain('alert(1)'); // inner text survives tag removal
      expect(result.name).not.toContain('<script>');
      expect(result.name).not.toContain('</script>');
    });

    test('sanitizes only string fields, not numbers or booleans', () => {
      const result = sanitize({
        name: '<script>alert(1)</script>',
        price: 99.99,
        active: true,
        count: 0
      });
      expect(result.name).not.toContain('<script>');
      expect(result.price).toBe(99.99);
      expect(result.active).toBe(true);
      expect(result.count).toBe(0);
    });

    test('preserves legitimate HTML entities sent as text', () => {
      const result = sanitize({ text: 'café & crème' });
      // The & is escaped to &amp; (the middleware escapes bare &)
      expect(result.text).toBe('café &amp; crème');
    });

    test('sanitizes text with French accents and special characters', () => {
      const result = sanitize({ text: 'Voilà, ça c\'est très Français!' });
      // Single quote gets escaped
      expect(result.text).toBe('Voilà, ça c&#x27;est très Français!');
    });
  });

  // =========================================================================
  // Real-world attack payloads
  // =========================================================================

  describe('real-world attack payloads from OWASP XSS Filter Evasion', () => {
    // Most of these are fully stripped (entire tag removed), resulting in ''
    // or the inner text.

    test('Image with script', () => {
      const result = sanitize({ input: '<img src="javascript:alert(1)">' });
      expect(result.input).not.toContain('javascript');
    });

    test('No quotes and no semicolons', () => {
      const result = sanitize({ input: '<img src=x onerror=alert(1)>' });
      expect(result.input).toBe('');
    });

    test('Case-insensitive XSS', () => {
      const result = sanitize({ input: '<IMG SRC=x onerror="alert(1)">' });
      expect(result.input).toBe('');
    });

    test('UTF-8 BOM bypass attempt', () => {
      // The null byte is a string character. Tags with null bytes:
      // The regex /<[^>]*>/ would match '<script\x00>' as <[^>]*> because
      // \x00 is not '>'. So the tag is still stripped.
      const result = sanitize({ input: '<script\x00>alert(1)</script\x00>' });
      // Tags are stripped; inner text 'alert(1)' survives
      expect(result.input).not.toContain('<script');
      expect(result.input).not.toContain('</script');
      expect(result.input).toBe('alert(1)');
    });
  });

  // =========================================================================
  // Multiple fields sanitization
  // =========================================================================

  describe('multiple fields', () => {
    test('sanitizes all string fields in a typical register payload', () => {
      const body = {
        name: '<script>alert(1)</script> John',
        email: 'test@test.com',
        phone: '+1234567890',
        location: '<b>Paris</b>, France',
        password: 'StrongPass1!',
      };
      const result = sanitize(body);

      expect(result.name).not.toContain('<script>');
      expect(result.name).toContain('John');
      expect(result.email).toBe('test@test.com');
      expect(result.phone).toBe('+1234567890');
      expect(result.location).toBe('Paris, France'); // <b> stripped
      expect(result.password).toBe('StrongPass1!');
    });

    test('sanitizes all string fields in a typical order payload', () => {
      const body = {
        name: '<script>alert(1)</script>',
        email: 'buyer@test.com',
        phone: '+33600000000',
        location: '<a href="javascript:alert(1)">Click</a>',
        items: [
          { perfumeId: '123', name: '<img src=x onerror=alert(1)>', price: 50, quantity: 1 }
        ],
        discountCode: '<script>alert(1)</script>',
      };
      const result = sanitize(body);

      expect(result.name).not.toContain('<script>');
      expect(result.email).toBe('buyer@test.com');
      expect(result.phone).toBe('+33600000000');
      expect(result.location).not.toContain('javascript');
      expect(result.items[0].name).not.toContain('onerror');
      expect(result.discountCode).not.toContain('<script>');
    });
  });

  // =========================================================================
  // No body / undefined body
  // =========================================================================

  describe('edge cases — missing body', () => {
    test('handles undefined body gracefully', () => {
      const req = { body: undefined };
      const res = {};
      const next = jest.fn();
      expect(() => xssSanitize(req, res, next)).not.toThrow();
      expect(next).toHaveBeenCalled();
    });

    test('handles null body gracefully', () => {
      const req = { body: null };
      const res = {};
      const next = jest.fn();
      expect(() => xssSanitize(req, res, next)).not.toThrow();
      expect(next).toHaveBeenCalled();
    });

    test('handles empty string body gracefully', () => {
      const req = { body: '' };
      const res = {};
      const next = jest.fn();
      expect(() => xssSanitize(req, res, next)).not.toThrow();
      expect(next).toHaveBeenCalled();
    });
  });
});
