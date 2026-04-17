import { describe, it, expect } from 'vitest';
import { isStateRef, isComputedRef, isItemRef, isRef } from '../src/types/index.js';

describe('Type guards', () => {
  describe('isStateRef', () => {
    it('returns true for $state: prefixed strings', () => {
      expect(isStateRef('$state:name')).toBe(true);
      expect(isStateRef('$state:users/u1/name')).toBe(true);
      expect(isStateRef('$state:counter')).toBe(true);
    });

    it('returns false for non-state refs', () => {
      expect(isStateRef('$computed:count:users')).toBe(false);
      expect(isStateRef('$item:name')).toBe(false);
      expect(isStateRef('plain string')).toBe(false);
      expect(isStateRef(42)).toBe(false);
      expect(isStateRef(null)).toBe(false);
      expect(isStateRef(undefined)).toBe(false);
    });
  });

  describe('isComputedRef', () => {
    it('returns true for $computed: prefixed strings', () => {
      expect(isComputedRef('$computed:count:users')).toBe(true);
      expect(isComputedRef('$computed:sum:users/age')).toBe(true);
    });

    it('returns false for non-computed refs', () => {
      expect(isComputedRef('$state:name')).toBe(false);
      expect(isComputedRef('$item:name')).toBe(false);
      expect(isComputedRef('hello')).toBe(false);
    });
  });

  describe('isItemRef', () => {
    it('returns true for $item: prefixed strings', () => {
      expect(isItemRef('$item:name')).toBe(true);
      expect(isItemRef('$item:user.email')).toBe(true);
    });

    it('returns false for non-item refs', () => {
      expect(isItemRef('$state:name')).toBe(false);
      expect(isItemRef('$computed:count:x')).toBe(false);
      expect(isItemRef('name')).toBe(false);
    });
  });

  describe('isRef', () => {
    it('returns true for any reference type', () => {
      expect(isRef('$state:name')).toBe(true);
      expect(isRef('$computed:count:users')).toBe(true);
      expect(isRef('$item:name')).toBe(true);
    });

    it('returns false for plain values', () => {
      expect(isRef('hello')).toBe(false);
      expect(isRef(42)).toBe(false);
      expect(isRef(true)).toBe(false);
      expect(isRef(null)).toBe(false);
    });
  });
});