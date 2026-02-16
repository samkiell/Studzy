"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import NextImage from "next/image";
import { createPortal } from "react-dom";
import {
  X,
  Send,
  Loader2,
  Plus,
  Trash2,
  MessageSquare,
  ImageIcon,
  Globe,
  Code,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  StopCircle,
  Clipboard,
  Check,
  ImageUp,
  User,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useRouter } from "next/navigation";
import { StudyTimeTracker } from "@/components/study/StudyTimeTracker";

type ChatMode = "chat" | "image" | "search" | "code";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  image?: string;
  images?: string[];
  mode?: ChatMode;
  timestamp: Date;
}

interface StudzyAIModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const modeConfig = {
  chat: {
    label: "Chat",
    icon: <MessageSquare className="h-4 w-4" />,
    description: "Conversational assistant for any topic",
  },
  image: {
    label: "Image",
    icon: <ImageIcon className="h-4 w-4" />,
    description: "Analyze and discuss images",
  },
  search: {
    label: "Search",
    icon: <Globe className="h-4 w-4" />,
    description: "Web-enhanced research and facts",
  },
  code: {
    label: "Code",
    icon: <Code className="h-4 w-4" />,
    description: "Specialized in programming and debugging",
  },
};

export const StudzyAIModal: React.FC<StudzyAIModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<ChatMode>("chat");
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [openingWorkspace, setOpeningWorkspace] = useState(false);
  const [copyingId, setCopyingId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const abortControllerRef = useRef<AbortController | null>(null);

  const [isAtBottom, setIsAtBottom] = useState(true);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setIsAtBottom(isNearBottom);
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      
      // Only auto-focus on desktop to avoid triggering the mobile keyboard automatically
      const isMobile = window.innerWidth < 768;
      if (!isMobile) {
        inputRef.current?.focus();
      }
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    if (isAtBottom && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, isLoading, isAtBottom]);

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopyingId(id);
    setTimeout(() => setCopyingId(null), 2000);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() && images.length === 0) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      images: images,
      mode,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setImages([]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messages.concat(userMessage).map((m) => ({
            role: m.role,
            content: m.content,
            image: m.image,
            images: m.images,
          })),
          mode,
          images: userMessage.images,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to get response: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader");

      const assistantId = (Date.now() + 1).toString();
      setMessages((prev) => [
        ...prev,
        {
          id: assistantId,
          role: "assistant",
          content: "",
          timestamp: new Date(),
          mode,
        },
      ]);

      let accumulatedContent = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          // Final check: if there's anything left in buffer, process it
          if (buffer.trim()) {
            const finalLines = [buffer];
            for (const line of finalLines) {
              const trimmedLine = line.trim();
              if (trimmedLine.startsWith("data: ")) {
                const data = trimmedLine.slice(6);
                if (data !== "[DONE]") {
                  try {
                    const parsed = JSON.parse(data);
                    const content = parsed.choices?.[0]?.delta?.content || "";
                    if (content) accumulatedContent += content;
                  } catch (e) {}
                }
              }
            }
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, content: accumulatedContent }
                  : m
              )
            );
          }
          break;
        }

        const chunk = new TextDecoder().decode(value, { stream: true });
        buffer += chunk;

        const lines = buffer.split("\n");
        // Keep the last partial line in the buffer
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine || !trimmedLine.startsWith("data: ")) continue;

          const data = trimmedLine.slice(6);
          if (data === "[DONE]") {
            setIsLoading(false);
            break;
          }

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content || "";
            if (content) {
              accumulatedContent += content;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, content: accumulatedContent }
                    : m
                )
              );
            }
          } catch (e) {
            console.error("Error parsing buffered line:", e, trimmedLine);
          }
        }
      }
    } catch (error: any) {
      if (error.name === "AbortError") {
        console.log("Request aborted");
      } else {
        console.error("AI Error:", error);
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: "assistant",
            content: "Sorry, I encountered an error. Please try again.",
            timestamp: new Date(),
          },
        ]);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    const isMobile = window.innerWidth < 768;
    const maxH = isMobile ? 128 : window.innerHeight * 0.4;
    e.target.style.height = `${Math.min(e.target.scrollHeight, maxH)}px`;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey) {
      if (isMobile) {
        return;
      } else {
        e.preventDefault();
        handleSubmit();
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImages(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
      setMode("image");
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const clearChat = () => {
    setMessages([]);
    setMode("chat");
    setImages([]);
  };

  const openFullWorkspace = async () => {
    setOpeningWorkspace(true);
    try {
      const res = await fetch("/api/ai/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: input || "New Chat" }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/studzyai/chat/${data.session.id}`);
        onClose();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setOpeningWorkspace(false);
    }
  };

  const safeClose = () => {
    handleStop();
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="absolute inset-0" onClick={safeClose} />

      {/* Modal Container */}
      <div
        ref={containerRef}
        className="relative flex h-[100dvh] w-full max-w-2xl flex-col bg-white shadow-2xl dark:bg-neutral-900 sm:h-[85vh] sm:rounded-2xl sm:overflow-hidden"
      >
        {/* Fixed Header */}
        <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between border-b border-neutral-200 bg-white/80 px-4 py-3 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-900/80 sm:relative sm:top-auto sm:left-auto sm:right-auto sm:px-6 sm:py-4">
          <StudyTimeTracker />
          <div className="flex items-center gap-3">
            <NextImage src="/favicon.png" alt="Studzy" width={24} height={24} />
            <div>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white sm:text-xl">
                STUDZY AI
              </h2>
              <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
                DevCore&apos;23 edition • Created by <a href="https://samkiel.dev" target="_blank" rel="noopener noreferrer" className="text-primary-500 dark:text-primary-400 font-medium hover:underline">Samkiel</a>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={openFullWorkspace}
              disabled={openingWorkspace}
              className="flex items-center gap-1.5 rounded-lg bg-primary-50 px-2.5 py-1.5 text-xs font-bold text-primary-600 transition-colors hover:bg-primary-100 dark:bg-primary-900/30 dark:text-primary-400 dark:hover:bg-primary-900/50 sm:px-3 sm:text-sm"
              title="Open Full Workspace"
            >
              {openingWorkspace ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ExternalLink className="h-4 w-4" />
              )}
              <span className="hidden md:inline">Full Workspace</span>
            </button>
            <button
              onClick={clearChat}
              className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              title="Clear chat"
            >
              <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            <button
              onClick={safeClose}
              className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Messages Area */}
        <div 
          ref={containerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-4 pt-[60px] pb-[120px] sm:px-6 sm:pt-4 sm:pb-4 scroll-smooth"
        >
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50 dark:bg-primary-900/20">
                <NextImage src="/favicon.png" alt="Studzy" width={32} height={32} />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                How can I help you today?
              </h3>
              <p className="mt-2 max-w-sm text-sm text-neutral-500 dark:text-neutral-400">
                DevCore&apos;23 edition • Created by <a 
                href="https://samkiel.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-500 dark:text-primary-400 font-medium hover:underline">Samkiel</a> • Expert SWE Assistant
              </p>
              <div className="mt-8 grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
                {[
                  { label: "Explain a topic", prompt: "Explain the concept of..." },
                  { label: "Help with code", prompt: "Debug this code..." },
                ].map((item, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(item.prompt)}
                    className="rounded-xl border border-neutral-200 p-3 text-left text-sm transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6 py-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div className={`flex max-w-[85%] gap-3 ${message.role === "user" ? "flex-row-reverse text-right" : ""}`}>
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full overflow-hidden ${
                      message.role === "assistant" 
                        ? "bg-white dark:bg-neutral-800 p-1" 
                        : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
                    }`}>
                      {message.role === "assistant" ? (
                        <NextImage src="/favicon.png" alt="Studzy" width={24} height={24} />
                      ) : (
                        <User className="h-4 w-4" />
                      )}
                    </div>
                    <div className="group relative">
                      <div className={`rounded-2xl px-4 py-3 text-sm ${
                        message.role === "user"
                          ? "bg-primary-600 text-white"
                          : "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white"
                      }`}>
                        {message.images && message.images.length > 0 && (
                          <div className="mb-2 grid grid-cols-2 gap-2">
                            {message.images.map((img, idx) => (
                              <img
                                key={idx}
                                src={img}
                                alt={`Uploaded ${idx + 1}`}
                                className="h-24 w-full rounded-lg object-cover"
                              />
                            ))}
                          </div>
                        )}
                        <ReactMarkdown
                          className="prose-sm dark:prose-invert max-w-none"
                          remarkPlugins={[remarkGfm]}
                          components={{
                            table({ children }) {
                              return (
                                <div className="my-2 overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-700">
                                  <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700 text-sm">
                                    {children}
                                  </table>
                                </div>
                              );
                            },
                            thead({ children }) {
                              return <thead className="bg-neutral-50 dark:bg-neutral-800">{children}</thead>;
                            },
                            th({ children }) {
                              return <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">{children}</th>;
                            },
                            td({ children }) {
                              return <td className="px-3 py-2 text-neutral-600 dark:text-neutral-400 border-t border-neutral-100 dark:border-neutral-800">{children}</td>;
                            },
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                      <button
                        onClick={() => handleCopy(message.content, message.id)}
                        className={`absolute -bottom-6 flex items-center gap-1 text-[10px] text-neutral-400 transition-opacity hover:text-neutral-600 dark:hover:text-neutral-300 ${
                          message.role === "user" ? "right-0" : "left-0"
                        }`}
                      >
                        {copyingId === message.id ? (
                          <Check className="h-3 w-3 text-green-500" />
                        ) : (
                          <Clipboard className="h-3 w-3" />
                        )}
                        {copyingId === message.id ? "Copied" : "Copy"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white dark:bg-neutral-800 p-1">
                      <NextImage src="/favicon.png" alt="Studzy" width={24} height={24} />
                    </div>
                    <div className="rounded-2xl bg-neutral-100 px-4 py-3 dark:bg-neutral-800">
                      <div className="flex items-center gap-1.5 py-1">
                        <div className="h-2 w-2 animate-bounce rounded-full bg-primary-500 [animation-delay:-0.3s]" />
                        <div className="h-2 w-2 animate-bounce rounded-full bg-primary-500 [animation-delay:-0.15s]" />
                        <div className="h-2 w-2 animate-bounce rounded-full bg-primary-500" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Options Menu Popover */}
        {showOptionsMenu && (
          <div className="fixed bottom-24 left-4 z-[70] w-48 rounded-xl border border-neutral-200 bg-white p-2 shadow-xl dark:border-neutral-800 dark:bg-neutral-900 sm:absolute sm:bottom-20">
            <div className="space-y-1">
              <button
                onClick={() => {
                  fileInputRef.current?.click();
                  setShowOptionsMenu(false);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-600 transition-colors hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-neutral-800"
              >
                <ImageUp className="h-4 w-4" />
                <span>Upload Images</span>
              </button>
              {(Object.keys(modeConfig) as ChatMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setMode(m);
                    setShowOptionsMenu(false);
                  }}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                    mode === m
                      ? "bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400"
                      : "text-neutral-600 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-neutral-800"
                  }`}
                >
                  {modeConfig[m].icon}
                  <span>{modeConfig[m].label} Mode</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Fixed Footer Input */}
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-neutral-200 bg-white/80 p-4 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-900/80 sm:relative sm:bottom-auto sm:border-none sm:bg-transparent">
          {images.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {images.map((img, index) => (
                <div key={index} className="relative">
                  <img src={img} alt="Preview" className="h-12 w-12 rounded-lg object-cover" />
                  <button 
                    onClick={() => removeImage(index)} 
                    className="absolute -right-1 -top-1 rounded-full bg-red-500 p-0.5 text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="flex items-end gap-2">
            <input 
              ref={fileInputRef} 
              type="file" 
              accept="image/*" 
              multiple 
              onChange={handleImageUpload} 
              className="hidden" 
            />

            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask STUDZY AI..."
              className="sm:max-h-[40vh] max-h-32 min-h-[44px] flex-1 resize-none rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 placeholder-neutral-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white sm:text-base"
              rows={1}
            />

            <button
              type={isLoading ? "button" : "submit"}
              onClick={isLoading ? handleStop : undefined}
              disabled={!isLoading && (!input.trim() && images.length === 0)}
              className={`flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-xl text-white transition-all ${
                isLoading 
                  ? "bg-red-500 hover:bg-red-600" 
                  : "bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
              }`}
            >
              {isLoading ? <StopCircle className="h-5 w-5" /> : <Send className="h-5 w-5" />}
            </button>
          </form>
          <p className="mt-2 text-center text-[10px] text-neutral-400 dark:text-neutral-500">
            Studzy AI doesn&apos;t make mistakes, check that your question is correct.
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
};
