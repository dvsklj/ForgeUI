import { describe, it, expect } from 'vitest';
import { extractManifest } from '../src/validation/index.js';

describe('extractManifest', () => {
  it('strips ```json fence', () => {
    const input = '```json\n{"manifest":"0.1.0","id":"test"}\n```';
    expect(extractManifest(input)).toBe('{"manifest":"0.1.0","id":"test"}');
  });

  it('strips bare ``` fence', () => {
    const input = '```\n{"manifest":"0.1.0","id":"test"}\n```';
    expect(extractManifest(input)).toBe('{"manifest":"0.1.0","id":"test"}');
  });

  it('returns unchanged string when no fence', () => {
    const input = '{"manifest":"0.1.0","id":"test"}';
    expect(extractManifest(input)).toBe('{"manifest":"0.1.0","id":"test"}');
  });

  it('handles fence with no trailing backticks (best-effort)', () => {
    const input = '```json\n{"manifest":"0.1.0","id":"test"}';
    // No closing fence — regex won't match, returns trimmed input
    expect(extractManifest(input)).toBe(input);
  });

  it('never throws on arbitrary input', () => {
    expect(() => extractManifest('')).not.toThrow();
    expect(() => extractManifest('just prose, no JSON here')).not.toThrow();
    expect(() => extractManifest('```')).not.toThrow();
    expect(() => extractManifest('```json')).not.toThrow();
  });

  it('trims whitespace around fence', () => {
    const input = '  \n```json\n{"a":1}\n```\n  ';
    expect(extractManifest(input)).toBe('{"a":1}');
  });

  it('trims whitespace on unfenced input', () => {
    const input = '  {"a":1}  ';
    expect(extractManifest(input)).toBe('{"a":1}');
  });
});
