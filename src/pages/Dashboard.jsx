import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Settings, User, LogOut } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Toaster, toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from '@/lib/AuthContext';
import { createPageUrl } from '@/utils';

import CardGrid from '../components/cards/CardGrid';
import CardModal from '../components/cards/CardModal';
import FolderTree from '../components/sidebar/FolderTree';
import TagList from '../components/sidebar/TagList';

export default function Dashboard() {
  const { user: authUser, logout } = useAuth();
  const queryClient = useQueryClient();
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [selectedTags, setSelectedTags] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCard, setSelectedCard] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState('all'); // 'all', 'favorites'

  // Queries
  const { data: cards = [], isLoading: cardsLoading } = useQuery({
    queryKey: ['cards'],
    queryFn: () => base44.entities.Card.list('-created_date'),
  });

  const { data: folders = [], isLoading: foldersLoading } = useQuery({
    queryKey: ['folders'],
    queryFn: () => base44.entities.Folder.list(),
  });

  const { data: tags = [], isLoading: tagsLoading } = useQuery({
    queryKey: ['tags'],
    queryFn: () => base44.entities.Tag.list(),
  });

  const { data: apiTemplates = [] } = useQuery({
    queryKey: ['apiTemplates'],
    queryFn: () => base44.entities.ApiTemplate.list(),
  });

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  // Mutations
  const createCard = useMutation({
    mutationFn: (data) => base44.entities.Card.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      toast.success('הכרטיסייה נוצרה בהצלחה');
    },
  });

  const updateCard = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Card.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      toast.success('הכרטיסייה עודכנה בהצלחה');
    },
  });

  const deleteCard = useMutation({
    mutationFn: (id) => base44.entities.Card.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      toast.success('הכרטיסייה נמחקה');
    },
  });

  const bulkDeleteCards = useMutation({
    mutationFn: async (ids) => {
      await Promise.all(ids.map(id => base44.entities.Card.delete(id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      toast.success('הכרטיסיות נמחקו');
    },
  });

  const bulkMoveCards = useMutation({
    mutationFn: async ({ ids, folderId }) => {
      await Promise.all(ids.map(id => base44.entities.Card.update(id, { folder_id: folderId })));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      toast.success('הכרטיסיות הועברו');
    },
  });

  const createFolder = useMutation({
    mutationFn: (data) => base44.entities.Folder.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      toast.success('התיקיה נוצרה');
    },
  });

  const updateFolder = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Folder.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['folders'] }),
  });

  const deleteFolder = useMutation({
    mutationFn: (id) => base44.entities.Folder.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      if (selectedFolderId === id) setSelectedFolderId(null);
      toast.success('התיקיה נמחקה');
    },
  });

  const createTag = useMutation({
    mutationFn: (data) => base44.entities.Tag.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      toast.success('התגית נוצרה');
    },
  });

  const deleteTag = useMutation({
    mutationFn: (id) => base44.entities.Tag.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tags'] }),
  });

  // Filtered cards
  const filteredCards = useMemo(() => {
    let result = cards;

    // Filter by view mode
    if (viewMode === 'favorites') {
      result = result.filter(c => c.is_favorite);
    }

    // Filter by folder
    if (selectedFolderId) {
      result = result.filter(c => c.folder_id === selectedFolderId);
    }

    // Filter by tags
    if (selectedTags.length > 0) {
      result = result.filter(c => 
        selectedTags.every(tag => c.tags?.includes(tag))
      );
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(c => 
        c.title?.toLowerCase().includes(query) ||
        c.tags?.some(t => t.toLowerCase().includes(query)) ||
        c.content_blocks?.some(b => b.content?.toLowerCase().includes(query))
      );
    }

    return result;
  }, [cards, selectedFolderId, selectedTags, searchQuery, viewMode]);

  const handleCreateCard = () => {
    const newCard = {
      title: 'כרטיסייה חדשה',
      color: '#8B5CF6',
      folder_id: selectedFolderId || null,
      tags: [],
      content_blocks: [],
      is_smart_card: false,
      is_favorite: false,
    };
    createCard.mutate(newCard, {
      onSuccess: (created) => {
        setSelectedCard(created);
        setIsModalOpen(true);
      }
    });
  };

  const handleCardClick = (card) => {
    setSelectedCard(card);
    setIsModalOpen(true);
  };

  const handleSaveCard = async (cardData) => {
    const { id, created_date, updated_date, created_by, ...data } = cardData;
    await updateCard.mutateAsync({ id, data });
  };

  const handleToggleFavorite = (cardId) => {
    const card = cards.find(c => c.id === cardId);
    if (card) {
      updateCard.mutate({ id: cardId, data: { is_favorite: !card.is_favorite } });
    }
  };

  const handleToggleTag = (tagName) => {
    setSelectedTags(prev => 
      prev.includes(tagName) 
        ? prev.filter(t => t !== tagName)
        : [...prev, tagName]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" dir="rtl">
      <Toaster position="top-center" richColors />
      
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 right-0 left-0 h-16 bg-slate-900/95 backdrop-blur-md border-b border-slate-700 z-50 flex items-center justify-between px-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobileSidebarOpen(true)}
          className="text-white"
        >
          <Menu className="w-6 h-6" />
        </Button>
        <h1 className="text-lg font-bold text-white">כרטיסיות</h1>
        <div className="w-10" />
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileSidebarOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/50 z-50"
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="lg:hidden fixed top-0 right-0 bottom-0 w-80 bg-slate-900 border-l border-slate-700 z-50 overflow-y-auto"
            >
              <div className="p-4 flex items-center justify-between border-b border-slate-700">
                <h2 className="font-bold text-white">תפריט</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="text-slate-400"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <div className="p-4 space-y-6">
                <FolderTree
                  folders={folders}
                  selectedFolderId={selectedFolderId}
                  onSelectFolder={(id) => { setSelectedFolderId(id); setViewMode('folder'); setIsMobileSidebarOpen(false); }}
                  onCreateFolder={createFolder.mutate}
                  onUpdateFolder={(id, data) => updateFolder.mutate({ id, data })}
                  onDeleteFolder={deleteFolder.mutate}
                  onSelectFavorites={() => { setViewMode('favorites'); setSelectedFolderId(null); setIsMobileSidebarOpen(false); }}
                  onSelectAll={() => { setViewMode('all'); setSelectedFolderId(null); setIsMobileSidebarOpen(false); }}
                  isFavoritesSelected={viewMode === 'favorites'}
                  isAllSelected={viewMode === 'all' && !selectedFolderId}
                />
                <div className="h-px bg-slate-700" />
                <TagList
                  tags={tags}
                  selectedTags={selectedTags}
                  onToggleTag={handleToggleTag}
                  onCreateTag={createTag.mutate}
                  onDeleteTag={deleteTag.mutate}
                />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden lg:block fixed top-0 right-0 bottom-0 bg-slate-900/95 backdrop-blur-md border-l border-slate-700 overflow-y-auto transition-all duration-300 z-40",
        isSidebarOpen ? "w-72" : "w-0"
      )}>
        {isSidebarOpen && (
          <div className="p-4 space-y-6">
            {/* Logo */}
            <div className="flex items-center gap-3 pb-4 border-b border-slate-700">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center">
                <span className="text-xl font-bold text-white">כ</span>
              </div>
              <div>
                <h1 className="font-bold text-white">מערכת כרטיסיות</h1>
                <p className="text-xs text-slate-400">ניהול מידע חכם</p>
              </div>
            </div>

            <FolderTree
              folders={folders}
              selectedFolderId={selectedFolderId}
              onSelectFolder={(id) => { setSelectedFolderId(id); setViewMode('folder'); }}
              onCreateFolder={createFolder.mutate}
              onUpdateFolder={(id, data) => updateFolder.mutate({ id, data })}
              onDeleteFolder={deleteFolder.mutate}
              onSelectFavorites={() => { setViewMode('favorites'); setSelectedFolderId(null); }}
              onSelectAll={() => { setViewMode('all'); setSelectedFolderId(null); }}
              isFavoritesSelected={viewMode === 'favorites'}
              isAllSelected={viewMode === 'all' && !selectedFolderId}
            />

            <div className="h-px bg-slate-700" />

            <TagList
              tags={tags}
              selectedTags={selectedTags}
              onToggleTag={handleToggleTag}
              onCreateTag={createTag.mutate}
              onDeleteTag={deleteTag.mutate}
            />

            {/* User */}
            {user && (
              <div className="absolute bottom-0 right-0 left-0 p-4 border-t border-slate-700 bg-slate-900/95">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {user.full_name?.[0] || user.phone?.[0] || 'מ'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{user.full_name || 'משתמש'}</p>
                    <p className="text-xs text-slate-400 truncate">{user.phone}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => window.location.href = createPageUrl('Settings')}
                    className="text-slate-400 hover:text-white"
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className={cn(
        "min-h-screen transition-all duration-300 pt-20 lg:pt-8 pb-8 px-4 lg:px-8",
        isSidebarOpen ? "lg:pr-80" : "lg:pr-8"
      )}>
        <CardGrid
          cards={filteredCards}
          onCardClick={handleCardClick}
          onCreateCard={handleCreateCard}
          onDeleteCards={(ids) => bulkDeleteCards.mutate(ids)}
          onMoveCards={(ids, folderId) => bulkMoveCards.mutate({ ids, folderId })}
          onToggleFavorite={handleToggleFavorite}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          folders={folders}
        />
      </main>

      {/* Card Modal */}
      <CardModal
        card={selectedCard}
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedCard(null); }}
        onSave={handleSaveCard}
        onDelete={(id) => { deleteCard.mutate(id); setIsModalOpen(false); }}
        availableTags={tags}
        apiTemplates={apiTemplates}
      />
    </div>
  );
}