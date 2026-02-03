import React, { useState } from 'react';
import { Tag, Plus, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function TagList({ 
  tags, 
  selectedTags, 
  onToggleTag, 
  onCreateTag,
  onDeleteTag
}) {
  const [isCreating, setIsCreating] = useState(false);
  const [newTagName, setNewTagName] = useState('');

  const handleCreate = () => {
    if (newTagName.trim()) {
      onCreateTag({ name: newTagName.trim() });
      setNewTagName('');
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-2" dir="rtl">
      <div className="flex items-center justify-between px-3 py-1">
        <span className="text-xs font-medium text-slate-500 uppercase">תגיות</span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCreating(true)}
          className="h-6 w-6 text-slate-400 hover:text-white"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 px-3">
        {tags.map(tag => (
          <Badge
            key={tag.id}
            variant="outline"
            className={cn(
              "cursor-pointer transition-all duration-200 group",
              selectedTags.includes(tag.name)
                ? "bg-violet-500/20 border-violet-500 text-violet-300"
                : "border-slate-600 text-slate-400 hover:border-slate-500 hover:text-slate-300"
            )}
            onClick={() => onToggleTag(tag.name)}
          >
            <Tag className="w-3 h-3 ml-1" style={{ color: tag.color }} />
            {tag.name}
            <button
              onClick={(e) => { e.stopPropagation(); onDeleteTag(tag.id); }}
              className="mr-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3 hover:text-red-400" />
            </button>
          </Badge>
        ))}
      </div>

      {isCreating && (
        <div className="px-3">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-slate-400" />
            <Input
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onBlur={() => newTagName.trim() ? handleCreate() : setIsCreating(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate();
                if (e.key === 'Escape') { setIsCreating(false); setNewTagName(''); }
              }}
              placeholder="תגית חדשה..."
              className="h-7 text-sm bg-slate-700 border-slate-600"
              autoFocus
            />
          </div>
        </div>
      )}

      {tags.length === 0 && !isCreating && (
        <p className="text-sm text-slate-500 text-center py-2">אין תגיות עדיין</p>
      )}
    </div>
  );
}