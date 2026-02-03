import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Filter, Grid3X3, List, Star, MoreHorizontal, Trash2, FolderInput, Palette } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import CardItem from './CardItem';

const COLORS = [
  '#8B5CF6', '#6366F1', '#14B8A6', '#F59E0B', 
  '#EF4444', '#EC4899', '#3B82F6', '#10B981'
];

export default function CardGrid({ 
  cards, 
  onCardClick, 
  onCreateCard, 
  onDeleteCards, 
  onMoveCards,
  onToggleFavorite,
  searchQuery,
  onSearchChange,
  folders
}) {
  const [viewMode, setViewMode] = useState('grid');
  const [selectedCards, setSelectedCards] = useState([]);
  const [isSelecting, setIsSelecting] = useState(false);

  const toggleCardSelection = (cardId) => {
    setSelectedCards(prev => 
      prev.includes(cardId) 
        ? prev.filter(id => id !== cardId)
        : [...prev, cardId]
    );
  };

  const selectAll = () => {
    if (selectedCards.length === cards.length) {
      setSelectedCards([]);
    } else {
      setSelectedCards(cards.map(c => c.id));
    }
  };

  const handleBulkDelete = () => {
    onDeleteCards(selectedCards);
    setSelectedCards([]);
    setIsSelecting(false);
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder="חיפוש כרטיסיות..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pr-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-400 focus:border-violet-500"
          />
        </div>
        
        <div className="flex items-center gap-2">
          {isSelecting && selectedCards.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2"
            >
              <span className="text-sm text-slate-400">{selectedCards.length} נבחרו</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBulkDelete}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                <Trash2 className="w-4 h-4 ml-1" />
                מחק
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-slate-300">
                    <FolderInput className="w-4 h-4 ml-1" />
                    העבר
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                  {folders?.map(folder => (
                    <DropdownMenuItem 
                      key={folder.id}
                      onClick={() => {
                        onMoveCards(selectedCards, folder.id);
                        setSelectedCards([]);
                      }}
                      className="text-white hover:bg-slate-700"
                    >
                      {folder.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </motion.div>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsSelecting(!isSelecting);
              setSelectedCards([]);
            }}
            className={cn(
              "text-slate-300 hover:text-white",
              isSelecting && "bg-violet-500/20 text-violet-300"
            )}
          >
            {isSelecting ? 'ביטול' : 'בחירה'}
          </Button>
          
          <div className="flex items-center border border-slate-700 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-2 transition-colors",
                viewMode === 'grid' ? 'bg-violet-500 text-white' : 'text-slate-400 hover:text-white'
              )}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "p-2 transition-colors",
                viewMode === 'list' ? 'bg-violet-500 text-white' : 'text-slate-400 hover:text-white'
              )}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          
          <Button
            onClick={onCreateCard}
            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-500/25"
          >
            <Plus className="w-4 h-4 ml-2" />
            כרטיסייה חדשה
          </Button>
        </div>
      </div>

      {/* Cards Grid/List */}
      <motion.div 
        layout
        className={cn(
          viewMode === 'grid' 
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            : "flex flex-col gap-3"
        )}
      >
        <AnimatePresence mode="popLayout">
          {cards.map((card, index) => (
            <CardItem
              key={card.id}
              card={card}
              viewMode={viewMode}
              isSelecting={isSelecting}
              isSelected={selectedCards.includes(card.id)}
              onSelect={() => toggleCardSelection(card.id)}
              onClick={() => !isSelecting && onCardClick(card)}
              onToggleFavorite={() => onToggleFavorite(card.id)}
              index={index}
            />
          ))}
        </AnimatePresence>
      </motion.div>

      {cards.length === 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 flex items-center justify-center">
            <Plus className="w-10 h-10 text-violet-400" />
          </div>
          <h3 className="text-xl font-medium text-white mb-2">אין כרטיסיות עדיין</h3>
          <p className="text-slate-400 mb-6">צור את הכרטיסייה הראשונה שלך</p>
          <Button
            onClick={onCreateCard}
            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500"
          >
            <Plus className="w-4 h-4 ml-2" />
            צור כרטיסייה
          </Button>
        </motion.div>
      )}
    </div>
  );
}