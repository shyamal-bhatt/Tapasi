import { Tabs } from 'expo-router';
import { Calendar, MessageCircle, User } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { Platform, StyleSheet } from 'react-native';

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    position: 'absolute',
                    backgroundColor: Platform.select({ ios: 'transparent', android: 'white' }),
                    borderTopWidth: 0,
                    elevation: 0,
                    shadowOpacity: 0,
                    height: 80,
                    paddingBottom: 20,
                    overflow: 'hidden', // Ensure blur doesn't leak or cause layout issues
                },
                tabBarBackground: () => (
                    Platform.OS === 'ios' ? (
                        <BlurView
                            intensity={80}
                            style={StyleSheet.absoluteFill}
                            tint="light"
                        />
                    ) : undefined
                ),
                tabBarActiveTintColor: '#F43F5E', // rose-500
                tabBarInactiveTintColor: '#9CA3AF', // gray-400
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Calendar',
                    tabBarIcon: ({ color, size }) => <Calendar size={size} color={color} />,
                }}
                listeners={{
                    tabPress: (e) => {
                        console.log('[Navigation] Tab Pressed: Calendar');
                    },
                }}
            />
            <Tabs.Screen
                name="chat"
                options={{
                    title: 'Chat',
                    tabBarIcon: ({ color, size }) => <MessageCircle size={size} color={color} />,
                }}
                listeners={{
                    tabPress: (e) => {
                        console.log('[Navigation] Tab Pressed: Chat');
                    },
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
                }}
                listeners={{
                    tabPress: (e) => {
                        console.log('[Navigation] Tab Pressed: Profile');
                    },
                }}
            />
        </Tabs>
    );
}
