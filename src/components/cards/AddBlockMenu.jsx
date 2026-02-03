import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Link, Image, Code, CheckSquare, Video, Zap } from 'lucide-react';
import { cn } from "@/lib/utils";

const BLOCK_TYPES = [
  { type: 'text', icon: FileText, label: 'טקסט', description: 'טקסט עשיר עם Markdown', color: 'from-blue-500 to-blue-600' },
  { type: 'link', icon: Link, label: 'קישור', description: 'קישור עם תצוגה מקדימה', color: 'from-green-500 to-green-600' },
  { type: 'image', icon: Image, label: 'תמונה', description: 'הוסף תמונה מ-URL', color: 'from-pink-500 to-pink-600' },
  { type: 'code', icon: Code, label: 'קוד', description: 'קוד עם הדגשת תחביר', color: 'from-amber-500 to-amber-600' },
  { type: 'checklist', icon: CheckSquare, label: 'רשימת משימות', description: 'משימות עם סימון', color: 'from-violet-500 to-violet-600' },
  { type: 'video', icon: Video, label: 'וידאו', description: 'YouTube / Vimeo / קובץ', color: 'from-red-500 to-red-600' },
];

export default function AddBlockMenu({ onSelect, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="absolute top-full right-0 left-0 mt-2 p-4 rounded-xl bg-slate-800 border border-slate-700 shadow-xl z-10"
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {BLOCK_TYPES.map((block, index) => {
          const Icon = block.icon;
          return (
            <motion.button
              key={block.type}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03 }}
              onClick={() => onSelect(block.type)}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-200",
                "bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 hover:border-slate-500",
                "hover:shadow-lg hover:-translate-y-0.5"
              )}
            >
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br", block.color)}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <span className="font-medium text-white text-sm">{block.label}</span>
              <span className="text-xs text-slate-400 text-center">{block.description}</span>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}