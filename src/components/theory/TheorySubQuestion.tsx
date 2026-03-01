"use client";

import type { TheorySubQuestion as SubQuestionType } from "@/types/theory";

interface TheorySubQuestionProps {
  subQuestion: SubQuestionType;
  value: string;
  onChange: (value: string) => void;
}

export default function TheorySubQuestion({
  subQuestion,
  value,
  onChange,
}: TheorySubQuestionProps) {
  return (
    <div className="bg-[#0E0E10] border border-white/5 rounded-xl p-4">
      <label className="block text-sm font-medium text-gray-200 mb-2">
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-bold mr-2">
          {subQuestion.label}
        </span>
        {subQuestion.content}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Answer for part ${subQuestion.label}...`}
        rows={4}
        className="w-full bg-[#121214] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all text-white placeholder-gray-600 resize-y min-h-[80px] text-sm"
      />
    </div>
  );
}
