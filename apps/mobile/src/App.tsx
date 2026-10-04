/* ============================================================
   ULMS field app — App + navigation shell (R6).
   Tab layout: Today's visits (collections) · CPV tasks · Sync.
   Offline-first: every mutation enqueues to the sync engine.
   ============================================================ */
import * as React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { loadSession } from "./auth/auth";
import { LoginScreen } from "./auth/LoginScreen";
import { TodayScreen } from "./screens/TodayScreen";
import { CpvTasksScreen } from "./screens/CpvTasksScreen";
import { SyncScreen } from "./screens/SyncScreen";
import { MapScreen } from "./screens/MapScreen";
import { ProofGalleryScreen } from "./screens/ProofGalleryScreen";
import { SosScreen } from "./screens/SosScreen";
import { LangProvider } from "./i18n/LangProvider";

const Tab = createBottomTabNavigator();

function LoginGate({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<unknown | null>(undefined);   // undefined = loading
  const reload = React.useCallback(() => {
    setSession(undefined);
    void loadSession().then(setSession);
  }, []);
  React.useEffect(() => { void loadSession().then(setSession); }, []);
  if (session === undefined) return null;                                    // splash
  if (!session) {
    return <LoginScreen onSignedIn={reload} />;
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
            <Tab.Screen name="map" component={MapScreen} />
            <Tab.Screen name="proof" component={ProofGalleryScreen} />
            <Tab.Screen name="sos" component={SosScreen} />
            <Tab.Screen name="sync" component={SyncScreen} />
          </Tab.Navigator>
        </LoginGate>
      </NavigationContainer>
    </LangProvider>
  );
}
