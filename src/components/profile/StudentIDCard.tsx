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
      backgroundColor: "#000000", // Force black to match theme
      logging: false,
      onclone: (doc) => {
        // Ensure the cloned element is visible and not flipped/hidden
        const el = doc.getElementById(ref.current!.id);
        if (el) {
          el.style.transform = "none";
          el.style.position = "relative";
          el.style.display = "block";
        }
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

        // Small delay for browser to handle first download
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
        
        // Page 1: Front
        pdf.addImage(frontCanvas.toDataURL("image/png"), "PNG", 0, 0, width, height);
        
        // Page 2: Back
        pdf.addPage();
        pdf.addImage(backCanvas.toDataURL("image/png"), "PNG", 0, 0, width, height);
        
        pdf.save(`studzy-id-${username}.pdf`);
      }
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

  // Shared Card Styles to ensure consistency between Screen/Print/Export
  const cardFaceClasses = "relative h-[450px] w-[300px] overflow-hidden rounded-3xl shadow-2xl border border-white/10 ring-1 ring-white/5";

  // Shared Front Face Content
  const FrontFaceContent = () => (
    <div id="id-front" className={`${cardFaceClasses} bg-neutral-900`}>
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 z-0" />
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      
      {/* Content */}
      <div className="relative z-10 h-full flex flex-col p-6 text-white justify-between bg-white/5 backdrop-blur-[2px]">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/20">
              <Image src="/favicon.png" alt="Logo" width={20} height={20} />
            </div>
            <span className="font-bold tracking-wide text-sm opacity-90">STUDZY ID</span>
          </div>
          <div className="px-2 py-0.5 rounded-full border border-white/20 bg-white/5 text-[10px] font-bold tracking-wider uppercase">
            OAU
          </div>
        </div>

        <div className="text-center space-y-4">
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
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">{displayName}</h2>
            <p className="text-primary-400 font-medium text-sm">@{username}</p>
          </div>
          <div className="flex flex-col gap-2 w-full">
            <div className="flex justify-between items-center px-3 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <span className="text-[10px] uppercase text-neutral-400 font-semibold">Department</span>
              <span className="text-xs font-bold text-white">Software Engineering</span>
            </div>
            <div className="flex justify-between items-center px-3 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <span className="text-[10px] uppercase text-neutral-400 font-semibold">Edition</span>
              <span className="text-xs font-bold text-white truncate max-w-[100px] text-right">DevCore&apos;23</span>
            </div>
          </div>
        </div>

        <div className="mt-auto pt-6 flex justify-between items-end border-t border-white/10">
           <div className="text-[10px] text-neutral-400 font-medium opacity-70 italic">
              &quot;Study smarter. Stress less.&quot;
           </div>
           <div className="bg-white p-1 rounded-lg">
              <QRCode value={`https://studzy.me/u/${username}`} size={42} />
           </div>
        </div>
      </div>
    </div>
  );

  // Shared Back Face Content
  const BackFaceContent = () => (
    <div id="id-back" className={`${cardFaceClasses} bg-neutral-900 border-neutral-800`}>
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 to-neutral-900 z-10" />
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary-900 via-neutral-900 to-black z-0" />
      
      <div className="relative z-20 h-full p-6 flex flex-col text-white">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-400" />
            Your Stats
          </h3>
          <span className="text-xs text-neutral-500 font-mono">ID_VERIFIED</span>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center gap-1">
            <Flame className="w-5 h-5 text-orange-500" />
            <span className="text-2xl font-black">{stats.streak}</span>
            <span className="text-[10px] uppercase text-neutral-400 font-bold tracking-wider">Day Streak</span>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center gap-1">
            <Clock className="w-5 h-5 text-blue-400" />
            <span className="text-2xl font-black">{stats.hours}</span>
            <span className="text-[10px] uppercase text-neutral-400 font-bold tracking-wider">Total Hours</span>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center gap-1">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <span className="text-2xl font-black">#{stats.rank}</span>
            <span className="text-[10px] uppercase text-neutral-400 font-bold tracking-wider">Rank</span>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center gap-1">
            <Bookmark className="w-5 h-5 text-emerald-400" />
            <span className="text-2xl font-black">{stats.bookmarks}</span>
            <span className="text-[10px] uppercase text-neutral-400 font-bold tracking-wider">Saved</span>
          </div>
        </div>

        <div className="mt-auto p-4 rounded-xl bg-gradient-to-r from-primary-900/40 to-primary-800/40 border border-primary-500/20">
          <p className="text-sm font-bold text-center text-primary-200 italic leading-relaxed">
            &quot;DevCore&apos;23 no dey carry last.&quot;
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
