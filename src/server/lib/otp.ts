import { createHmac, randomBytes } from "crypto";

export function generateOtp(): string {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  return code;
}

export function hashOtp(code: string, salt: string): string {
  return createHmac("sha256", salt).update(code).digest("hex");
}

export function generateSalt(): string {
  return randomBytes(16).toString("hex");
}

export function verifyOtp(code: string, salt: string, hash: string): boolean {
  const computed = hashOtp(code, salt);
  return computed === hash;
}
