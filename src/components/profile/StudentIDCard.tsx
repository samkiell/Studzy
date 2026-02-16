"use client";

import { useState, useRef, useEffect } from "react";
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
  RotateCcw,
  Camera,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { toast } from "react-hot-toast";

interface StudentIDCardProps {
  displayName: string;
  username: string;
  avatarUrl: string | null;
  role?: string;
  isViewOnly?: boolean;
  initialStack?: string;
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
  isViewOnly = false,
  initialStack = "Frontend Dev",
  stats = { streak: 0, hours: 0, rank: 0, bookmarks: 0 }
}: StudentIDCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState(avatarUrl);
  const [stack, setStack] = useState(initialStack);
  const [showStackMenu, setShowStackMenu] = useState(false);
  
  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stackOptions = [
    "Frontend Dev",
    "Backend Dev",
    "Full Stack Dev",
    "UI/UX Dev",
    "Mobile Dev",
    "Game Dev"
  ];

  // Sync internal state
  useEffect(() => {
    setCurrentAvatarUrl(avatarUrl);
  }, [avatarUrl]);

  // --- Avatar Upload Logic ---
  const handleAvatarClick = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    if (!isUploading && !isViewOnly) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image too large (max 5MB)");
      return;
    }

    setIsUploading(true);
    const uploadToast = toast.loading("Uploading new avatar...");

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/profile/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setCurrentAvatarUrl(data.url);
      toast.success("Avatar updated!", { id: uploadToast });
    } catch (err: any) {
      console.error("Upload error:", err);
      toast.error(err.message || "Failed to upload avatar", { id: uploadToast });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // --- Capture Side Logic ---
  const captureSide = async (ref: React.RefObject<HTMLDivElement>, isBack: boolean = false) => {
    if (!ref.current) return null;
    const html2canvas = (await import("html2canvas")).default;
    
    return await html2canvas(ref.current, {
      scale: 3,
      useCORS: true,
      backgroundColor: "#0a0a0a",
      logging: false,
      allowTaint: true,
      onclone: (doc) => {
        const clonedEl = doc.getElementById(ref.current!.id);
        if (clonedEl instanceof HTMLElement) {
          // Deep clean targeting mirroring and bending
          clonedEl.style.transform = "none";
          clonedEl.style.transition = "none";
          clonedEl.style.perspective = "none";
          clonedEl.style.position = "relative";
          clonedEl.style.top = "0";
          clonedEl.style.left = "0";
          clonedEl.style.width = "300px";
          clonedEl.style.height = "450px";
          clonedEl.style.overflow = "visible";
          
          // Force all descendants to be flat
          const children = clonedEl.querySelectorAll("*");
          children.forEach((child) => {
            if (child instanceof HTMLElement) {
              child.style.transform = "none";
              child.style.transition = "none";
              child.style.perspective = "none";
              child.style.backfaceVisibility = "visible";
              child.style.backdropFilter = "none";
              child.style.animation = "none";
            }
          });

          // Special fix for the back-side mirroring: 
          // If we are capturing the back side, it's often inside a container that is rotated.
          // We must find any parent with rotate-y-180 and neutralize it in the clone.
          let parent = clonedEl.parentElement;
          while (parent) {
             parent.style.transform = "none";
             parent.style.perspective = "none";
             parent.style.transition = "none";
             parent = parent.parentElement;
          }
        }
      }
    });
  };

  // --- Export Logic ---
  const handleExport = async (format: "png" | "pdf") => {
    setIsExporting(true);
    try {
      const wasFlipped = isFlipped;
      
      // Capture front
      setIsFlipped(false);
      await new Promise(r => setTimeout(r, 600)); 
      const frontCanvas = await captureSide(frontRef, false);
      
      // Capture back
      setIsFlipped(true);
      await new Promise(r => setTimeout(r, 800)); 
      const backCanvas = await captureSide(backRef, true);

      setIsFlipped(wasFlipped);

      if (!frontCanvas || !backCanvas) throw new Error("Capture failed");

      if (format === "png") {
        const frontLink = document.createElement("a");
        frontLink.download = `studzy-id-${username}-front.png`;
        frontLink.href = frontCanvas.toDataURL("image/png");
        frontLink.click();
        await new Promise(r => setTimeout(r, 500));
        const backLink = document.createElement("a");
        backLink.download = `studzy-id-${username}-back.png`;
        backLink.href = backCanvas.toDataURL("image/png");
        backLink.click();
      } else if (format === "pdf") {
        const jspdfModule = await import("jspdf");
        const jsPDF = jspdfModule.jsPDF || jspdfModule.default;
        const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a7" });
        const width = pdf.internal.pageSize.getWidth();
        const height = pdf.internal.pageSize.getHeight();
        pdf.addImage(frontCanvas.toDataURL("image/png"), "PNG", 0, 0, width, height);
        pdf.addPage();
        pdf.addImage(backCanvas.toDataURL("image/png"), "PNG", 0, 0, width, height);
        pdf.save(`studzy-id-${username}.pdf`);
      }
    } catch (err) {
      console.error("Export failed:", err);
      toast.error("Failed to export card.");
    } finally {
      setIsExporting(false);
    }
  };

  const cardFaceClasses = "relative h-[450px] w-[300px] overflow-hidden rounded-3xl shadow-2xl border border-white/5 ring-1 ring-white/5";

  const FrontFaceContent = () => (
    <div id="id-front" className={`${cardFaceClasses} bg-[#0a0a0a]`}>
      <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-primary-950/30 to-transparent z-0" />
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      
      <div className="relative z-10 h-full flex flex-col p-6 text-white justify-between">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
              <Image src="/favicon.png" alt="Logo" width={18} height={18} />
            </div>
            <span className="font-bold tracking-wider text-xs opacity-80 uppercase leading-none">Studzy ID</span>
          </div>
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full border border-white/10 bg-white/5">
            <span className="text-[10px] font-bold tracking-wider uppercase text-white/90">OAU</span>
            <div className="w-4 h-4 relative">
              <Image src="/oau.png" alt="OAU" fill className="object-contain" />
            </div>
          </div>
        </div>

        <div className="text-center space-y-5">
          <div 
            className={`relative mx-auto w-32 h-32 group/avatar ${isViewOnly ? '' : 'cursor-pointer'}`}
            onClick={handleAvatarClick}
          >
             <div className="absolute inset-0 rounded-full border border-dashed border-primary-500/30 animate-[spin_15s_linear_infinite]" />
             <div className="absolute inset-2 rounded-full border border-white/10" />
             <div className="absolute inset-3 rounded-full overflow-hidden bg-neutral-900 shadow-2xl ring-1 ring-white/10 transition-transform duration-300">
                {currentAvatarUrl ? (
                  <Image src={currentAvatarUrl} alt={displayName} fill className="object-cover" key={currentAvatarUrl} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-neutral-800/50 backdrop-blur-sm">
                    <Camera className="w-10 h-10 text-primary-500/40 animate-pulse" />
                  </div>
                )}
                {!isUploading && !isViewOnly && (
                  <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                    <Camera className="w-6 h-6 text-white/80 mb-1" />
                    <span className="text-[8px] font-bold uppercase tracking-widest text-white/80">Change Photo</span>
                  </div>
                )}
                {isUploading && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                  </div>
                )}
             </div>
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-black tracking-tight text-white drop-shadow-sm uppercase leading-none">@{username}</h2>
            <div className="relative inline-block">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isViewOnly) setShowStackMenu(!showStackMenu);
                }}
                className={`text-primary-400 font-bold text-sm tracking-tight flex items-center gap-1.5 transition-opacity ${!isViewOnly ? 'hover:opacity-80 active:scale-95' : ''}`}
                disabled={isViewOnly}
              >
                {stack.toUpperCase()}
                {!isViewOnly && <RotateCcw className="w-3 h-3 opacity-50" />}
              </button>
              
              {showStackMenu && !isViewOnly && (
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-40 bg-[#0f0f0f] border border-white/10 rounded-xl py-2 shadow-2xl z-50 backdrop-blur-xl ring-1 ring-white/5">
                  {stackOptions.map((opt) => (
                    <button
                      key={opt}
                      onClick={(e) => {
                        e.stopPropagation();
                        setStack(opt);
                        setShowStackMenu(false);
                        toast.success(`Role set to ${opt}`);
                      }}
                      className={`w-full text-left px-4 py-2 text-[10px] font-black tracking-widest uppercase transition-colors ${stack === opt ? 'text-primary-400 bg-white/5' : 'text-neutral-500 hover:text-white hover:bg-white/5'}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
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
              <QRCode value={`https://studzy.me/id/${username}`} size={40} />
           </div>
        </div>
      </div>
    </div>
  );

  const BackFaceContent = () => (
    <div id="id-back" className={`${cardFaceClasses} bg-[#0a0a0a]`}>
      <div className="absolute inset-0 bg-gradient-to-t from-primary-950/20 to-transparent z-10" />
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary-900 via-transparent to-transparent z-0" />
      
      <div className="relative z-20 h-full p-6 flex flex-col text-white">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-black flex items-center gap-2 tracking-widest text-white/90">
            <Trophy className="w-4 h-4 text-primary-400" />
            SWE_STATS
          </h3>
          <span className="text-[10px] text-neutral-600 font-mono font-bold tracking-tighter">Pioneer</span>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center gap-1.5 backdrop-blur-sm">
            <Flame className="w-5 h-5 text-orange-500" />
            <span className="text-2xl font-black tabular-nums leading-none">{stats.streak}</span>
            <span className="text-[9px] uppercase text-neutral-500 font-black tracking-widest leading-none">Streak</span>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center gap-1.5 backdrop-blur-sm">
            <Clock className="w-5 h-5 text-primary-400" />
            <span className="text-2xl font-black tabular-nums leading-none">{stats.hours}</span>
            <span className="text-[9px] uppercase text-neutral-500 font-black tracking-widest leading-none">Hours</span>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center gap-1.5 backdrop-blur-sm">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <span className="text-2xl font-black tabular-nums leading-none">#{stats.rank}</span>
            <span className="text-[9px] uppercase text-neutral-500 font-black tracking-widest leading-none">Rank</span>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center gap-1.5 backdrop-blur-sm">
            <Bookmark className="w-5 h-5 text-emerald-500" />
            <span className="text-2xl font-black tabular-nums leading-none">{stats.bookmarks}</span>
            <span className="text-[9px] uppercase text-neutral-500 font-black tracking-widest leading-none">Saved</span>
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
    <div className="flex flex-col items-center gap-6" onClick={() => setShowStackMenu(false)}>
      {!isViewOnly && <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />}

      <div>
        <div 
          className={`group relative h-[450px] w-[300px] cursor-pointer perspective-1000 ${isExporting ? 'pointer-events-none' : ''}`}
          onClick={() => !isExporting && !isUploading && setIsFlipped(!isFlipped)}
        >
          <div className={`relative h-full w-full transition-all duration-700 preserve-3d ${isFlipped ? "rotate-y-180" : ""}`}>
            <div className="absolute inset-0 backface-hidden" ref={frontRef}>
               <FrontFaceContent />
               {!isUploading && (
                 <div className="absolute inset-x-0 bottom-4 flex justify-center opacity-0 group-hover:opacity-40 transition-opacity">
                    <RotateCcw className="w-4 h-4 text-white animate-pulse" />
                 </div>
               )}
            </div>
            <div className="absolute inset-0 backface-hidden rotate-y-180" ref={backRef}>
               <BackFaceContent />
               <div className="absolute inset-x-0 bottom-4 flex justify-center opacity-40">
                  <RotateCcw className="w-4 h-4 text-white animate-pulse" />
               </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 w-full max-w-[300px]">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsFlipped(!isFlipped)} className="flex-1" disabled={isUploading || isExporting}>
            <RotateCcw className="w-3 h-3 mr-2" /> Flip Card
          </Button>
        </div>
        {!isViewOnly && (
          <div className="flex gap-2">
            <Button onClick={() => handleExport("png")} disabled={isExporting || isUploading} className="flex-1 bg-neutral-900 text-white">
              {isExporting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3 mr-2" />}
              Download PNG
            </Button>
            <Button onClick={() => handleExport("pdf")} disabled={isExporting || isUploading} className="flex-1 bg-primary-600 text-white">
              {isExporting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Share2 className="w-3 h-3 mr-2" />}
              Download PDF
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
