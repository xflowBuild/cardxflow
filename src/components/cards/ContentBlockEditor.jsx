import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  GripVertical, Edit2, Trash2, Copy, Check, X,
  FileText, Link, Image, Code, CheckSquare, Video, ExternalLink, Play
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import ReactMarkdown from 'react-markdown';

const BLOCK_CONFIG = {
  text: { icon: FileText, label: 'טקסט', color: 'text-blue-400' },
  link: { icon: Link, label: 'קישור', color: 'text-green-400' },
  image: { icon: Image, label: 'תמונה', color: 'text-pink-400' },
  code: { icon: Code, label: 'קוד', color: 'text-amber-400' },
  checklist: { icon: CheckSquare, label: 'רשימת משימות', color: 'text-violet-400' },
  video: { icon: Video, label: 'וידאו', color: 'text-red-400' },
};

export default function ContentBlockEditor({ block, index, onUpdate, onDelete, onDuplicate }) {
  const [isEditing, setIsEditing] = useState(!block.content && block.type !== 'checklist');
  const [isHovered, setIsHovered] = useState(false);

  const config = BLOCK_CONFIG[block.type] || BLOCK_CONFIG.text;
  const Icon = config.icon;

  const renderContent = () => {
    switch (block.type) {
      case 'text':
        return isEditing ? (
          <Textarea
            value={block.content || ''}
            onChange={(e) => onUpdate({ content: e.target.value })}
            placeholder="הכנס טקסט..."
            className="min-h-[100px] bg-slate-800/50 border-slate-600 text-white resize-none"
            autoFocus
          />
        ) : (
          <div className="prose prose-invert prose-sm max-w-none">
            <ReactMarkdown>{block.content || 'לחץ לעריכה...'}</ReactMarkdown>
          </div>
        );

      case 'link':
        return isEditing ? (
          <div className="space-y-3">
            <Input
              value={block.content || ''}
              onChange={(e) => onUpdate({ content: e.target.value })}
              placeholder="הכנס כתובת URL..."
              className="bg-slate-800/50 border-slate-600 text-white"
              autoFocus
            />
            <Input
              value={block.metadata?.title || ''}
              onChange={(e) => onUpdate({ metadata: { ...block.metadata, title: e.target.value } })}
              placeholder="כותרת הקישור (אופציונלי)"
              className="bg-slate-800/50 border-slate-600 text-white"
            />
          </div>
        ) : (
          <a
            href={block.content}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-colors group"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <Link className="w-5 h-5 text-green-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-white truncate">
                {block.metadata?.title || block.content}
              </p>
              <p className="text-sm text-slate-400 truncate">{block.content}</p>
            </div>
            <ExternalLink className="w-5 h-5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </a>
        );

      case 'image':
        return isEditing ? (
          <Input
            value={block.content || ''}
            onChange={(e) => onUpdate({ content: e.target.value })}
            placeholder="הכנס כתובת תמונה..."
            className="bg-slate-800/50 border-slate-600 text-white"
            autoFocus
          />
        ) : block.content ? (
          <img
            src={block.content}
            alt={block.metadata?.alt || ''}
            className="max-w-full rounded-lg"
          />
        ) : (
          <div className="h-32 rounded-lg bg-slate-800/50 flex items-center justify-center text-slate-400">
            לחץ להוספת תמונה
          </div>
        );

      case 'code':
        return isEditing ? (
          <div className="space-y-2">
            <Input
              value={block.metadata?.language || ''}
              onChange={(e) => onUpdate({ metadata: { ...block.metadata, language: e.target.value } })}
              placeholder="שפת תכנות (javascript, python...)"
              className="bg-slate-800/50 border-slate-600 text-white text-sm"
            />
            <Textarea
              value={block.content || ''}
              onChange={(e) => onUpdate({ content: e.target.value })}
              placeholder="הכנס קוד..."
              className="min-h-[150px] bg-slate-900 border-slate-600 text-green-400 font-mono text-sm resize-none"
              dir="ltr"
              autoFocus
            />
          </div>
        ) : (
          <div className="relative rounded-lg overflow-hidden">
            {block.metadata?.language && (
              <div className="absolute top-2 left-2 text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded">
                {block.metadata.language}
              </div>
            )}
            <pre className="p-4 bg-slate-900 rounded-lg overflow-x-auto" dir="ltr">
              <code className="text-sm text-green-400 font-mono">
                {block.content || 'לחץ להוספת קוד...'}
              </code>
            </pre>
          </div>
        );

      case 'checklist':
        const items = block.metadata?.items || [];
        return (
          <div className="space-y-2">
            {items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 group/item">
                <Checkbox
                  checked={item.checked}
                  onCheckedChange={(checked) => {
                    const newItems = [...items];
                    newItems[idx] = { ...item, checked };
                    onUpdate({ metadata: { ...block.metadata, items: newItems } });
                  }}
                  className="border-slate-500"
                />
                <Input
                  value={item.text}
                  onChange={(e) => {
                    const newItems = [...items];
                    newItems[idx] = { ...item, text: e.target.value };
                    onUpdate({ metadata: { ...block.metadata, items: newItems } });
                  }}
                  className={cn(
                    "flex-1 bg-transparent border-none text-white p-0 h-auto focus-visible:ring-0",
                    item.checked && "line-through text-slate-500"
                  )}
                  placeholder="משימה..."
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    const newItems = items.filter((_, i) => i !== idx);
                    onUpdate({ metadata: { ...block.metadata, items: newItems } });
                  }}
                  className="opacity-0 group-hover/item:opacity-100 h-6 w-6 text-slate-500 hover:text-red-400"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const newItems = [...items, { text: '', checked: false }];
                onUpdate({ metadata: { ...block.metadata, items: newItems } });
              }}
              className="text-slate-400 hover:text-white"
            >
              + הוסף משימה
            </Button>
          </div>
        );

      case 'video':
        return isEditing ? (
          <Input
            value={block.content || ''}
            onChange={(e) => onUpdate({ content: e.target.value })}
            placeholder="הכנס קישור ליוטיוב או וימאו..."
            className="bg-slate-800/50 border-slate-600 text-white"
            autoFocus
          />
        ) : block.content ? (
          <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-900">
            {block.content.includes('youtube') || block.content.includes('youtu.be') ? (
              <iframe
                src={getYoutubeEmbedUrl(block.content)}
                className="w-full h-full"
                allowFullScreen
              />
            ) : block.content.includes('vimeo') ? (
              <iframe
                src={getVimeoEmbedUrl(block.content)}
                className="w-full h-full"
                allowFullScreen
              />
            ) : (
              <video src={block.content} controls className="w-full h-full" />
            )}
          </div>
        ) : (
          <div className="h-32 rounded-lg bg-slate-800/50 flex items-center justify-center text-slate-400">
            <Play className="w-8 h-8 ml-2" />
            לחץ להוספת וידאו
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.05 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative"
    >
      <div className={cn(
        "relative rounded-xl border transition-all duration-200",
        isEditing 
          ? "border-violet-500/50 bg-slate-800/30" 
          : "border-slate-700/50 bg-slate-800/20 hover:border-slate-600"
      )}>
        {/* Block Header */}
        <div className="flex items-center justify-between p-3 border-b border-slate-700/50">
          <div className="flex items-center gap-2">
            <GripVertical className="w-4 h-4 text-slate-500 cursor-grab" />
            <Icon className={cn("w-4 h-4", config.color)} />
            <span className="text-sm text-slate-400">{config.label}</span>
          </div>

          {/* Actions */}
          <div className={cn(
            "flex items-center gap-1 transition-opacity",
            isHovered || isEditing ? "opacity-100" : "opacity-0"
          )}>
            {isEditing ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsEditing(false)}
                className="h-7 w-7 text-green-400 hover:text-green-300 hover:bg-green-500/10"
              >
                <Check className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsEditing(true)}
                className="h-7 w-7 text-slate-400 hover:text-white"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onDuplicate}
              className="h-7 w-7 text-slate-400 hover:text-white"
            >
              <Copy className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              className="h-7 w-7 text-slate-400 hover:text-red-400"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Block Content */}
        <div 
          className="p-4"
          onClick={() => !isEditing && block.type !== 'checklist' && setIsEditing(true)}
        >
          {renderContent()}
        </div>
      </div>
    </motion.div>
  );
}

function getYoutubeEmbedUrl(url) {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : url;
}

function getVimeoEmbedUrl(url) {
  const match = url.match(/vimeo\.com\/(\d+)/);
  return match ? `https://player.vimeo.com/video/${match[1]}` : url;
}