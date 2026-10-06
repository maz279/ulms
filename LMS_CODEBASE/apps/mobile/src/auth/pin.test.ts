/**
 * App-lock PIN core (PLANNING/08 A2): policy validation + salted verify.
 * AsyncStorage is mocked — the storage contract, not the OS, is under test.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const store = new Map<string, string>();
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: async (k: string) => store.get(k) ?? null,
    setItem: async (k: string, v: string) => { store.set(k, v); },
    removeItem: async (k: string) => { store.delete(k); },
  },
}));

import { isValidPin, hasPin, setPin, verifyPin } from "./pin";

describe("app PIN (08 A2)", () => {
  beforeEach(() => store.clear());

  it("policy: 4-6 digits only", () => {
    expect(isValidPin("1234")).toBe(true);
    expect(isValidPin("123456")).toBe(true);
    expect(isValidPin("123")).toBe(false);
    expect(isValidPin("1234567")).toBe(false);
    expect(isValidPin("12a4")).toBe(false);
  });

  it("set then verify round-trip; wrong PIN rejected", async () => {
    expect(await hasPin()).toBe(false);
    await setPin("4321");
    expect(await hasPin()).toBe(true);
    expect(await verifyPin("4321")).toBe(true);
    expect(await verifyPin("4322")).toBe(false);
  });

  it("the stored value is never the PIN itself (salted hash at rest)", async () => {
    await setPin("9999");
    const raw = [...store.values()].join("|");
    expect(raw).not.toContain("9999");
  });

  it("re-setting the PIN re-salts (old PIN stops working)", async () => {
    await setPin("1111");
    await setPin("2222");
    expect(await verifyPin("1111")).toBe(false);
    expect(await verifyPin("2222")).toBe(true);
  });
});
