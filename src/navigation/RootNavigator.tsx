// src/navigation/RootNavigator.tsx
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { Button, Text, View } from 'react-native';
import { supabase } from '../lib/supabase';

const Stack = createNativeStackNavigator();

function SignInScreen() {
  const handleSignIn = async () => {
    // Replace with your real logic: email/password or magic link
    const { error } = await supabase.auth.signInWithPassword({
      email: 'demo@example.com',
      password: 'demo-password',
    });
    if (error) console.log(error);
  };
  return (
    <View style={{ padding: 24 }}>
      <Text style={{ fontSize: 20, fontWeight: '600' }}>Sign in</Text>
      <Button title="Sign in (demo)" onPress={handleSignIn} />
    </View>
  );
}

function HomeScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 20, fontWeight: '600' }}>Home</Text>
    </View>
  );
}

export default function RootNavigator() {
  const [session, setSession] = React.useState<any>(null);

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {session ? (
          <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: true }} />
        ) : (
          <Stack.Screen name="SignIn" component={SignInScreen} options={{ headerShown: false }} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
