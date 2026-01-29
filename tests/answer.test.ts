import { describe, expect, it } from "bun:test";
import { isAnswerCorrect, normalizeAnswerToNumber } from "../src/lib/answer";

describe("normalizeAnswerToNumber", () => {
  it("parses numbers and decimals", () => {
    expect(normalizeAnswerToNumber("42")).toBe(42);
    expect(normalizeAnswerToNumber("3.14")).toBeCloseTo(3.14);
    expect(normalizeAnswerToNumber("3,5")).toBeCloseTo(3.5);
  });

  it("parses fractions", () => {
    expect(normalizeAnswerToNumber("1/2")).toBeCloseTo(0.5);
    expect(normalizeAnswerToNumber("-3/4")).toBeCloseTo(-0.75);
  });

  it("parses latex fractions", () => {
    expect(normalizeAnswerToNumber("\\frac{1}{2}")).toBeCloseTo(0.5);
    expect(normalizeAnswerToNumber("\\frac{-3}{4}")).toBeCloseTo(-0.75);
  });
});

describe("isAnswerCorrect", () => {
  it("accepts numeric equivalence", () => {
    expect(isAnswerCorrect(0.5, "1/2")).toBe(true);
    expect(isAnswerCorrect(2, "2")).toBe(true);
  });

  it("uses tolerance for floats", () => {
    expect(isAnswerCorrect(0.3, "0.3000000001")).toBe(true);
  });

  it("falls back to string compare", () => {
    expect(isAnswerCorrect("x+1", "x+1")).toBe(true);
    expect(isAnswerCorrect("x+1", "x+2")).toBe(false);
  });
});
