"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { generateId } from "@/lib/utils";
import type { ChatMessage } from "@/types";
import {
  Send, Brain, User, Sparkles, RotateCcw, Copy, Check, Scale, Mic, MicOff, Volume2, MonitorPlay
} from "lucide-react";
import { useMemory } from "@/lib/memory-store";

export default function TutorPage() {
  const { profile, updateChatHistory, clearChatHistory } = useMemory();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [debateMode, setDebateMode] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const baseInputRef = useRef("");
  const [conversationMode, setConversationMode] = useState(false);
  const conversationModeRef = useRef(false);
  const isListeningRef = useRef(false);
  const isTypingRef = useRef(false);
  const handleSendRef = useRef<any>(null);
  const toggleListenRef = useRef<any>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => { conversationModeRef.current = conversationMode; }, [conversationMode]);
  useEffect(() => { isListeningRef.current = isListening; }, [isListening]);
  useEffect(() => { isTypingRef.current = isTyping; }, [isTyping]);

  useEffect(() => {
    if (typeof window !== "undefined" && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onresult = (event: any) => {
        let currentSessionTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          currentSessionTranscript += event.results[i][0].transcript;
        }
        setInput((baseInputRef.current ? baseInputRef.current + " " : "") + currentSessionTranscript);
        
        if (conversationModeRef.current) {
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = setTimeout(() => {
            if (recognitionRef.current) recognitionRef.current.stop();
          }, 2000);
        }
      };
      
      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onend = () => {
        setIsListening(false);
        if (conversationModeRef.current) {
          const val = inputRef.current?.value;
          if (val && val.trim().length > 0 && !isTypingRef.current) {
             if (handleSendRef.current) handleSendRef.current(val);
          } else if (!isTypingRef.current) {
             setTimeout(() => {
               if (conversationModeRef.current && !isListeningRef.current && toggleListenRef.current) {
                  toggleListenRef.current();
               }
             }, 500);
          }
        }
      };
    }
  }, []);

  // Sync messages with profile chat history on load
  useEffect(() => {
    if (messages.length === 0 && profile.chatHistory.length > 0) {
      setMessages(profile.chatHistory);
    } else if (messages.length === 0 && profile.chatHistory.length === 0 && profile.lastActive) {
      // Dynamic initial greeting based on real user profile
      const topicToDiscuss = profile.weaknesses.length > 0 ? profile.weaknesses[0] : "your next learning milestone";
      setMessages([{
        id: generateId(),
        role: "assistant",
        content: `Hey there! I'm Algorify, your personalized learning twin. 🧠 I noticed you've been working hard lately. Let's tackle ${topicToDiscuss} together. What would you like to explore today?`,
        timestamp: new Date().toISOString(),
      }]);
    }
  }, [profile.chatHistory, messages.length]);

  useEffect(() => {
    // Only update the global store if we have new messages that aren't already saved
    if (messages.length > 0 && messages !== profile.chatHistory) {
      updateChatHistory(messages);
    }
  }, [messages, updateChatHistory]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = async (textOverride?: string | React.MouseEvent) => {
    const textToSend = typeof textOverride === 'string' ? textOverride : input;
    if (!textToSend.trim() || isTypingRef.current) return;

    const userMessage: ChatMessage = {
      id: generateId(),
      role: "user",
      content: textToSend.trim(),
      timestamp: new Date().toISOString(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsTyping(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, debateMode, profile }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch AI response");
      }

      const responseId = generateId();
      setMessages((prev) => [
        ...prev,
        {
          id: responseId,
          role: "assistant",
          content: "",
          timestamp: new Date().toISOString(),
        },
      ]);

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No reader available from response");
      
      const decoder = new TextDecoder();
      let done = false;
      let streamedText = "";

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          streamedText += decoder.decode(value, { stream: true });
          
          // Format text: replace [YOUTUBE: query] with a markdown link
          let formattedText = streamedText.replace(/\[YOUTUBE:\s*(.+?)\]/g, (match, query) => {
             return `[📹 Recommended Video: ${query}](https://www.youtube.com/results?search_query=${encodeURIComponent(query)})`;
          });
          
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === responseId ? { ...msg, content: formattedText } : msg
            )
          );
        }
      }

      if (conversationModeRef.current) {
        handleSpeak(streamedText);
      }
    } catch (error: any) {
      console.error(error);
      const errorMsg: ChatMessage = {
        id: generateId(),
        role: "assistant",
        content: `Sorry, I encountered a network error: ${error.message}. Please check your internet connection or terminal logs.`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };
  handleSendRef.current = handleSend;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeak = (text: string) => {
    if (typeof window !== "undefined" && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/\[IMAGE:.*?\]/gi, '').replace(/[#*`_]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.0;
      
      const voices = window.speechSynthesis.getVoices();
      const premiumVoice = voices.find(v => (v.name.includes("Google") || v.name.includes("Natural")) && v.lang.startsWith("en")) 
                        || voices.find(v => v.lang === "en-US" || v.lang === "en-GB");
      if (premiumVoice) utterance.voice = premiumVoice;
      
      utterance.onend = () => {
        if (conversationModeRef.current && !isListeningRef.current) {
          setTimeout(() => {
            if (toggleListenRef.current) toggleListenRef.current();
          }, 300);
        }
      };
      
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleListen = () => {
    if (isListeningRef.current) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (!recognitionRef.current) {
        alert("Voice recognition is not supported in this browser.");
        return;
      }
      baseInputRef.current = inputRef.current?.value || "";
      try { recognitionRef.current.start(); } catch(e) {}
      setIsListening(true);
    }
  };
  toggleListenRef.current = toggleListen;

  const renderContent = (content: string) => {
    return content.replace(/\[IMAGE:\s*(.*?)\]/gi, (match, desc) => {
      return `\n\n![${desc}](https://image.pollinations.ai/prompt/${encodeURIComponent(desc)}?nologo=true&enhance=true)\n\n`;
    });
  };

  const handleSuggestion = (q: string) => {
    setInput(q);
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="w-6 h-6 text-accent-purple" />
            Algorify Mentor
          </h1>
          <p className="text-sm text-text-muted mt-1">Personalized to your learning style: <span className="text-accent-purple">{profile.preferredExplanationStyle}</span></p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Conversation Mode Toggle */}
          <button
            onClick={() => {
              const newVal = !conversationMode;
              setConversationMode(newVal);
              if (newVal) {
                setTimeout(() => { if (!isListeningRef.current && toggleListenRef.current) toggleListenRef.current(); }, 100);
              } else {
                window.speechSynthesis.cancel();
                if (isListeningRef.current && toggleListenRef.current) toggleListenRef.current();
              }
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer border ${
              conversationMode 
                ? 'bg-accent-blue/20 text-accent-blue border-accent-blue/30 animate-pulse' 
                : 'bg-bg-tertiary/50 text-text-muted border-border-primary hover:border-border-hover'
            }`}
            title="Hands-free one-on-one conversation with AI"
          >
            <Mic className="w-4 h-4" />
            {conversationMode ? 'Voice Mode: ON' : 'Voice Mode: OFF'}
          </button>
          
          {/* Debate Mode Toggle */}
          <button
            onClick={() => setDebateMode(!debateMode)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer border ${
              debateMode 
                ? 'bg-accent-amber/20 text-accent-amber border-accent-amber/30' 
                : 'bg-bg-tertiary/50 text-text-muted border-border-primary hover:border-border-hover'
            }`}
            title="When enabled, the AI will challenge your reasoning instead of just giving answers."
          >
            <Scale className="w-4 h-4" />
            {debateMode ? 'Debate Mode: ON' : 'Debate Mode: OFF'}
          </button>
          
          <button
            onClick={() => {
              setMessages([]);
              clearChatHistory();
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer border bg-bg-tertiary/50 text-rose-400 border-rose-500/20 hover:border-rose-500/50"
            title="Clear Chat History"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pb-4 pr-1">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center shrink-0 mt-1">
                  <Brain className="w-4 h-4 text-text-primary" />
                </div>
              )}
              <div className={`max-w-[85%] md:max-w-[75%] relative group ${msg.role === "user" ? "chat-message-user px-4 py-3" : "chat-message-assistant px-4 py-3"}`}>
                {msg.role === "assistant" ? (
                  <div className="prose-chat text-sm text-text-primary overflow-hidden">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm, remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                      components={{
                        a({node, href, children, ...props}: any) {
                          const text = String(children);
                          if (text.startsWith("📹 Recommended Video:")) {
                            const query = text.replace("📹 Recommended Video:", "").trim();
                            return (
                              <a 
                                href={href} 
                                target="_blank" 
                                rel="noreferrer"
                                className="my-4 p-4 border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 rounded-xl flex items-center gap-4 w-max transition-all shadow-none hover:shadow-none no-underline group inline-flex"
                              >
                                <span className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                  <MonitorPlay className="w-6 h-6 text-red-500 drop-shadow-none" />
                                </span>
                                <span className="flex flex-col text-left">
                                  <strong className="text-red-400 font-bold">Watch Video Tutorial</strong>
                                  <span className="text-sm text-text-muted">Search: {query}</span>
                                </span>
                              </a>
                            );
                          }
                          return <a href={href} className="text-accent-blue hover:underline" target="_blank" {...props}>{children}</a>;
                        }
                      }}
                    >
                      {renderContent(msg.content)}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm text-text-primary">{msg.content}</p>
                )}
                {msg.role === "assistant" && (
                  <div className="absolute -bottom-3 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <button
                      onClick={() => handleSpeak(msg.content)}
                      className="bg-bg-tertiary rounded-lg p-1.5 border border-border-primary hover:bg-bg-secondary"
                      title="Read aloud"
                    >
                      <Volume2 className="w-3 h-3 text-text-muted" />
                    </button>
                    <button
                      onClick={() => handleCopy(msg.id, msg.content)}
                      className="bg-bg-tertiary rounded-lg p-1.5 border border-border-primary hover:bg-bg-secondary"
                      title="Copy text"
                    >
                      {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-text-muted" />}
                    </button>
                  </div>
                )}
              </div>
              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-lg bg-bg-tertiary flex items-center justify-center shrink-0 mt-1">
                  <User className="w-4 h-4 text-text-muted" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {isTyping && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center shrink-0">
              <Brain className="w-4 h-4 text-text-primary" />
            </div>
            <div className="chat-message-assistant px-4 py-3 flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-text-muted typing-dot" />
              <div className="w-2 h-2 rounded-full bg-text-muted typing-dot" />
              <div className="w-2 h-2 rounded-full bg-text-muted typing-dot" />
            </div>
          </motion.div>
        )}

        {/* Suggestions (show when no user messages yet) */}
        {messages.length <= 1 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
            {[
              `Can you explain ${profile.weaknesses[0] || "a complex topic"} using a real-world analogy?`,
              `I keep making mistakes in ${profile.weaknesses[1] || "my studies"}, can you help me figure out why?`,
              "Let's do a quick, low-stakes quiz to test my knowledge.",
              `I'm feeling a bit stuck on ${profile.topicsExplored[0] || "this topic"}. Can we break it down?`,
              "I have an exam next week and I'm stressed. What should I focus on?"
            ].map((q) => (
              <button
                key={q}
                onClick={() => handleSuggestion(q)}
                className="text-left text-sm text-text-muted p-3 rounded-xl border border-border-primary hover:border-border-hover hover:bg-bg-tertiary/30 transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 inline mr-1.5 text-accent-purple" />
                {q}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-border-primary pt-4">
        <div className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything... (Shift+Enter for new line)"
              rows={1}
              className="w-full rounded-xl bg-bg-tertiary/50 border border-border-primary px-4 py-3 pr-12 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-blue/50 focus:border-accent-blue resize-none max-h-32 overflow-y-auto"
              style={{ minHeight: "44px" }}
            />
          </div>
          <Button
            onClick={toggleListen}
            variant={isListening ? "primary" : "secondary"}
            size="icon"
            className={`shrink-0 h-11 w-11 ${isListening ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30 border-red-500/50' : ''}`}
            title="Dictate with voice"
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </Button>
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            size="icon"
            className="shrink-0 h-11 w-11"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-[10px] text-text-muted mt-2 text-center">AI responses are personalized based on your Learning Twin profile</p>
      </div>
    </div>
  );
}
