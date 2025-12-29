import { describe, test, expect } from 'bun:test';
import { matchmakerInputSchema, personInputSchema } from '../../src/lib/validators';

describe('Validators', () => {
  describe('matchmakerInputSchema', () => {
    test('should accept valid matchmaker input', () => {
      let validInput = { name: 'Alice Johnson' };
      let result = matchmakerInputSchema.safeParse(validInput);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Alice Johnson');
      }
    });

    test('should reject empty name', () => {
      let invalidInput = { name: '' };
      let result = matchmakerInputSchema.safeParse(invalidInput);

      expect(result.success).toBe(false);
    });

    test('should reject missing name', () => {
      let invalidInput = {};
      let result = matchmakerInputSchema.safeParse(invalidInput);

      expect(result.success).toBe(false);
    });

    test('should reject invalid types', () => {
      let invalidInput = { name: 123 };
      let result = matchmakerInputSchema.safeParse(invalidInput);

      expect(result.success).toBe(false);
    });
  });

  describe('personInputSchema', () => {
    test('should accept valid person input', () => {
      let validInput = {
        name: 'Bob Smith',
        matchmakerId: '123e4567-e89b-42d3-a456-426614174000',
      };
      let result = personInputSchema.safeParse(validInput);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Bob Smith');
        expect(result.data.matchmakerId).toBe('123e4567-e89b-42d3-a456-426614174000');
      }
    });

    test('should reject empty name', () => {
      let invalidInput = {
        name: '',
        matchmakerId: '123e4567-e89b-42d3-a456-426614174000',
      };
      let result = personInputSchema.safeParse(invalidInput);

      expect(result.success).toBe(false);
    });

    test('should reject invalid UUID', () => {
      let invalidInput = {
        name: 'Bob Smith',
        matchmakerId: 'not-a-uuid',
      };
      let result = personInputSchema.safeParse(invalidInput);

      expect(result.success).toBe(false);
    });

    test('should reject missing fields', () => {
      let invalidInput = { name: 'Bob' };
      let result = personInputSchema.safeParse(invalidInput);

      expect(result.success).toBe(false);
    });

    test('should reject invalid types', () => {
      let invalidInput = {
        name: 123,
        matchmakerId: '123e4567-e89b-42d3-a456-426614174000',
      };
      let result = personInputSchema.safeParse(invalidInput);

      expect(result.success).toBe(false);
    });
  });
});
