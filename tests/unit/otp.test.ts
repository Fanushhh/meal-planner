import { describe, it, expect } from "vitest";
import { generateOtp, generateSalt, hashOtp, verifyOtp } from "@/server/lib/otp";

describe("OTP", () => {
  it("generates a 6-digit code", () => {
    const code = generateOtp();
    expect(code).toMatch(/^\d{6}$/);
  });

  it("generates codes in range 100000-999999", () => {
    for (let i = 0; i < 20; i++) {
      const n = parseInt(generateOtp(), 10);
      expect(n).toBeGreaterThanOrEqual(100000);
      expect(n).toBeLessThanOrEqual(999999);
    }
  });

  it("hashes code with salt deterministically", () => {
    const salt = generateSalt();
    const hash1 = hashOtp("123456", salt);
    const hash2 = hashOtp("123456", salt);
    expect(hash1).toBe(hash2);
  });

  it("different salts produce different hashes", () => {
    const hash1 = hashOtp("123456", generateSalt());
    const hash2 = hashOtp("123456", generateSalt());
    expect(hash1).not.toBe(hash2);
  });

  it("verifies correct code", () => {
    const code = "123456";
    const salt = generateSalt();
    const hash = hashOtp(code, salt);
    expect(verifyOtp(code, salt, hash)).toBe(true);
  });

  it("rejects wrong code", () => {
    const salt = generateSalt();
    const hash = hashOtp("123456", salt);
    expect(verifyOtp("654321", salt, hash)).toBe(false);
  });
});
