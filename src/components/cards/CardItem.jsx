import React from 'react';
import { motion } from 'framer-motion';
import { Star, Link, Image, Code, CheckSquare, Video, Zap, FileText, MoreVertical } from 'lucide-react';
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const BLOCK_ICONS = {
  text: FileText,
  link: Link,
  image: Image,
  code: Code,
  checklist: CheckSquare,
  video: Video,
  api: Zap,
};

export default function CardItem({ 
  card, 
  viewMode, 
  isSelecting, 
  isSelected, 
  onSelect, 
  onClick, 
  onToggleFavorite,
  index 
}) {
  const blockTypes = [...new Set(card.content_blocks?.map(b => b.type) || [])];
  
  const getPreviewContent = () => {
    const textBlock = card.content_blocks?.find(b => b.type === 'text');
    if (textBlock) {
      return textBlock.content?.substring(0, 100) + (textBlock.content?.length > 100 ? '...' : '');
    }
    return null;
  };

  if (viewMode === 'list') {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ delay: index * 0.03 }}
        onClick={onClick}
        className={cn(
          "group flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all duration-200",
          "bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600",
          isSelected && "ring-2 ring-violet-500 bg-violet-500/10"
        )}
        style={{ borderRightWidth: '4px', borderRightColor: card.color || '#8B5CF6' }}
      >
        {isSelecting && (
          <div onClick={(e) => { e.stopPropagation(); onSelect(); }}>
            <Checkbox checked={isSelected} className="border-slate-500" />
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-white truncate">{card.title}</h3>
            {card.is_smart_card && (
              <Badge variant="secondary" className="bg-amber-500/20 text-amber-300 text-xs">
                <Zap className="w-3 h-3 ml-1" />
                חכמה
              </Badge>
            )}
          </div>
          {getPreviewContent() && (
            <p className="text-sm text-slate-400 truncate">{getPreviewContent()}</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {blockTypes.slice(0, 3).map(type => {
            const Icon = BLOCK_ICONS[type] || FileText;
            return (
              <Icon key={type} className="w-4 h-4 text-slate-500" />
            );
          })}
          
          {card.tags?.length > 0 && (
            <div className="hidden sm:flex gap-1">
              {card.tags.slice(0, 2).map(tag => (
                <Badge key={tag} variant="outline" className="text-xs border-slate-600 text-slate-400">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
          
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Star className={cn(
              "w-5 h-5 transition-colors",
              card.is_favorite ? "text-amber-400 fill-amber-400" : "text-slate-500 hover:text-amber-400"
            )} />
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: index * 0.03 }}
      onClick={onClick}
      className={cn(
        "group relative rounded-2xl cursor-pointer transition-all duration-300",
        "bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600",
        "hover:shadow-xl hover:shadow-violet-500/10 hover:-translate-y-1",
        isSelected && "ring-2 ring-violet-500 bg-violet-500/10"
      )}
    >
      {/* Color Strip */}
      <div 
        className="h-2 rounded-t-2xl"
        style={{ backgroundColor: card.color || '#8B5CF6' }}
      />
      
      <div className="p-4">
        {/* Selection Checkbox */}
        {isSelecting && (
          <div 
            className="absolute top-4 left-4"
            onClick={(e) => { e.stopPropagation(); onSelect(); }}
          >
            <Checkbox checked={isSelected} className="border-slate-500" />
          </div>
        )}

        {/* Favorite Button */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
          className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Star className={cn(
            "w-5 h-5 transition-colors",
            card.is_favorite ? "text-amber-400 fill-amber-400" : "text-slate-500 hover:text-amber-400"
          )} />
        </button>

        {/* Title */}
        <h3 className="font-semibold text-white mb-2 pr-8 line-clamp-2">{card.title}</h3>

        {/* Preview Content */}
        {getPreviewContent() && (
          <p className="text-sm text-slate-400 mb-3 line-clamp-2">{getPreviewContent()}</p>
        )}

        {/* Block Type Indicators */}
        <div className="flex items-center gap-2 mb-3">
          {blockTypes.map(type => {
            const Icon = BLOCK_ICONS[type] || FileText;
            return (
              <div 
                key={type} 
                className="w-7 h-7 rounded-lg bg-slate-700/50 flex items-center justify-center"
              >
                <Icon className="w-4 h-4 text-slate-400" />
              </div>
            );
          })}
          {card.is_smart_card && (
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Zap className="w-4 h-4 text-amber-400" />
            </div>
          )}
        </div>

        {/* Tags */}
        {card.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {card.tags.slice(0, 3).map(tag => (
              <Badge 
                key={tag} 
                variant="outline" 
                className="text-xs border-slate-600 text-slate-400 bg-slate-700/30"
              >
                {tag}
              </Badge>
            ))}
            {card.tags.length > 3 && (
              <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">
                +{card.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}