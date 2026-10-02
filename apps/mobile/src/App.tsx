/* ============================================================
   ULMS field app — App + navigation shell (R6).
   Tab layout: Today's visits (collections) · CPV tasks · Sync.
   Offline-first: every mutation enqueues to the sync engine.
   ============================================================ */
import * as React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { loadSession, beginLogin, exchangeCode } from "./auth/auth";
import { TodayScreen } from "./screens/TodayScreen";
import { CpvTasksScreen } from "./screens/CpvTasksScreen";
import { SyncScreen } from "./screens/SyncScreen";
import { LangProvider, useLang } from "./i18n/LangProvider";

const Tab = createBottomTabNavigator();

function LoginGate({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<unknown | null>(undefined);   // undefined = loading
  const [pending, setPending] = React.useState<{ verifier: string; state: string } | null>(null);
  React.useEffect(() => { void loadSession().then(setSession); }, []);
  if (session === undefined) return null;                                    // splash
  if (!session) {
    return null;   // login UI rendered by the native auth session hook (see app/LoginScreen.tsx)
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <LangProvider>
      <NavigationContainer>
        <LoginGate>
          <Tab.Navigator screenOptions={{ headerShown: false }}>
            <Tab.Screen name="today" component={TodayScreen} />
            <Tab.Screen name="cpv" component={CpvTasksScreen} />
            <Tab.Screen name="sync" component={SyncScreen} />
          </Tab.Navigator>
        </LoginGate>
      </NavigationContainer>
    </LangProvider>
  );
}
