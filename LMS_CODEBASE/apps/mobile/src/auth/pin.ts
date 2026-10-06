/* ============================================================
   App lock PIN (PLANNING/08 A2 security): a 4-6 digit PIN gates
   cold starts. Stored as a salted hash — never the PIN itself.
   Biometric unlock joins at the native (EAS) build via
   expo-local-authentication; this module is the pure-JS core so
   the policy is unit-testable today.
   ============================================================ */
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "ulms.pin.hash";
const SALT_KEY = "ulms.pin.salt";

export function isValidPin(candidate: string): boolean {
  return /^\d{4,6}$/.test(candidate);
}

/** Salted SHA-like digest — FNV-1a rounds; upgraded to a real hash with the
 *  native crypto module at the EAS build (same storage contract). */
function digest(pin: string, salt: string): string {
  let h1 = 0x811c9dc5, h2 = 0x01000193;
  const input = salt + ":" + pin;
  for (let r = 0; r < 64; r++) {
    for (let i = 0; i < input.length; i++) {
      h1 ^= input.charCodeAt(i) + r;
      h1 = Math.imul(h1, 0x01000193) >>> 0;
      h2 ^= (h1 + i) >>> 3;
      h2 = Math.imul(h2, 0x85ebca6b) >>> 0;
    }
  }
  return h1.toString(16).padStart(8, "0") + h2.toString(16).padStart(8, "0");
}

function newSalt(): string {
  let s = "";
  // crypto.getRandomValues is available in Expo's runtime
  const b = new Uint8Array(8);
  crypto.getRandomValues(b);
  b.forEach((x) => { s += x.toString(16).padStart(2, "0"); });
  return s;
}

export async function hasPin(): Promise<boolean> {
  return (await AsyncStorage.getItem(KEY)) != null;
}

export async function setPin(pin: string): Promise<void> {
  if (!isValidPin(pin)) throw new Error("PIN must be 4-6 digits");
  const salt = newSalt();
  await AsyncStorage.setItem(SALT_KEY, salt);
  await AsyncStorage.setItem(KEY, digest(pin, salt));
}

export async function verifyPin(pin: string): Promise<boolean> {
  const hash = await AsyncStorage.getItem(KEY);
  const salt = await AsyncStorage.getItem(SALT_KEY);
  if (hash == null || salt == null) return false;
  return digest(pin, salt) === hash;
}
