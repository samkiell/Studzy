"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  MessageSquare,
  Image as ImageIcon,
  Globe,
  Code,
  Send,
  Loader2,
  ImageUp,
  X,
  Menu,
  Plus,
  Copy,
  Check,
  PanelLeftClose,
  PanelLeftOpen,
  ExternalLink,
  User,
} from "lucide-react";
import NextImage from "next/image";
import type { ChatMessage, ChatMode } from "@/types/database";

interface ChatPanelProps {
  sessionId: string;
  initialMessages: ChatMessage[];
  onToggleSidebar: () => void;
  onSessionUpdate: (title: string) => void;
  onNewChat: () => void;
  sidebarOpen: boolean;
}

const modeConfig: Record<ChatMode, { icon: React.ReactNode; label: string }> = {
  chat: { icon: <MessageSquare className="h-4 w-4" />, label: "Chat" },
  image: { icon: <ImageIcon className="h-4 w-4" />, label: "Image" },
  search: { icon: <Globe className="h-4 w-4" />, label: "Search" },
  code: { icon: <Code className="h-4 w-4" />, label: "Code" },
};

export function ChatPanel({
  sessionId,
  initialMessages,
  onToggleSidebar,
  onSessionUpdate,
  onNewChat,
  sidebarOpen,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  
  // Hide system messages from view
  const visibleMessages = messages.filter(m => m.role !== 'system');
  const [mode, setMode] = useState<ChatMode>("chat");
  const [input, setInput] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [enableSearch, setEnableSearch] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  // Close options menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowOptionsMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Update messages when session changes
  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  // Handle scroll events to detect if user is at bottom
  const handleScroll = () => {
    if (!scrollAreaRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollAreaRef.current;
    
    // Check if user is within 100px of bottom
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setIsAtBottom(isNearBottom);
  };

  // Auto-scroll logic: only if user is already at bottom
  useEffect(() => {
    if (isAtBottom && scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages, isLoading, isAtBottom]);

  // Auto-focus on PC
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    if (!isMobile) {
      inputRef.current?.focus();
    }
  }, [sessionId]); // Re-focus when switching sessions

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };



  // Handle paste for images
  const handlePaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          processImageFile(file);
        }
      }
    }
  }, []);

  useEffect(() => {
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [handlePaste]);

  const processImageFile = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      alert(`Image ${file.name} is over 10MB`);
      return;
    }
    setImageFiles(prev => [...prev, file]);
    setMode("image");
    
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setImages(prev => [...prev, result]);
    };
    reader.readAsDataURL(file);
  };

  // Auto-trigger response if last message was from user (e.g. from "Explain with AI")
  const triggerAIResponse = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const response = await fetch(`/api/ai/sessions/${sessionId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trigger_only: true,
          mode,
          enable_search: enableSearch || mode === "search",
        }),
      });

      if (!response.ok) throw new Error("Failed to get response");
      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";
      
      const assistantMsgId = `assistant-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMsgId,
          session_id: sessionId,
          role: "assistant",
          content: "",
          mode,
          image_url: null,
          created_at: new Date().toISOString(),
        },
      ]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        assistantContent += chunk;

        setMessages((prev) => {
          const lastMsg = prev[prev.length - 1];
          if (lastMsg.id === assistantMsgId) {
            return [
              ...prev.slice(0, -1),
              { ...lastMsg, content: assistantContent }
            ];
          }
          return prev;
        });
      }
    } catch (error) {
      console.error("Auto-trigger Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          session_id: sessionId,
          role: "assistant", // Using assistant role for error message
          content: "Sorry, I encountered an error responding to your request.",
          mode,
          image_url: null,
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, mode, enableSearch]); // removed isLoading to avoid loops if state updates fast, but actually safe.

  useEffect(() => {
    if (initialMessages.length > 0) {
      const lastMsg = initialMessages[initialMessages.length - 1];
      if (lastMsg.role === 'user') {
        triggerAIResponse();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => processImageFile(file));
    }
    // Respect the input for same-file re-uploads if needed
    if (e.target) e.target.value = "";
  };

  const uploadImageToStorage = async (file: File): Promise<string | null> => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/ai/upload-image", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        console.error("Image upload failed:", data.error);
        return null;
      }

      const data = await res.json();
      return data.url;
    } catch (err) {
      console.error("Image upload error:", err);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!input.trim() && images.length === 0) || isLoading || isUploading) return;

    const content = input.trim();
    setInput("");
    setIsLoading(true);

    // Upload images to storage if present
    let uploadedUrls: string[] = [];
    if (imageFiles.length > 0) {
      setIsUploading(true);
      try {
        const uploadPromises = imageFiles.map(file => uploadImageToStorage(file));
        const results = await Promise.all(uploadPromises);
        uploadedUrls = results.filter((url): url is string => url !== null);
      } catch (err) {
        console.error("Multi-upload error:", err);
      } finally {
        setIsUploading(false);
      }

      if (uploadedUrls.length === 0 && !content) {
        setIsLoading(false);
        return;
      }
    }

    // Combine local data URLs if upload failed but we want to show something, or just use uploaded ones
    const finalImageUrls = uploadedUrls.length > 0 ? uploadedUrls : images;

    // Optimistic user message
    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      session_id: sessionId,
      role: "user",
      content,
      mode,
      image_url: finalImageUrls[0] || null, // Keeping for compatibility
      created_at: new Date().toISOString(),
    };
    
    // We'll store multiple images as a JSON string in image_url for now if needed,
    // but the API will handle 'image' as an array if we update it.
    
    setMessages((prev) => [...prev, tempUserMsg]);
    setImages([]);
    setImageFiles([]);

    try {
      const response = await fetch(`/api/ai/sessions/${sessionId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          mode,
          images: uploadedUrls,
          enable_search: enableSearch || mode === "search",
        }),
      });

      if (!response.ok) throw new Error("Failed to get response");
      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";
      
      // Create a stable assistant message structure
      const assistantMsgId = `assistant-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMsgId,
          session_id: sessionId,
          role: "assistant",
          content: "",
          mode,
          image_url: null,
          created_at: new Date().toISOString(),
        },
      ]);

      setIsLoading(false); // We can show the message bubble now

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        assistantContent += chunk;

        setMessages((prev) => {
          const lastMsg = prev[prev.length - 1];
          if (lastMsg.id === assistantMsgId) {
            return [
              ...prev.slice(0, -1),
              { ...lastMsg, content: assistantContent }
            ];
          }
          return prev;
        });
      }

    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          session_id: sessionId,
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
          mode,
          image_url: null,
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    
    // On Desktop: Enter sends, Ctrl+Enter or Shift+Enter adds newline
    // On Mobile: Enter always adds newline (standard mobile textarea behavior)
    if (e.key === "Enter") {
      if (isMobile) {
        // Let it go to new line naturally
        return;
      }
      
      if (!e.shiftKey && !e.ctrlKey) {
        e.preventDefault();
        handleSubmit();
      }
      // If Shift or Ctrl is pressed, allow newline
    }
  };

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 160) + "px";
  };

  return (
    <div ref={containerRef} className={`flex h-screen flex-1 flex-col overflow-hidden transition-all duration-300 ${
      sidebarOpen ? "md:ml-[280px]" : "ml-0"
    }`}>
      {/* Header */}
      <div 
        className="sticky top-0 z-40 flex items-center gap-3 border-b border-neutral-200 bg-white/80 px-4 py-3 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-900/80 md:px-6 md:pt-8 md:pb-6"
      >
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
        >
          {sidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
        </button>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <NextImage src="/favicon.png" alt="Studzy" width={20} height={20} />
            <h1 className="text-lg font-bold text-neutral-900 dark:text-white">
              STUDZY AI
            </h1>
          </div>
          <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
            DevCore&apos;23 edition • Created by <a href="https://samkiel.dev" target="_blank" rel="noopener noreferrer" className="text-primary-500 dark:text-primary-400 font-medium hover:underline">Samkiel</a>
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onNewChat}
            className="flex items-center gap-1.5 rounded-lg bg-primary-50 px-2 py-1.5 text-xs font-bold text-primary-600 transition-colors hover:bg-primary-100 dark:bg-primary-900/30 dark:text-primary-400 dark:hover:bg-primary-900/50 sm:px-3 sm:py-1.5 sm:text-sm"
            title="Start New Chat"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Chat</span>
          </button>
        </div>
      </div>



      {/* Messages Area */}
      <div 
        ref={scrollAreaRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto pb-[100px] scroll-smooth"
      >
        {visibleMessages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-4 text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-100 to-primary-50 shadow-sm dark:from-primary-900/30 dark:to-primary-900/10">
              <NextImage src="/favicon.png" alt="Studzy" width={40} height={40} />
            </div>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
              How can I help you today?
            </h2>
            <p className="mt-2 max-w-md text-neutral-500 dark:text-neutral-400">
              Ask me anything about your studies. I can explain concepts, help
              with code, analyze images, and search for information.
            </p>
            <div className="mt-8 grid max-w-lg grid-cols-2 gap-3">
              {[
                { 
                  label: "Explain a complex topic", 
                  icon: "📚", 
                  prompt: "Explain the concept of [ENTER TOPIC] in detail. Break it down into simple terms, use analogies, and provide examples for a Software Engineering student." 
                },
                { 
                  label: "Help debug my code", 
                  icon: "🐛", 
                  prompt: "I need help debugging this code: [PASTE CODE]. The issue is [DESCRIBE ISSUE]. Can you find the bug and suggest a fix?" 
                },
                { 
                  label: "Summarize my notes", 
                  icon: "📝", 
                  prompt: "Summarize these notes into clear, structured bullet points and highlight the most important takeaways: [PASTE NOTES HERE]" 
                },
                { 
                  label: "Create a quiz", 
                  icon: "❓", 
                  prompt: "Generate a practice quiz with 5 multiple-choice questions about [ENTER TOPIC]. Include explanations for the correct answers." 
                },
              ].map((suggestion) => (
                <button
                  key={suggestion.label}
                  onClick={() => {
                    setInput(suggestion.prompt);
                    if (inputRef.current) {
                      inputRef.current.value = suggestion.prompt;
                      inputRef.current.style.height = 'auto';
                      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 160) + "px";
                      inputRef.current.focus();
                    }
                  }}
                  className="flex items-center gap-2 rounded-xl border border-neutral-200 px-4 py-3 text-left text-sm text-neutral-700 transition-all hover:border-primary-300 hover:bg-primary-50/50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-primary-800 dark:hover:bg-primary-900/10"
                >
                  <span className="text-lg">{suggestion.icon}</span>
                  {suggestion.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-5xl space-y-4 px-4 py-6 md:px-8 lg:px-12">
            {visibleMessages.map((message) => (
              <div
                key={message.id}
                className={`group relative flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`flex max-w-[85%] gap-3 ${
                    message.role === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full overflow-hidden ${
                      message.role === "user"
                        ? "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400"
                        : "bg-white dark:bg-neutral-800 p-1"
                    }`}
                  >
                    {message.role === "user" ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <NextImage src="/favicon.png" alt="Studzy" width={24} height={24} />
                    )}
                  </div>

                  {/* Content */}
                  <div
                    className={`relative min-w-0 select-text rounded-2xl px-4 py-3 ${
                      message.role === "user"
                        ? "bg-primary-600 text-white"
                        : "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100"
                    }`}
                  >
                    {/* Copy Button */}
                    <button
                      onClick={() => copyToClipboard(message.content, message.id)}
                      className={`absolute -top-2 ${message.role === 'user' ? '-left-8' : '-right-8'} opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg bg-white dark:bg-neutral-800 shadow-sm border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700`}
                      title="Copy message"
                    >
                      {copiedId === message.id ? (
                        <Check className="h-3.5 w-3.5 text-green-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5 text-neutral-400" />
                      )}
                    </button>
                    {message.image_url && !message.image_url.startsWith('[') && (
                      <img
                        src={message.image_url}
                        alt="Uploaded"
                        className="mb-2 max-h-60 rounded-lg border border-neutral-200 dark:border-neutral-700"
                      />
                    )}

                    {/* Handle multiple images if stored as JSON in image_url or similar */}
                    {message.image_url?.startsWith('[') && (
                      <div className="mb-2 grid grid-cols-2 gap-2">
                        {JSON.parse(message.image_url).map((url: string, idx: number) => (
                          <img
                            key={idx}
                            src={url}
                            alt={`Uploaded image ${idx + 1}`}
                            className="h-32 w-full rounded-lg border border-neutral-200 object-cover dark:border-neutral-700"
                          />
                        ))}
                      </div>
                    )}

                    {message.role === "assistant" ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-semibold prose-p:leading-relaxed prose-pre:bg-neutral-900 prose-pre:text-neutral-100">
                        <ReactMarkdown
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
                            code({ className, children, ...props }) {
                              const match = /language-(\w+)/.exec(className || "");
                              const isInline = !match;
                              return isInline ? (
                                <code
                                  className="rounded bg-neutral-200 px-1.5 py-0.5 text-sm font-medium text-primary-700 dark:bg-neutral-700 dark:text-primary-400"
                                  {...props}
                                >
                                  {children}
                                </code>
                              ) : (
                                  <pre className="block w-full overflow-x-auto rounded-xl bg-neutral-900 p-4 text-sm text-neutral-100 scrollbar-thin scrollbar-thumb-neutral-700">
                                    <code className={`${className} block min-w-full`} {...props}>
                                      {children}
                                    </code>
                                  </pre>
                              );
                            },
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">
                        {message.content}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex max-w-[85%] gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white dark:bg-neutral-800 p-1">
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

            {/* Invisible anchor for scrolling if needed, but we use scrollAreaRef mostly */}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        )}
      </div>

      {/* Input Section */}
      <div className="sticky bottom-0 z-30 border-t border-neutral-200 bg-white/80 px-4 py-4 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-950/80 lg:px-8">
        <div className="mx-auto max-w-3xl">
          {/* Multiple Image Previews */}
          {images.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-3">
              {images.map((src, index) => (
                <div key={index} className="relative group/preview">
                  <div className="relative h-20 w-20 overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-700">
                    <img
                      src={src}
                      alt={`Preview ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                    {isUploading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <Loader2 className="h-5 w-5 animate-spin text-white" />
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => removeImage(index)}
                    disabled={isUploading}
                    className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow-md transition-transform hover:scale-110 hover:bg-red-600 disabled:opacity-50"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Options Menu Popover */}
          <div className="relative mx-auto max-w-3xl">
            {showOptionsMenu && (
              <div className="absolute bottom-16 left-0 z-50 w-48 rounded-xl border border-neutral-200 bg-white p-2 shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      fileInputRef.current?.click();
                      setShowOptionsMenu(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-600 transition-colors hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-neutral-800"
                  >
                    <ImageUp className="h-4 w-4" />
                    <span>Upload Image</span>
                  </button>

                  {(Object.keys(modeConfig) as (keyof typeof modeConfig)[]).map((m) => (
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
          </div>

          {/* Input Row */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowOptionsMenu(!showOptionsMenu)}
                className={`flex h-[44px] w-[44px] items-center justify-center rounded-xl border border-neutral-200 transition-colors dark:border-neutral-700 ${
                  showOptionsMenu 
                    ? "bg-primary-50 text-primary-600 dark:bg-primary-900/30" 
                    : "bg-neutral-50 text-neutral-500 hover:bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
                }`}
              >
                {showOptionsMenu ? (
                  <Plus className="h-5 w-5 rotate-45" />
                ) : (
                  <div className="flex items-center justify-center">
                    {mode === "chat" && <MessageSquare className="h-5 w-5" />}
                    {mode === "image" && <ImageIcon className="h-5 w-5" />}
                    {mode === "search" && <Globe className="h-5 w-5" />}
                    {mode === "code" && <Code className="h-5 w-5" />}
                  </div>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            {/* Textarea */}
            <div className="flex-1">
              <textarea
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={
                  mode === "code"
                    ? "Describe the code you need..."
                    : mode === "image"
                    ? "Ask about the image..."
                    : mode === "search"
                    ? "Search for information..."
                    : "Ask STUDZY AI anything..."
                }
                className="max-h-40 min-h-[44px] w-full resize-none rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 placeholder-neutral-500 placeholder:text-xs focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:placeholder-neutral-400 sm:placeholder:text-sm"
                rows={1}
              />
            </div>

            {/* Send Button */}
            <div className="shrink-0">
              <button
                onClick={() => handleSubmit()}
                disabled={(!input.trim() && images.length === 0) || isLoading || isUploading}
                className="flex h-[44px] w-[44px] items-center justify-center rounded-xl bg-primary-600 text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading || isUploading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <p className="mt-2 text-center text-[10px] text-neutral-400 dark:text-neutral-500">
            Studzy AI doesn&apos;t make mistakes, check that your question is correct.
          </p>
        </div>
      </div>
    </div>
  );
}
