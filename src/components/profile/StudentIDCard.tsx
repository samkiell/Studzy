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
  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);

  // --- Capture Side Logic ---
  const captureSide = async (ref: React.RefObject<HTMLDivElement>) => {
    if (!ref.current) return null;
    const html2canvas = (await import("html2canvas")).default;
    return await html2canvas(ref.current, {
      scale: 3,
      useCORS: true,
      backgroundColor: "#0a0a0a", // Match site dark mode exactly
      logging: false,
      onclone: (doc) => {
        // Find the element in the cloned document
        // We look for any element that might have the rotation class
        const clonedEl = doc.querySelector(`[ref="${ref.current}"]`) || doc.getElementById(ref.current!.id);
        if (clonedEl instanceof HTMLElement) {
          clonedEl.style.transform = "none";
          clonedEl.style.transition = "none";
        }
        
        // Also ensure any parent containers in the clone don't have rotation
        const elementsWithRotation = doc.querySelectorAll(".rotate-y-180, .preserve-3d");
        elementsWithRotation.forEach((el) => {
          if (el instanceof HTMLElement) {
            el.style.transform = "none";
            el.style.perspective = "none";
          }
        });
      }
    });
  };

  // --- Export Logic ---
  const handleExport = async (format: "png" | "pdf") => {
    setIsExporting(true);

    try {
      const frontCanvas = await captureSide(frontRef);
      const backCanvas = await captureSide(backRef);

      if (!frontCanvas || !backCanvas) throw new Error("Capture failed");

      if (format === "png") {
        // Front
        const frontLink = document.createElement("a");
        frontLink.download = `studzy-id-${username}-front.png`;
        frontLink.href = frontCanvas.toDataURL("image/png");
        frontLink.click();

        // Small delay for browser
        await new Promise(r => setTimeout(r, 500));

        // Back
        const backLink = document.createElement("a");
        backLink.download = `studzy-id-${username}-back.png`;
        backLink.href = backCanvas.toDataURL("image/png");
        backLink.click();
      } else if (format === "pdf") {
        const jspdfModule = await import("jspdf");
        const jsPDF = jspdfModule.jsPDF || jspdfModule.default;
        
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a7"
        });
        
        const width = pdf.internal.pageSize.getWidth();
        const height = pdf.internal.pageSize.getHeight();
        
        pdf.addImage(frontCanvas.toDataURL("image/png"), "PNG", 0, 0, width, height);
        pdf.addPage();
        pdf.addImage(backCanvas.toDataURL("image/png"), "PNG", 0, 0, width, height);
        
        pdf.save(`studzy-id-${username}.pdf`);
      }
    } catch (err) {
      console.error("Export failed:", err);
      alert("Failed to export card.");
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Shared Card Styles
  const cardFaceClasses = "relative h-[450px] w-[300px] overflow-hidden rounded-3xl shadow-2xl border border-white/5 ring-1 ring-white/5";

  // Shared Front Face Content
  const FrontFaceContent = () => (
    <div id="id-front" className={`${cardFaceClasses} bg-[#0a0a0a]`}>
      {/* Background Decor */}
      <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-primary-950/30 to-transparent z-0" />
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      
      {/* Content */}
      <div className="relative z-10 h-full flex flex-col p-6 text-white justify-between bg-white/0 backdrop-blur-[1px]">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10 shadow-inner">
              <Image src="/favicon.png" alt="Logo" width={18} height={18} />
            </div>
            <span className="font-bold tracking-wider text-xs opacity-80">STUDZY ID</span>
          </div>
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full border border-white/10 bg-white/5">
            <span className="text-[10px] font-bold tracking-wider uppercase text-white/90">OAU</span>
            <div className="w-4 h-4 relative">
              <Image src="/oau.png" alt="OAU" fill className="object-contain" />
            </div>
          </div>
        </div>

        <div className="text-center space-y-5">
          <div className="relative mx-auto w-32 h-32">
             <div className="absolute inset-0 rounded-full border border-dashed border-primary-500/30 animate-[spin_15s_linear_infinite]" />
             <div className="absolute inset-2 rounded-full border border-white/10" />
             <div className="absolute inset-3 rounded-full overflow-hidden bg-neutral-900 shadow-2xl ring-1 ring-white/10">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-neutral-800">
                    <span className="text-3xl font-black text-primary-400">{username.charAt(0).toUpperCase()}</span>
                  </div>
                )}
             </div>
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-black tracking-tight text-white drop-shadow-sm">{displayName}</h2>
            <p className="text-primary-400 font-bold text-sm tracking-tight">@{username}</p>
          </div>
          <div className="flex flex-col gap-2 w-full pt-2">
            <div className="flex justify-between items-center px-4 py-2.5 rounded-xl bg-white/5 border border-white/5 backdrop-blur-md">
              <span className="text-[9px] uppercase text-neutral-500 font-black tracking-widest">Department</span>
              <span className="text-[11px] font-bold text-white/90">Software Engineering</span>
            </div>
            <div className="flex justify-between items-center px-4 py-2.5 rounded-xl bg-white/5 border border-white/5 backdrop-blur-md">
              <span className="text-[9px] uppercase text-neutral-500 font-black tracking-widest">Edition</span>
              <span className="text-[11px] font-bold text-white/90 truncate max-w-[110px]">DevCore&apos;23</span>
            </div>
          </div>
        </div>

        <div className="mt-auto pt-6 flex justify-between items-end border-t border-white/5">
           <div className="text-[9px] text-neutral-500 font-bold opacity-80 italic tracking-tighter">
              &quot;Study smarter. Stress less.&quot;
           </div>
           <div className="bg-white p-1 rounded-lg shadow-xl ring-1 ring-black/10">
              <QRCode value={`https://studzy.me/u/${username}`} size={40} />
           </div>
        </div>
      </div>
    </div>
  );

  // Shared Back Face Content
  const BackFaceContent = () => (
    <div id="id-back" className={`${cardFaceClasses} bg-[#0a0a0a]`}>
      <div className="absolute inset-0 bg-gradient-to-t from-primary-950/20 to-transparent z-10" />
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary-900 via-transparent to-transparent z-0" />
      
      <div className="relative z-20 h-full p-6 flex flex-col text-white">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-black flex items-center gap-2 tracking-widest text-white/90">
            <Trophy className="w-4 h-4 text-primary-400" />
            PLAYER_STATS
          </h3>
          <span className="text-[10px] text-neutral-600 font-mono font-bold">VERIFIED_AUTH</span>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center gap-1.5 backdrop-blur-sm">
            <Flame className="w-5 h-5 text-orange-500" />
            <span className="text-2xl font-black tabular-nums">{stats.streak}</span>
            <span className="text-[9px] uppercase text-neutral-500 font-black tracking-widest">Streak</span>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center gap-1.5 backdrop-blur-sm">
            <Clock className="w-5 h-5 text-primary-400" />
            <span className="text-2xl font-black tabular-nums">{stats.hours}</span>
            <span className="text-[9px] uppercase text-neutral-500 font-black tracking-widest">Hours</span>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center gap-1.5 backdrop-blur-sm">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <span className="text-2xl font-black tabular-nums">#{stats.rank}</span>
            <span className="text-[9px] uppercase text-neutral-500 font-black tracking-widest">Rank</span>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center gap-1.5 backdrop-blur-sm">
            <Bookmark className="w-5 h-5 text-emerald-500" />
            <span className="text-2xl font-black tabular-nums">{stats.bookmarks}</span>
            <span className="text-[9px] uppercase text-neutral-500 font-black tracking-widest">Saved</span>
          </div>
        </div>

        <div className="mt-auto p-4 rounded-2xl bg-primary-950/20 border border-primary-500/10 text-center">
          <p className="text-xs font-black text-primary-200 uppercase tracking-tighter leading-relaxed">
            &quot;DevCore&apos;23, Pioneering the future of Software Engineering&quot;
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col items-center gap-6">
      
      {/* 1. SCREEN DISPLAY (Interactive 3D) */}
      <div className="print:hidden">
        <div 
          className="group relative h-[450px] w-[300px] cursor-pointer perspective-1000"
          onClick={() => !isExporting && setIsFlipped(!isFlipped)}
        >
          <div className={`relative h-full w-full transition-all duration-700 preserve-3d ${isFlipped ? "rotate-y-180" : ""}`}>
            {/* Front Side Wrapper */}
            <div className="absolute inset-0 backface-hidden" ref={frontRef}>
               <FrontFaceContent />
               <div className="absolute inset-x-0 bottom-4 flex justify-center opacity-0 group-hover:opacity-40 transition-opacity">
                  <RotateCcw className="w-4 h-4 text-white animate-pulse" />
               </div>
            </div>

            {/* Back Side Wrapper */}
            <div className="absolute inset-0 backface-hidden rotate-y-180" ref={backRef}>
               <BackFaceContent />
               <div className="absolute inset-x-0 bottom-4 flex justify-center opacity-40">
                  <RotateCcw className="w-4 h-4 text-white animate-pulse" />
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. PRINT LAYOUT (Hidden on screen) */}
      <div className="hidden print:flex flex-col items-center gap-8 bg-white py-8">
         <div className="page-break-after-always">
            <FrontFaceContent />
         </div>
         <div>
            <BackFaceContent />
         </div>
      </div>

      {/* 3. INTERACTIVE CONTROLS (Hidden in print) */}
      <div className="flex flex-col gap-2 w-full max-w-[300px] print:hidden">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsFlipped(!isFlipped)} className="flex-1">
            <RotateCcw className="w-3 h-3 mr-2" /> Flip
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint} className="flex-1">
            <Printer className="w-3 h-3 mr-2" /> Print
          </Button>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={() => handleExport("png")} disabled={isExporting} className="flex-1 bg-neutral-900 text-white">
            {isExporting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3 mr-2" />}
            PNG
          </Button>
          <Button onClick={() => handleExport("pdf")} disabled={isExporting} className="flex-1 bg-primary-600 text-white">
            {isExporting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Share2 className="w-3 h-3 mr-2" />}
            PDF
          </Button>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          @page { size: A7; margin: 0; }
          body { background: white !important; }
          body * { visibility: hidden; }
          .print\:flex, .print\:flex * { visibility: visible; }
          .print\:flex { position: absolute; left: 0; top: 0; width: 100%; display: flex !important; }
          .page-break-after-always { page-break-after: always; break-after: page; }
        }
      `}</style>
    </div>
  );
}
