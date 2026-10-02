/**
 * Bilingual rendering (PLANNING/07 §6, ported from prototype i18n_data.js).
 * Rule: exactly ONE language per element — pick() resolves {en,bn} by the
 * active language; mixing on one element is a defect (the i18n-separation
 * e2e spec enforces it). Bengali strings come ONLY from the validated
 * prototype dictionaries (strings.generated.ts); where a key has no sourced
 * Bengali yet, BN mode falls back to English rather than inventing a
 * translation — the gap list goes to bank translation review.
 */
import { useCallback, useEffect, useState } from "react";
import { STRINGS } from "./strings.generated";

export type Lang = "en" | "bn";
export interface Bilingual { en: string; bn?: string | null }

const STORAGE_KEY = "ulms-lang";

function readInitialLang(): Lang {
  try {
    return localStorage.getItem(STORAGE_KEY) === "bn" ? "bn" : "en";
  } catch {
    return "en";
  }
}

export let currentLang: Lang = readInitialLang();

export function setLang(lang: Lang) {
  currentLang = lang;
  try { localStorage.setItem(STORAGE_KEY, lang); } catch { /* private mode */ }
  document.documentElement.lang = lang;
}

export function pick(value: Bilingual): string {
  return currentLang === "bn" ? value.bn ?? value.en : value.en;
}

/** Catalog lookup by stable key — the chrome-string path (07 §6). */
export function t(key: string): string {
  const entry: Bilingual | undefined = STRINGS[key];
  if (!entry) return key;   // missing key surfaces visibly in review, never silently
  return pick(entry);
}

/** React binding: components re-render on toggle via this hook. */
export function useLang(): [Lang, (l: Lang) => void] {
  const [lang, setLangState] = useState<Lang>(currentLang);
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  const change = useCallback((l: Lang) => {
    setLang(l);
    setLangState(l);
    // every string renders through t()/pick() at call time — a hard re-render
    // of the tree flips the whole chrome at once (one language per element)
    window.dispatchEvent(new CustomEvent("ulms-lang-change", { detail: l }));
  }, []);
  useEffect(() => {
    const sync = () => setLangState(currentLang);
    window.addEventListener("ulms-lang-change", sync);
    return () => window.removeEventListener("ulms-lang-change", sync);
  }, []);
  return [lang, change];
}

/** Catalog coverage stats — surfaced in the Report Center gap tracker. */
export function i18nCoverage(): { total: number; withBn: number; gaps: string[] } {
  const keys = Object.keys(STRINGS);
  const gaps = keys.filter((k) => !STRINGS[k]!.bn);
  return { total: keys.length, withBn: keys.length - gaps.length, gaps };
}
