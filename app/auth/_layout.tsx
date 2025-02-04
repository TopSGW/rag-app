import { Stack } from 'expo-router';
import { View } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function Layout() {
  const colorScheme = useColorScheme();
  const backgroundColor = colorScheme === 'dark' ? '#000' : '#fff';

  return (
    <View style={{ flex: 1, backgroundColor }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor },
          animation: 'fade',
        }}
      >
        <Stack.Screen 
          name="login" 
          options={{
            title: 'Login',
          }}
        />
        <Stack.Screen 
          name="signup" 
          options={{
            title: 'Sign Up',
          }}
        />
        <Stack.Screen 
          name="index"
          options={{
            title: 'Auth',
          }}
        />
      </Stack>
    </View>
  );
}