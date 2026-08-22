import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { BottomNavigation } from './components/BottomNavigation';
import { CoupleDashboard } from './components/CoupleDashboard';
import { SplashScreen } from './components/SplashScreen';
import { createClient } from './utils/supabase/client';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedScreen, setSelectedScreen] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      const supabase = createClient();
      const { data: { session }, error } = await supabase.auth.getSession();

      if (session?.access_token) {
        setUser(session.user);
        setAccessToken(session.access_token);
      }

      setIsLoading(false);
    };

    initAuth();

    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.access_token) {
        setUser(session.user);
        setAccessToken(session.access_token);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setAccessToken(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {showSplash ? (
        <SplashScreen />
      ) : selectedScreen === 'dashboard' ? (
        <CoupleDashboard
          user={user}
          accessToken={accessToken}
          onSignOut={() => {
            const supabase = createClient();
            supabase.auth.signOut();
            setUser(null);
            setAccessToken(null);
          }}
        />
      ) : (
        <Text>Screen not found</Text>
      )}
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      <Toast />
    </View>
  );
}
