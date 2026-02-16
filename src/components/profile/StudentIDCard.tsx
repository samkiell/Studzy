"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import QRCode from "react-qr-code";
import { 
  Download, 
  Share2, 
  Trophy, 
  Flame, 
  Clock, 
  Bookmark, 
  Printer, 
  RotateCcw
} from "lucide-react";
// Moved to dynamic imports inside handleExport to prevent build-time resolution issues with core-js

import { Button } from "@/components/ui/Button"; // Assuming Button exists, or use generic
import { Loader2 } from "lucide-react";

interface StudentIDCardProps {
  displayName: string;
  username: string;
  bio: string | null; // Kept for interface compatibility but might not be used on face
  learningGoal: string | null;
  avatarUrl: string | null;
  role?: string; // "Student" | "Admin"
  stats?: {
    streak: number;
    hours: number;
    rank: number;
    bookmarks: number;
  };
}

export function StudentIDCard({ 
  displayName, 
  username, 
  avatarUrl,
  role = "Student",
  stats = { streak: 0, hours: 0, rank: 0, bookmarks: 0 }
}: StudentIDCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // --- Export Logic ---
  const handleExport = async (format: "png" | "pdf") => {
    if (!cardRef.current) return;
    setIsExporting(true);

    try {
      // Create a clone to render cleanly without UI controls or flip state issues
      // For this implementation, we'll try to capture the *current* face or enforce front face
      // But typically ID cards export the FRONT. Let's force front face visibility for capture.
      
      const element = cardRef.current;
      const wasFlipped = isFlipped;
      if (wasFlipped) setIsFlipped(false);

      // Wait for flip transition if needed, but better to capture a dedicated wrapper
      // Using a short timeout to ensure state update if we flipped back
      if (wasFlipped) await new Promise(r => setTimeout(r, 600));

      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const canvas = await html2canvas(element, {
        scale: 3, // High res
        useCORS: true,
        backgroundColor: null, // Transparent if possible, but card has bg
        logging: false,
      });

      if (format === "png") {
        const link = document.createElement("a");
        link.download = `studzy-id-${username}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      } else if (format === "pdf") {
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a7" // A7 size as requested
        });
        
        const width = pdf.internal.pageSize.getWidth();
        const height = pdf.internal.pageSize.getHeight();
        
        pdf.addImage(imgData, "PNG", 0, 0, width, height);
        pdf.save(`studzy-id-${username}.pdf`);
      }

      // Restore state
      if (wasFlipped) setIsFlipped(true);

    } catch (err) {
      console.error("Export failed:", err);
      alert("Failed to export card. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col items-center gap-6 print:block print:w-full print:h-screen print:flex-none">
      
      {/* 3D Card Container */}
      <div 
        className="group relative h-[450px] w-[300px] cursor-pointer perspective-1000 print:perspective-none print:h-auto print:w-[300px] print:m-0"
        onClick={() => !isExporting && setIsFlipped(!isFlipped)}
      >
        <div 
          ref={cardRef}
          className={`relative h-full w-full transition-all duration-700 preserve-3d ${isFlipped ? "rotate-y-180" : ""} print:transform-none`}
        >
          {/* --- FRONT SIDE --- */}
          <div className="absolute inset-0 backface-hidden rounded-3xl overflow-hidden shadow-2xl print:shadow-none print:static">
            {/* Background / Glassmorphism */}
            <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 z-0" />
            
            {/* Decorations */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            
            {/* Glass Overlay Pattern */}
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay z-0" />

            {/* Content Container */}
            <div className="relative z-10 h-full flex flex-col p-6 text-white justify-between border border-white/10 rounded-3xl bg-white/5 backdrop-blur-[2px]">
              
              {/* Header */}
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/20">
                    <Image src="/favicon.png" alt="Logo" width={20} height={20} className="object-contain" />
                  </div>
                  <span className="font-bold tracking-wide text-sm opacity-90">STUDZY ID</span>
                </div>
                <div className="px-2 py-0.5 rounded-full border border-white/20 bg-white/5 text-[10px] font-medium tracking-wider uppercase">
                  {role}
                </div>
              </div>

              {/* Main Profile Info */}
              <div className="text-center space-y-4 mt-4">
                {/* Avatar Ring */}
                <div className="relative mx-auto w-32 h-32">
                   <div className="absolute inset-0 rounded-full border-2 border-dashed border-white/30 animate-[spin_10s_linear_infinite]" />
                   <div className="absolute inset-2 rounded-full border-2 border-white/20" />
                   <div className="absolute inset-3 rounded-full overflow-hidden bg-neutral-800 shadow-inner">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-neutral-700">
                          <span className="text-2xl font-bold">{username.charAt(0).toUpperCase()}</span>
                        </div>
                      )}
                   </div>
                </div>

                {/* Identity */}
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-white">{displayName}</h2>
                  <p className="text-primary-400 font-medium text-sm">@{username}</p>
                </div>

                {/* Chips */}
                <div className="flex flex-col gap-2 w-full">
                  <div className="flex justify-between items-center px-3 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                    <span className="text-[10px] uppercase text-neutral-400 font-semibold">Department</span>
                    <span className="text-xs font-bold text-white">Software Engineering</span>
                  </div>
                  <div className="flex justify-between items-center px-3 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                    <span className="text-[10px] uppercase text-neutral-400 font-semibold">Edition</span>
                    <span className="text-xs font-bold text-white text-right">DevCore&apos;23</span>
                  </div>
                </div>
              </div>

              {/* Footer / QR */}
              <div className="mt-auto pt-6 flex justify-between items-end border-t border-white/10">
                 <div className="text-[10px] text-neutral-400 font-medium max-w-[120px] leading-tight opacity-70">
                    &quot;Study smarter. Stress less.&quot;
                 </div>
                 <div className="bg-white p-1 rounded-lg">
                    <QRCode value={`https://studzy.me/u/${username}`} size={42} />
                 </div>
              </div>

            </div>
          </div>

          {/* --- BACK SIDE --- */}
          <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-3xl overflow-hidden shadow-2xl bg-neutral-900 border border-neutral-800 print:hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary-900 via-neutral-900 to-black z-0" />
            
            <div className="relative z-20 h-full p-6 flex flex-col">
              
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-yellow-400" />
                  Your Stats
                </h3>
                <span className="text-xs text-neutral-500 font-mono">LIVE_DATA</span>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center text-center gap-1">
                  <Flame className="w-5 h-5 text-orange-500 mb-1" />
                  <span className="text-2xl font-black text-white">{stats.streak}</span>
                  <span className="text-[10px] uppercase text-neutral-400 font-bold tracking-wider">Day Streak</span>
                </div>
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center text-center gap-1">
                  <Clock className="w-5 h-5 text-blue-400 mb-1" />
                  <span className="text-2xl font-black text-white">{stats.hours}</span>
                  <span className="text-[10px] uppercase text-neutral-400 font-bold tracking-wider">Total Hours</span>
                </div>
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center text-center gap-1">
                  <Trophy className="w-5 h-5 text-yellow-500 mb-1" />
                  <span className="text-2xl font-black text-white">#{stats.rank}</span>
                  <span className="text-[10px] uppercase text-neutral-400 font-bold tracking-wider">Rank</span>
                </div>
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center text-center gap-1">
                  <Bookmark className="w-5 h-5 text-emerald-400 mb-1" />
                  <span className="text-2xl font-black text-white">{stats.bookmarks}</span>
                  <span className="text-[10px] uppercase text-neutral-400 font-bold tracking-wider">Saved</span>
                </div>
              </div>

              {/* Motivational Quote */}
              <div className="mt-auto p-4 rounded-xl bg-gradient-to-r from-primary-900/40 to-primary-800/40 border border-primary-500/20 mb-2">
                <p className="text-sm font-bold text-center text-primary-200 italic">
                  &quot;DevCore&apos;23 no dey carry last.&quot;
                </p>
              </div>

               {/* Return Flip Hint */}
               <div className="mt-4 flex justify-center opacity-40">
                  <RotateCcw className="w-4 h-4 text-white animate-pulse" />
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls - Hidden in Print Mode */}
      <div className="flex flex-wrap gap-2 justify-center w-full max-w-[300px] print:hidden">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setIsFlipped(!isFlipped)}
          className="flex-1 border-neutral-200 dark:border-neutral-700"
        >
          <RotateCcw className="w-3 h-3 mr-2" />
          Flip
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handlePrint}
          className="flex-1 border-neutral-200 dark:border-neutral-700"
        >
          <Printer className="w-3 h-3 mr-2" />
          Print
        </Button>
      </div>
      
      <div className="flex gap-2 w-full max-w-[300px] print:hidden">
        <Button 
          onClick={() => handleExport("png")} 
          disabled={isExporting} 
          className="flex-1 bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900"
        >
          {isExporting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3 mr-2" />}
          PNG
        </Button>
        <Button 
          onClick={() => handleExport("pdf")} 
          disabled={isExporting}
          className="flex-1 bg-primary-600 text-white hover:bg-primary-700"
        >
          {isExporting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Share2 className="w-3 h-3 mr-2" />}
          PDF
        </Button>
      </div>

    </div>
  );
}
