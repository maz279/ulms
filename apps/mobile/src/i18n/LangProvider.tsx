/* Lang context — persists the choice; default EN until bank review clears BN. */
import * as React from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { type Lang } from "./strings";

const Ctx = React.createContext<Lang>("en");
export function useLang(): Lang { return React.useContext(Ctx); }

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = React.useState<Lang>("en");
  React.useEffect(() => {
    void AsyncStorage.getItem("ulms-lang").then((v) => {
      if (v === "bn") setLang("bn");
    });
  }, []);
  return <Ctx.Provider value={lang}>{children}</Ctx.Provider>;
}
