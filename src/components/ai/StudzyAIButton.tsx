"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { StudzyAIModal } from "./StudzyAIModal";
import { createClient } from "@/lib/supabase/client";

export function StudzyAIButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const pathname = usePathname();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsAuthenticated(!!user);
    });
  }, []);

  // Handle Dragging
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      // Calculate movement
      const moveX = clientX - dragStartPos.current.x;
      const moveY = clientY - dragStartPos.current.y;

      setPosition(prev => ({
        x: prev.x - moveX,
        y: prev.y - moveY
      }));

      dragStartPos.current = { x: clientX, y: clientY };
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setTimeout(() => setIsDragging(false), 50);
      }
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchmove", handleMouseMove);
      window.addEventListener("touchend", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleMouseMove);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, [isDragging, isAuthenticated]);

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    dragStartPos.current = { x: clientX, y: clientY };
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isDragging) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    setIsOpen(true);
  };

  if (!isAuthenticated || pathname.startsWith("/studzyai")) return null;

  return (
    <>
      <button
        ref={buttonRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
        onClick={handleClick}
        style={{
          transform: `translate(${-position.x}px, ${-position.y}px)`,
          touchAction: 'none'
        }}
        className="fixed bottom-6 right-4 z-[60] flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary-600 to-primary-500 p-3 font-medium text-white shadow-lg transition-shadow hover:shadow-xl active:scale-95 sm:right-6 sm:px-5 sm:py-3 cursor-move"
        aria-label="Ask STUDZY AI"
      >
        <svg
          className="h-6 w-6 sm:h-5 sm:w-5 pointer-events-none"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z"
          />
        </svg>
        <span className="hidden sm:inline pointer-events-none">Ask STUDZY AI</span>
      </button>

      <StudzyAIModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
