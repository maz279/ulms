/* ============================================================
   ULMS Borrower app — navigation shell. Tab layout: Home · My
   Applications · Pay · Statements · More. OTP session gate in
   front (Bangla-first per 07 §6). One codebase → Android + iOS.
   ============================================================ */
import * as React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { LangProvider } from "./i18n/LangProvider";
import { LoginScreen } from "./screens/LoginScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { TrackerScreen } from "./screens/TrackerScreen";
import { PayScreen } from "./screens/PayScreen";
import { StatementsScreen } from "./screens/StatementsScreen";
import { MoreScreen } from "./screens/MoreScreen";
import { loadSession, saveSession, type BorrowerSession } from "./api/client";

const Tab = createBottomTabNavigator();

export default function App() {
  const [session, setSession] = React.useState<BorrowerSession | null | undefined>(undefined);
  React.useEffect(() => { void loadSession().then(setSession); }, []);

  if (session === undefined) return null;   // splash

  if (!session) {
    return (
      <LangProvider>
        <LoginScreen onSignedIn={setSession} />
      </LangProvider>
    );
  }

  return (
    <LangProvider>
      <NavigationContainer>
        <Tab.Navigator screenOptions={{ headerShown: false }}>
          <Tab.Screen name="home">
            {() => <HomeScreen session={session} />}
          </Tab.Screen>
          <Tab.Screen name="track">
            {() => <TrackerScreen session={session} />}
          </Tab.Screen>
          <Tab.Screen name="pay">
            {() => <PayScreen session={session} />}
          </Tab.Screen>
          <Tab.Screen name="statements">
            {() => <StatementsScreen session={session} />}
          </Tab.Screen>
          <Tab.Screen name="more">
            {() => (
              <MoreScreen
                session={session}
                onLogout={() => { void saveSession(null); setSession(null); }}
              />
            )}
          </Tab.Screen>
        </Tab.Navigator>
      </NavigationContainer>
    </LangProvider>
  );
}
