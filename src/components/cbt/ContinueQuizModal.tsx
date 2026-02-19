"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Clock, RefreshCcw, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

interface ContinueQuizModalProps {
  isOpen: boolean;
  onContinue: () => void;
  onStartNew: () => void;
  lastStartedAt?: string;
}

export function ContinueQuizModal({ 
  isOpen, 
  onContinue, 
  onStartNew,
  lastStartedAt 
}: ContinueQuizModalProps) {
  const formattedDate = lastStartedAt 
    ? new Date(lastStartedAt).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : "your previous session";

  return (
    <Modal isOpen={isOpen} onClose={() => {}} title="">
      <div className="p-6 md:p-8 space-y-8">
        {/* Header Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-20 h-20 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <Clock className="w-10 h-10 text-indigo-400" />
            </div>
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -right-2 -bottom-2 w-8 h-8 rounded-full bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center backdrop-blur-sm"
            >
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
            </motion.div>
          </div>
        </div>

        {/* Content */}
        <div className="text-center space-y-3">
          <h2 className="text-2xl font-bold text-white tracking-tight">Continue your quiz?</h2>
          <p className="text-gray-400 text-sm leading-relaxed max-w-xs mx-auto">
            We found an active session from <span className="text-indigo-400 font-medium">{formattedDate}</span>. Would you like to pick up where you left off?
          </p>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 gap-3">
          <Button 
            onClick={onContinue}
            className="h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-500/20 gap-3 font-semibold text-base"
          >
            <Clock className="w-5 h-5" />
            Resume Quiz
          </Button>
          
          <Button 
            variant="outline"
            onClick={onStartNew}
            className="h-14 rounded-2xl bg-white/5 border-white/10 hover:bg-white/10 hover:text-white text-gray-400 transition-all gap-3 font-medium"
          >
            <RefreshCcw className="w-5 h-5" />
            Start Fresh Session
          </Button>
        </div>

        {/* Note */}
        <p className="text-[10px] text-center text-gray-500 uppercase tracking-widest font-bold">
          Starting fresh will clear current progress
        </p>
      </div>
    </Modal>
  );
}
