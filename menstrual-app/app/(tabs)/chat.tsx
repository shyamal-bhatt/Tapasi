import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, Pressable, KeyboardAvoidingView, Platform, Keyboard, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Send, Pencil } from 'lucide-react-native';

export default function ChatScreen() {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([
        { id: '1', text: "Hello! I'm your health assistant. How can I help you today?", isUser: false },
    ]);
    const [isKeyboardVisible, setKeyboardVisible] = useState(false);
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);

    useEffect(() => {
        const keyboardWillShowListener = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
            () => setKeyboardVisible(true)
        );
        const keyboardWillHideListener = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
            () => setKeyboardVisible(false)
        );

        return () => {
            keyboardWillShowListener.remove();
            keyboardWillHideListener.remove();
        };
    }, []);

    const handleEdit = (id: string, text: string) => {
        setEditingMessageId(id);
        setMessage(text);
    };

    const sendMessage = () => {
        if (!message.trim()) return;

        if (editingMessageId) {
            // Edit Mode: Remove everything after the edited message and replace it
            setMessages(prev => {
                const index = prev.findIndex(m => m.id === editingMessageId);
                if (index === -1) return prev;

                // Keep messages up to the edited one, but replace the edited one with new text
                // Actually, standard "regenerate" usually implies we keep history UP TO that point.
                // So we slice 0..index, then add the new user message.
                const history = prev.slice(0, index);
                return [...history, { id: editingMessageId, text: message, isUser: true }];
            });
            setEditingMessageId(null);
        } else {
            // Normal Send
            setMessages(prev => [...prev, { id: Date.now().toString(), text: message, isUser: true }]);
        }

        setMessage('');

        // Mock response (always triggers after send or edit)
        setTimeout(() => {
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                text: "I'm just a demo bot for now, but I'm listening!",
                isUser: false
            }]);
        }, 1000);
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
            <View className="p-4 border-b border-gray-200 bg-white">
                <Text className="text-xl font-bold text-gray-900">Health Assistant</Text>
            </View>

            <FlatList
                data={messages}
                className="flex-1 px-4"
                contentContainerStyle={{
                    paddingVertical: 20,
                    gap: 16,
                    paddingBottom: isKeyboardVisible ? 20 : 100 // Extra padding for tab bar
                }}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <View className={`max-w-[80%] ${item.isUser ? 'self-end' : 'self-start'}`}>
                        <View className={`p-4 rounded-2xl ${item.isUser
                            ? 'bg-rose-500 rounded-tr-none'
                            : 'bg-white rounded-tl-none shadow-sm'
                            }`}>
                            <Text className={item.isUser ? 'text-white' : 'text-gray-800'}>
                                {item.text}
                            </Text>
                        </View>

                        {/* Edit Button for User Messages */}
                        {item.isUser && (
                            <TouchableOpacity
                                onPress={() => handleEdit(item.id, item.text)}
                                className="absolute -left-8 top-2 p-1.5 bg-gray-200 rounded-full"
                            >
                                <Pencil size={12} color="#6b7280" />
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <View
                    className="p-4 bg-white border-t border-gray-100 flex-row items-center gap-3"
                    style={{ paddingBottom: isKeyboardVisible ? 16 : 90 }} // Adjust for tab bar
                >
                    <TextInput
                        className="flex-1 bg-gray-100 p-4 rounded-full text-gray-800 max-h-32"
                        placeholder={editingMessageId ? "Edit your message..." : "Type a message..."}
                        value={message}
                        onChangeText={setMessage}
                        multiline
                    />
                    <Pressable
                        onPress={sendMessage}
                        className={`w-12 h-12 rounded-full items-center justify-center ${editingMessageId ? 'bg-blue-500' : 'bg-rose-500'
                            } active:opacity-80`}
                    >
                        {editingMessageId ? (
                            <Pencil size={20} color="white" />
                        ) : (
                            <Send size={20} color="white" />
                        )}
                    </Pressable>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
