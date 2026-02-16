"use client";

import { useState } from "react";
import QRCode from "react-qr-code";
import { ExternalLink, User as UserIcon } from "lucide-react";

interface StudentIDCardProps {
  displayName: string;
  username: string;
  bio: string | null;
  learningGoal: string | null;
  avatarUrl: string | null;
}

export function StudentIDCard({ displayName, username, bio, learningGoal, avatarUrl }: StudentIDCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div className="group h-[220px] w-full cursor-pointer perspective-1000" onClick={() => setIsFlipped(!isFlipped)}>
      <div className={`relative h-full w-full transition-all duration-700 preserve-3d ${isFlipped ? "rotate-y-180" : ""}`}>
        {/* Front Side */}
        <div className="absolute inset-0 backface-hidden rounded-2xl bg-gradient-to-br from-primary-600 to-primary-800 p-6 text-white shadow-xl module-3d">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-[10px] font-bold tracking-widest uppercase opacity-80">Studzy ID</p>
              <h3 className="text-xl font-black italic tracking-tighter">STUDZY</h3>
            </div>
            <div className="h-10 w-10 overflow-hidden rounded-lg border-2 border-white/20 bg-white/10">
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <UserIcon className="h-6 w-6 opacity-30" />
                </div>
              )}
            </div>
          </div>

          <div className="mt-8">
            <p className="text-lg font-bold truncate tracking-tight">{displayName}</p>
            <p className="text-[10px] font-medium opacity-70">@{username}</p>
            <div className="mt-4 flex items-center justify-between">
              <div>
                <p className="text-[8px] uppercase opacity-50">Department</p>
                <p className="text-[10px] font-bold">Software Engineering</p>
              </div>
              <div>
                <p className="text-[8px] uppercase opacity-50">Edition</p>
                <p className="text-[10px] font-bold">DevCore&apos;23</p>
              </div>
            </div>
          </div>
          
          <div className="absolute bottom-4 right-6 flex items-center gap-1 opacity-40">
            <span className="text-[10px] font-medium">Click to flip</span>
            <ExternalLink className="h-3 w-3" />
          </div>
        </div>

        {/* Back Side */}
        <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-2xl bg-neutral-900 p-6 text-white shadow-xl overflow-hidden module-3d">
          <div className="flex h-full gap-4">
            <div className="flex-1 space-y-3 overflow-hidden">
              <div>
                <p className="text-[8px] uppercase text-primary-400 font-bold">About Me</p>
                <p className="text-[11px] leading-relaxed line-clamp-3 opacity-90 italic">
                  &quot;{bio || "Passionate about building the future of software."}&quot;
                </p>
              </div>
              <div>
                <p className="text-[8px] uppercase text-primary-400 font-bold">Learning Goal</p>
                <p className="text-[11px] line-clamp-2 font-medium">
                  {learningGoal || "Mastering full-stack development."}
                </p>
              </div>
              <div className="pt-2 text-[9px] text-neutral-500 font-mono">
                verified_id: {username.toUpperCase()}_DC23
              </div>
            </div>
            
            <div className="flex flex-col items-center justify-center gap-2 border-l border-white/10 pl-4">
              <div className="h-16 w-16 bg-white p-1 rounded flex items-center justify-center">
                <QRCode 
                  value={`https://studzy.me/u/${username}`}
                  size={56}
                  style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                  viewBox={`0 0 256 256`}
                />
              </div>
              <p className="text-[8px] font-bold tracking-widest text-primary-500">SCAN ME</p>
            </div>
          </div>
          
          {/* Subtle background branding */}
          <div className="absolute -bottom-4 -left-4 text-4xl font-black text-white/5 select-none">
            STUDZY
          </div>
        </div>
      </div>
    </div>
  );
}
