"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import {
  MessageSquare,
  Image as ImageIcon,
  Globe,
  Code,
  Sparkles,
  Send,
  Loader2,
  ImageUp,
  X,
  Menu,
} from "lucide-react";
import type { ChatMessage, ChatMode } from "@/types/database";

interface ChatPanelProps {
  sessionId: string;
  initialMessages: ChatMessage[];
  onToggleSidebar: () => void;
  onSessionUpdate: (title: string) => void;
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
}: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [mode, setMode] = useState<ChatMode>("chat");
  const [input, setInput] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [enableSearch, setEnableSearch] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Update messages when session changes
  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Focus input
  useEffect(() => {
    inputRef.current?.focus();
  }, [sessionId]);

  // Handle paste for images
  const handlePaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            setImage(ev.target?.result as string);
            setMode("image");
          };
          reader.readAsDataURL(file);
        }
      }
    }
  }, []);

  useEffect(() => {
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [handlePaste]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImage(ev.target?.result as string);
        setMode("image");
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!input.trim() && !image) || isLoading) return;

    const content = input.trim();
    setInput("");
    setIsLoading(true);

    // Optimistic user message
    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      session_id: sessionId,
      role: "user",
      content,
      mode,
      image_url: image,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    const sentImage = image;
    setImage(null);

    try {
      const response = await fetch(`/api/ai/sessions/${sessionId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          mode,
          image: sentImage,
          enable_search: enableSearch || mode === "search",
        }),
      });

      if (!response.ok) throw new Error("Failed to get response");

      const data = await response.json();

      // Replace temp user message and add assistant message
      setMessages((prev) => {
        const withoutTemp = prev.filter((m) => m.id !== tempUserMsg.id);
        const newMessages = [...withoutTemp];
        if (data.userMessage) newMessages.push(data.userMessage);
        else newMessages.push(tempUserMsg);
        if (data.assistantMessage) {
          newMessages.push(data.assistantMessage);
        } else {
          // Fallback if DB save failed but we got AI response
          newMessages.push({
            id: `assistant-${Date.now()}`,
            session_id: sessionId,
            role: "assistant",
            content: data.content,
            mode,
            image_url: null,
            created_at: new Date().toISOString(),
          });
        }
        return newMessages;
      });

      // Update session title in sidebar
      if (data.sessionTitle) {
        onSessionUpdate(data.sessionTitle);
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
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
    <div className="flex h-full flex-1 flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-neutral-200 px-4 py-3 dark:border-neutral-800 lg:px-6">
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex-1">
          <h1 className="flex items-center gap-2 text-lg font-bold text-neutral-900 dark:text-white">
            <Sparkles className="h-5 w-5 text-primary-500" />
            STUDZY AI
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Created by{" "}
            <a
              href="https://samkiel.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-500 hover:underline"
            >
              Samkiel
            </a>
          </p>
        </div>

        {/* Mode Tabs */}
        <div className="hidden gap-1 sm:flex">
          {(Object.keys(modeConfig) as ChatMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                mode === m
                  ? "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400"
                  : "text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
              }`}
            >
              {modeConfig[m].icon}
              {modeConfig[m].label}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Mode Tabs */}
      <div className="flex gap-1 border-b border-neutral-200 px-4 py-2 dark:border-neutral-800 sm:hidden">
        {(Object.keys(modeConfig) as ChatMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex flex-1 items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${
              mode === m
                ? "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400"
                : "text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
            }`}
          >
            {modeConfig[m].icon}
            {modeConfig[m].label}
          </button>
        ))}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-4 text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-100 to-primary-50 shadow-sm dark:from-primary-900/30 dark:to-primary-900/10">
              <Sparkles className="h-10 w-10 text-primary-600 dark:text-primary-400" />
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
                { text: "Explain a complex topic", icon: "📚" },
                { text: "Help debug my code", icon: "🐛" },
                { text: "Summarize my notes", icon: "📝" },
                { text: "Create flashcards", icon: "🗂️" },
              ].map((suggestion) => (
                <button
                  key={suggestion.text}
                  onClick={() => setInput(suggestion.text)}
                  className="flex items-center gap-2 rounded-xl border border-neutral-200 px-4 py-3 text-left text-sm text-neutral-700 transition-all hover:border-primary-300 hover:bg-primary-50/50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-primary-800 dark:hover:bg-primary-900/10"
                >
                  <span className="text-lg">{suggestion.icon}</span>
                  {suggestion.text}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 lg:px-8">
            {messages.map((message) => (
              <div key={message.id} className="flex gap-3">
                {/* Avatar */}
                <div
                  className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    message.role === "user"
                      ? "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400"
                      : "bg-gradient-to-br from-primary-500 to-primary-600 text-white"
                  }`}
                >
                  {message.role === "user" ? "U" : "S"}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <p className="mb-1 text-xs font-medium text-neutral-500 dark:text-neutral-400">
                    {message.role === "user" ? "You" : "STUDZY AI"}
                  </p>

                  {message.image_url && (
                    <img
                      src={message.image_url}
                      alt="Uploaded"
                      className="mb-2 max-h-60 rounded-lg border border-neutral-200 dark:border-neutral-700"
                    />
                  )}

                  {message.role === "assistant" ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-semibold prose-p:leading-relaxed prose-pre:bg-neutral-900 prose-pre:text-neutral-100">
                      <ReactMarkdown
                        components={{
                          code({ className, children, ...props }) {
                            const match = /language-(\w+)/.exec(className || "");
                            const isInline = !match;
                            return isInline ? (
                              <code
                                className="rounded bg-neutral-100 px-1.5 py-0.5 text-sm font-medium text-primary-700 dark:bg-neutral-800 dark:text-primary-400"
                                {...props}
                              >
                                {children}
                              </code>
                            ) : (
                              <pre className="overflow-x-auto rounded-xl bg-neutral-900 p-4 text-sm text-neutral-100">
                                <code className={className} {...props}>
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
                    <p className="whitespace-pre-wrap text-neutral-900 dark:text-neutral-100">
                      {message.content}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-600 text-sm font-bold text-white">
                  S
                </div>
                <div className="flex-1">
                  <p className="mb-1 text-xs font-medium text-neutral-500 dark:text-neutral-400">
                    STUDZY AI
                  </p>
                  <div className="flex items-center gap-1.5 py-2">
                    <div className="h-2 w-2 animate-bounce rounded-full bg-primary-500 [animation-delay:-0.3s]" />
                    <div className="h-2 w-2 animate-bounce rounded-full bg-primary-500 [animation-delay:-0.15s]" />
                    <div className="h-2 w-2 animate-bounce rounded-full bg-primary-500" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Section */}
      <div className="border-t border-neutral-200 bg-white px-4 py-4 dark:border-neutral-800 dark:bg-neutral-950 lg:px-8">
        <div className="mx-auto max-w-3xl">
          {/* Image Preview */}
          {image && (
            <div className="mb-3 flex items-start gap-2">
              <div className="relative">
                <img
                  src={image}
                  alt="Preview"
                  className="h-20 w-20 rounded-lg border border-neutral-200 object-cover dark:border-neutral-700"
                />
                <button
                  onClick={removeImage}
                  className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow-md hover:bg-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}

          {/* Input Row */}
          <div className="flex items-end gap-2">
            {/* Upload & Search Buttons */}
            <div className="flex shrink-0 gap-1 pb-1">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="rounded-lg p-2 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
                title="Upload image"
              >
                <ImageUp className="h-5 w-5" />
              </button>
              <button
                onClick={() => setEnableSearch(!enableSearch)}
                className={`rounded-lg p-2 transition-colors ${
                  enableSearch
                    ? "bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400"
                    : "text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
                }`}
                title="Toggle search"
              >
                <Globe className="h-5 w-5" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
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
                className="max-h-40 min-h-[44px] w-full resize-none rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 placeholder-neutral-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:placeholder-neutral-400"
                rows={1}
              />
            </div>

            {/* Send Button */}
            <div className="shrink-0 pb-1">
              <button
                onClick={() => handleSubmit()}
                disabled={(!input.trim() && !image) || isLoading}
                className="flex h-[44px] w-[44px] items-center justify-center rounded-xl bg-primary-600 text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <p className="mt-2 text-center text-xs text-neutral-400 dark:text-neutral-500">
            Press Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
