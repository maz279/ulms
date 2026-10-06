import * as React from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Lang } from "./strings";

const KEY = "ulms.borrower.lang";
const Ctx = React.createContext<{ lang: Lang; setLang: (l: Lang) => void }>(
  { lang: "bn", setLang: () => undefined });

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = React.useState<Lang>("bn");   // Bangla-first
  React.useEffect(() => {
    void AsyncStorage.getItem(KEY).then((v) => {
      if (v === "en" || v === "bn") setLangState(v);
    });
  }, []);
  const setLang = React.useCallback((l: Lang) => {
    setLangState(l);
    void AsyncStorage.setItem(KEY, l);
  }, []);
  const value = React.useMemo(() => ({ lang, setLang }), [lang, setLang]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLang(): { lang: Lang; setLang: (l: Lang) => void } {
  return React.useContext(Ctx);
}
