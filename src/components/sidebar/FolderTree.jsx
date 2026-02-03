import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Folder, FolderOpen, ChevronLeft, Plus, MoreHorizontal, 
  Edit2, Trash2, FolderPlus, Star, Home, Tag
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export default function FolderTree({ 
  folders, 
  selectedFolderId, 
  onSelectFolder, 
  onCreateFolder,
  onUpdateFolder,
  onDeleteFolder,
  onSelectFavorites,
  onSelectAll,
  isFavoritesSelected,
  isAllSelected
}) {
  const [editingFolder, setEditingFolder] = useState(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [isCreating, setIsCreating] = useState(false);
  const [parentForNewFolder, setParentForNewFolder] = useState(null);

  const toggleExpand = (folderId) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      onCreateFolder({ name: newFolderName, parent_id: parentForNewFolder });
      setNewFolderName('');
      setIsCreating(false);
      setParentForNewFolder(null);
    }
  };

  const handleUpdateFolder = (folderId) => {
    if (newFolderName.trim()) {
      onUpdateFolder(folderId, { name: newFolderName });
      setEditingFolder(null);
      setNewFolderName('');
    }
  };

  const renderFolder = (folder, level = 0) => {
    const childFolders = folders.filter(f => f.parent_id === folder.id);
    const hasChildren = childFolders.length > 0;
    const isExpanded = expandedFolders.has(folder.id);
    const isSelected = selectedFolderId === folder.id;
    const isEditing = editingFolder === folder.id;

    return (
      <div key={folder.id}>
        <div
          className={cn(
            "group flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer transition-all duration-200",
            "hover:bg-slate-700/50",
            isSelected && "bg-violet-500/20 text-violet-300",
            !isSelected && "text-slate-300"
          )}
          style={{ paddingRight: `${12 + level * 16}px` }}
          onClick={() => onSelectFolder(folder.id)}
        >
          {hasChildren && (
            <button
              onClick={(e) => { e.stopPropagation(); toggleExpand(folder.id); }}
              className="p-0.5 hover:bg-slate-600 rounded"
            >
              <ChevronLeft className={cn(
                "w-4 h-4 transition-transform",
                isExpanded && "-rotate-90"
              )} />
            </button>
          )}
          {!hasChildren && <div className="w-5" />}

          {isExpanded ? (
            <FolderOpen className="w-4 h-4" style={{ color: folder.color }} />
          ) : (
            <Folder className="w-4 h-4" style={{ color: folder.color }} />
          )}

          {isEditing ? (
            <Input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onBlur={() => handleUpdateFolder(folder.id)}
              onKeyDown={(e) => e.key === 'Enter' && handleUpdateFolder(folder.id)}
              className="h-6 text-sm bg-slate-700 border-slate-600"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="flex-1 text-sm truncate">{folder.name}</span>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-white"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingFolder(folder.id);
                  setNewFolderName(folder.name);
                }}
                className="text-white hover:bg-slate-700"
              >
                <Edit2 className="w-4 h-4 ml-2" />
                שנה שם
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  setParentForNewFolder(folder.id);
                  setIsCreating(true);
                  toggleExpand(folder.id);
                }}
                className="text-white hover:bg-slate-700"
              >
                <FolderPlus className="w-4 h-4 ml-2" />
                תיקיית משנה
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-700" />
              <DropdownMenuItem
                onClick={(e) => { e.stopPropagation(); onDeleteFolder(folder.id); }}
                className="text-red-400 hover:bg-red-500/10"
              >
                <Trash2 className="w-4 h-4 ml-2" />
                מחק
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Children */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              {childFolders.map(child => renderFolder(child, level + 1))}
              
              {/* New subfolder input */}
              {isCreating && parentForNewFolder === folder.id && (
                <div 
                  className="flex items-center gap-2 py-2 px-3"
                  style={{ paddingRight: `${12 + (level + 1) * 16}px` }}
                >
                  <div className="w-5" />
                  <Folder className="w-4 h-4 text-slate-400" />
                  <Input
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onBlur={() => newFolderName.trim() ? handleCreateFolder() : setIsCreating(false)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreateFolder();
                      if (e.key === 'Escape') { setIsCreating(false); setNewFolderName(''); }
                    }}
                    placeholder="שם התיקיה..."
                    className="h-6 text-sm bg-slate-700 border-slate-600"
                    autoFocus
                  />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  // Get root folders (no parent)
  const rootFolders = folders.filter(f => !f.parent_id);

  return (
    <div className="space-y-1" dir="rtl">
      {/* All Cards */}
      <button
        onClick={onSelectAll}
        className={cn(
          "w-full flex items-center gap-3 py-2 px-3 rounded-lg transition-all duration-200",
          "hover:bg-slate-700/50",
          isAllSelected ? "bg-violet-500/20 text-violet-300" : "text-slate-300"
        )}
      >
        <Home className="w-4 h-4" />
        <span className="text-sm">כל הכרטיסיות</span>
      </button>

      {/* Favorites */}
      <button
        onClick={onSelectFavorites}
        className={cn(
          "w-full flex items-center gap-3 py-2 px-3 rounded-lg transition-all duration-200",
          "hover:bg-slate-700/50",
          isFavoritesSelected ? "bg-amber-500/20 text-amber-300" : "text-slate-300"
        )}
      >
        <Star className="w-4 h-4" />
        <span className="text-sm">מועדפים</span>
      </button>

      <div className="h-px bg-slate-700 my-2" />

      {/* Folders */}
      <div className="flex items-center justify-between px-3 py-1">
        <span className="text-xs font-medium text-slate-500 uppercase">תיקיות</span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => { setIsCreating(true); setParentForNewFolder(null); }}
          className="h-6 w-6 text-slate-400 hover:text-white"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {rootFolders.map(folder => renderFolder(folder))}

      {/* New root folder input */}
      {isCreating && !parentForNewFolder && (
        <div className="flex items-center gap-2 py-2 px-3">
          <div className="w-5" />
          <Folder className="w-4 h-4 text-slate-400" />
          <Input
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onBlur={() => newFolderName.trim() ? handleCreateFolder() : setIsCreating(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateFolder();
              if (e.key === 'Escape') { setIsCreating(false); setNewFolderName(''); }
            }}
            placeholder="שם התיקיה..."
            className="h-6 text-sm bg-slate-700 border-slate-600"
            autoFocus
          />
        </div>
      )}

      {folders.length === 0 && !isCreating && (
        <p className="text-sm text-slate-500 text-center py-4">אין תיקיות עדיין</p>
      )}
    </div>
  );
}