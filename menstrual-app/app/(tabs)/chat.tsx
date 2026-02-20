import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, Pressable, KeyboardAvoidingView, Platform, Keyboard, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Send, Pencil, Download, ChevronDown, ChevronUp, Trash2 } from 'lucide-react-native';
import { LlamaManager } from '../utils/LlamaManager';
import * as SQLite from 'expo-sqlite';
import { jsonToToon } from '@jojojoseph/toon-json-converter';

export default function ChatScreen() {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([
        { id: '1', text: "Hello! I'm your health assistant. How can I help you today?", isUser: false },
    ]);
    const [isKeyboardVisible, setKeyboardVisible] = useState(false);
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [isModelReady, setIsModelReady] = useState(false);
    const [isCheckingModel, setIsCheckingModel] = useState(true);
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);

    useEffect(() => {
        const checkModelStatus = async () => {
            setIsCheckingModel(true);
            const result = await LlamaManager.prepareModel();
            if (result.isReady) {
                setIsModelReady(true);
                await LlamaManager.initContext();
            }
            setIsCheckingModel(false);
        };
        checkModelStatus();
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
        setMessage(text);
        setEditingMessageId(id);
    };

    const handleDownload = async () => {
        setIsDownloading(true);
        setDownloadProgress(0);

        try {
            const success = await LlamaManager.downloadModel((progress) => {
                setDownloadProgress(progress);
            });

            if (success) {
                setIsModelReady(true);
                await LlamaManager.initContext();
            }
        } catch (error) {
            console.error('Download failed:', error);
            Alert.alert(
                "Download Error",
                "Failed to download the AI model. Please check your connection and try again."
            );
        } finally {
            setIsDownloading(false);
        }
    };

    const handleCancelDownload = async () => {
        setIsDownloading(false);
        setDownloadProgress(0);
        await LlamaManager.cancelDownload();
    };

    const sendMessage = async () => {
        if (!message.trim() || !isModelReady) return;

        let promptText = message;

        if (editingMessageId) {
            setMessages(prev => {
                const index = prev.findIndex(m => m.id === editingMessageId);
                if (index === -1) return prev;
                const history = prev.slice(0, index);
                return [...history, { id: editingMessageId, text: message, isUser: true }];
            });
            setEditingMessageId(null);
        } else {
            setMessages(prev => [...prev, { id: Date.now().toString(), text: message, isUser: true }]);
        }

        setMessage('');

        const botMessageId = (Date.now() + 1).toString();
        setMessages(prev => [...prev, { id: botMessageId, text: '...', isUser: false }]);

        try {
            const currentDate = new Date().toISOString().split('T')[0];
            let ragContext = '';

            try {
                // PASS 1: Generate SQL 
                const sqlQuery = await LlamaManager.generateSqlPass(promptText, currentDate);
                console.log('[RAG] Generated SQL:', sqlQuery);

                const upperSql = sqlQuery.toUpperCase();
                if (upperSql.includes('DROP') || upperSql.includes('DELETE') || upperSql.includes('UPDATE') || upperSql.includes('INSERT')) {
                    console.warn('[RAG] Aborted unsafe SQL:', sqlQuery);
                } else if (sqlQuery.trim()) {
                    // Execute SQL
                    const db = await SQLite.openDatabaseAsync('watermelon.db');
                    const results = await db.getAllAsync(sqlQuery);
                    console.log('[RAG] DB returned rows:', results?.length || 0);

                    if (results && (results as any[]).length > 0) {
                        const toonStr = jsonToToon(results as any[]);
                        console.log('[RAG] TOON Compression String Data Loaded.');
                        ragContext = `\nThe local database returned the following data for the user in TOON format:\n${toonStr}\n\n`;
                    } else {
                        ragContext = `\nThe local database returned no data for this query.\n\n`;
                    }
                }
            } catch (sqlErr) {
                console.warn('[RAG] SQL Generation or Execution failed:', sqlErr);
                ragContext = `\n(I'm having trouble accessing your logs right now, but generally...)\n\n`;
            }

            const finalPrompt = `[SYSTEM]: The user asked '${promptText}'.${ragContext}[ASSISTANT]:`;

            await LlamaManager.generateResponse(finalPrompt, (token) => {
                setMessages(prev => prev.map(m =>
                    m.id === botMessageId ? { ...m, text: m.text === '...' ? token : m.text + token } : m
                ));
            });
        } catch (error) {
            setMessages(prev => prev.map(m =>
                m.id === botMessageId ? { ...m, text: "Sorry, I encountered an error generating the response." } : m
            ));
        }
    };

    if (isCheckingModel) {
        return (
            <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center p-6" edges={['top']}>
                <View className="bg-white p-8 rounded-3xl shadow-sm items-center w-full max-w-sm">
                    <Text className="text-gray-500 font-medium">Checking AI Model Status...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!isModelReady) {
        return (
            <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center p-6" edges={['top']}>
                <View className="bg-white p-8 rounded-3xl shadow-sm items-center w-full max-w-sm">
                    <View className="w-16 h-16 bg-rose-100 rounded-full items-center justify-center mb-6">
                        <Download size={32} color="#f43f5e" />
                    </View>
                    <Text className="text-2xl font-bold text-gray-900 mb-2 text-center">AI Model Required</Text>
                    <Text className="text-gray-500 text-center mb-8 leading-relaxed">
                        To chat with the health assistant privately on your device, you need to download the AI model (~1GB).
                    </Text>

                    {isDownloading ? (
                        <View className="w-full">
                            <View className="flex-row justify-between mb-2">
                                <Text className="text-gray-600 font-medium text-sm">Downloading...</Text>
                                <Text className="text-rose-500 font-bold text-sm">{Math.round(downloadProgress * 100)}%</Text>
                            </View>
                            <View className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-6">
                                <View
                                    className="h-full bg-rose-500 rounded-full"
                                    style={{ width: `${Math.max(0, Math.min(100, downloadProgress * 100))}%` }}
                                />
                            </View>
                            <TouchableOpacity
                                onPress={handleCancelDownload}
                                className="w-full border border-gray-300 py-4 rounded-xl items-center flex-row justify-center active:bg-gray-50"
                            >
                                <Text className="text-gray-600 font-bold text-lg">Cancel Download</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity
                            onPress={handleDownload}
                            className="w-full bg-rose-500 py-4 rounded-xl items-center flex-row justify-center gap-2 active:opacity-80"
                        >
                            <Download size={20} color="white" />
                            <Text className="text-white font-bold text-lg">Download Model</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
            <View className="px-4 py-3 border-b border-gray-200 bg-white z-50 shadow-sm">
                <View className="flex-row items-center justify-between">
                    <Text className="text-xl font-bold text-gray-900">Health Assistant</Text>
                    <TouchableOpacity
                        onPress={() => setIsModelMenuOpen(!isModelMenuOpen)}
                        className="flex-row items-center bg-gray-100 px-3 py-1.5 rounded-full gap-1 active:opacity-70"
                    >
                        <Text className="text-gray-600 font-medium text-sm max-w-[100px]" numberOfLines={1}>
                            {LlamaManager.activeModelName || 'Model'}
                        </Text>
                        {isModelMenuOpen ? (
                            <ChevronUp size={16} color="#4b5563" />
                        ) : (
                            <ChevronDown size={16} color="#4b5563" />
                        )}
                    </TouchableOpacity>
                </View>

                {isModelMenuOpen && (
                    <View className="absolute top-[52px] right-4 bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden w-48 z-50">
                        <TouchableOpacity
                            onPress={async () => {
                                setIsModelMenuOpen(false);
                                await LlamaManager.deleteModel();
                                setIsModelReady(false);
                            }}
                            className="flex-row items-center px-4 py-3 bg-red-50 active:bg-red-100 gap-2 border-b border-gray-50"
                        >
                            <Trash2 size={16} color="#ef4444" />
                            <Text className="text-red-500 font-medium shadow-none">Delete Model</Text>
                        </TouchableOpacity>
                    </View>
                )}
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
