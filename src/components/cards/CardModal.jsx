import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Save, Trash2, Share2, Star, Zap, Plus, 
  GripVertical, Palette, Tag, ChevronDown 
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import ContentBlockEditor from './ContentBlockEditor';
import AddBlockMenu from './AddBlockMenu';
import SmartCardPanel from './SmartCardPanel';

const COLORS = [
  '#8B5CF6', '#6366F1', '#14B8A6', '#F59E0B', 
  '#EF4444', '#EC4899', '#3B82F6', '#10B981',
  '#F97316', '#84CC16', '#06B6D4', '#A855F7'
];

export default function CardModal({ 
  card, 
  isOpen, 
  onClose, 
  onSave, 
  onDelete,
  availableTags,
  apiTemplates
}) {
  const [editedCard, setEditedCard] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [showAddBlock, setShowAddBlock] = useState(false);

  useEffect(() => {
    if (card) {
      setEditedCard({
        ...card,
        content_blocks: card.content_blocks || [],
        tags: card.tags || []
      });
    }
  }, [card]);

  if (!editedCard) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(editedCard);
      onClose();
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const updateBlock = (blockId, updates) => {
    setEditedCard(prev => ({
      ...prev,
      content_blocks: prev.content_blocks.map(block =>
        block.id === blockId ? { ...block, ...updates } : block
      )
    }));
  };

  const deleteBlock = (blockId) => {
    setEditedCard(prev => ({
      ...prev,
      content_blocks: prev.content_blocks.filter(block => block.id !== blockId)
    }));
  };

  const duplicateBlock = (blockId) => {
    const block = editedCard.content_blocks.find(b => b.id === blockId);
    if (block) {
      const newBlock = {
        ...block,
        id: `block_${Date.now()}`,
        order: editedCard.content_blocks.length
      };
      setEditedCard(prev => ({
        ...prev,
        content_blocks: [...prev.content_blocks, newBlock]
      }));
    }
  };

  const addBlock = (type) => {
    const newBlock = {
      id: `block_${Date.now()}`,
      type,
      content: '',
      metadata: type === 'checklist' ? { items: [] } : {},
      order: editedCard.content_blocks.length
    };
    setEditedCard(prev => ({
      ...prev,
      content_blocks: [...prev.content_blocks, newBlock]
    }));
    setShowAddBlock(false);
  };

  const addTag = () => {
    if (newTag && !editedCard.tags.includes(newTag)) {
      setEditedCard(prev => ({
        ...prev,
        tags: [...prev.tags, newTag]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tag) => {
    setEditedCard(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-6xl h-[90vh] max-h-[90vh] overflow-hidden bg-slate-900 border-slate-700 p-0 flex flex-col sm:w-[95vw] sm:max-w-6xl" dir="rtl">
        {/* Header */}
        <div 
          className="p-6 border-b border-slate-700"
          style={{ backgroundColor: `${editedCard.color}15` }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <Input
                value={editedCard.title}
                onChange={(e) => setEditedCard(prev => ({ ...prev, title: e.target.value }))}
                placeholder="כותרת הכרטיסייה"
                className="text-2xl font-bold bg-transparent border-none text-white placeholder:text-slate-400 p-0 h-auto focus-visible:ring-0"
              />
              
              {/* Tags */}
              <div className="flex flex-wrap items-center gap-2 mt-3">
                {editedCard.tags.map(tag => (
                  <Badge 
                    key={tag}
                    variant="secondary"
                    className="bg-slate-700/50 text-slate-200 hover:bg-slate-600 cursor-pointer"
                    onClick={() => removeTag(tag)}
                  >
                    {tag}
                    <X className="w-3 h-3 mr-1" />
                  </Badge>
                ))}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 text-slate-400 hover:text-white">
                      <Tag className="w-3 h-3 ml-1" />
                      הוסף תגית
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 bg-slate-800 border-slate-700" align="start">
                    <div className="flex gap-2">
                      <Input
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        placeholder="תגית חדשה"
                        className="bg-slate-700 border-slate-600 text-white"
                        onKeyDown={(e) => e.key === 'Enter' && addTag()}
                      />
                      <Button size="sm" onClick={addTag}>הוסף</Button>
                    </div>
                    {availableTags?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {availableTags.filter(t => !editedCard.tags.includes(t.name)).slice(0, 10).map(tag => (
                          <Badge
                            key={tag.id}
                            variant="outline"
                            className="cursor-pointer border-slate-600 text-slate-300 hover:bg-slate-700"
                            onClick={() => setEditedCard(prev => ({ ...prev, tags: [...prev.tags, tag.name] }))}
                          >
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-2">
              {/* Color Picker */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                    <div 
                      className="w-5 h-5 rounded-full border-2 border-slate-500"
                      style={{ backgroundColor: editedCard.color }}
                    />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto bg-slate-800 border-slate-700" align="end">
                  <div className="grid grid-cols-6 gap-2">
                    {COLORS.map(color => (
                      <button
                        key={color}
                        onClick={() => setEditedCard(prev => ({ ...prev, color }))}
                        className={cn(
                          "w-8 h-8 rounded-full transition-transform hover:scale-110",
                          editedCard.color === color && "ring-2 ring-white ring-offset-2 ring-offset-slate-800"
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              {/* Smart Card Toggle */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/50">
                <Zap className={cn(
                  "w-4 h-4 transition-colors",
                  editedCard.is_smart_card ? "text-amber-400" : "text-slate-500"
                )} />
                <Label htmlFor="smart-card" className="text-sm text-slate-300 cursor-pointer">
                  כרטיסייה חכמה
                </Label>
                <Switch
                  id="smart-card"
                  checked={editedCard.is_smart_card}
                  onCheckedChange={(checked) => setEditedCard(prev => ({ ...prev, is_smart_card: checked }))}
                />
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditedCard(prev => ({ ...prev, is_favorite: !prev.is_favorite }))}
                className="text-slate-400 hover:text-amber-400"
              >
                <Star className={cn(
                  "w-5 h-5",
                  editedCard.is_favorite && "fill-amber-400 text-amber-400"
                )} />
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Smart Card Panel */}
          <AnimatePresence>
            {editedCard.is_smart_card && (
              <SmartCardPanel
                card={editedCard}
                templates={apiTemplates}
                onUpdate={(updates) => setEditedCard(prev => ({ ...prev, ...updates }))}
              />
            )}
          </AnimatePresence>

          {/* Content Blocks */}
          <div className="space-y-4">
            <AnimatePresence>
              {editedCard.content_blocks
                .sort((a, b) => (a.order || 0) - (b.order || 0))
                .map((block, index) => (
                  <ContentBlockEditor
                    key={block.id}
                    block={block}
                    index={index}
                    onUpdate={(updates) => updateBlock(block.id, updates)}
                    onDelete={() => deleteBlock(block.id)}
                    onDuplicate={() => duplicateBlock(block.id)}
                  />
                ))}
            </AnimatePresence>
          </div>

          {/* Add Block Button */}
          <div className="mt-6 relative">
            <Button
              variant="outline"
              onClick={() => setShowAddBlock(!showAddBlock)}
              className="w-full border-dashed border-slate-600 text-slate-400 hover:text-white hover:border-violet-500 hover:bg-violet-500/10"
            >
              <Plus className="w-5 h-5 ml-2" />
              הוסף בלוק תוכן
              <ChevronDown className={cn(
                "w-4 h-4 mr-2 transition-transform",
                showAddBlock && "rotate-180"
              )} />
            </Button>
            
            <AnimatePresence>
              {showAddBlock && (
                <AddBlockMenu onSelect={addBlock} onClose={() => setShowAddBlock(false)} />
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 flex items-center justify-between bg-slate-800/50">
          <Button
            variant="ghost"
            onClick={() => onDelete(editedCard.id)}
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
          >
            <Trash2 className="w-4 h-4 ml-2" />
            מחק כרטיסייה
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={onClose} className="text-slate-400">
              ביטול
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500"
            >
              <Save className="w-4 h-4 ml-2" />
              {isSaving ? 'שומר...' : 'שמור שינויים'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}