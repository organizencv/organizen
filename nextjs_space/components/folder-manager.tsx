

'use client';

import { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { FolderModal } from './folder-modal';
import { SortableList } from './ui/sortable-list';
import { getTranslation, Language } from '@/lib/i18n';
import { Folder, Plus, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';

interface FolderType {
  id: string;
  name: string;
  color: string | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    messages: number;
  };
}

interface FolderManagerProps {
  folders: FolderType[];
  onFolderCreated: (folder: FolderType) => void;
  onFolderUpdated: (folder: FolderType) => void;
  onFolderDeleted: (folderId: string) => void;
  onFoldersReordered: (folders: FolderType[]) => void;
  language: Language;
}

export function FolderManager({
  folders,
  onFolderCreated,
  onFolderUpdated,
  onFolderDeleted,
  onFoldersReordered,
  language
}: FolderManagerProps) {
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<FolderType | null>(null);
  const [deletingFolder, setDeletingFolder] = useState<FolderType | null>(null);

  const handleCreateFolder = () => {
    setEditingFolder(null);
    setIsModalOpen(true);
  };

  const handleEditFolder = (folder: FolderType) => {
    setEditingFolder(folder);
    setIsModalOpen(true);
  };

  const handleFolderSaved = (folder: FolderType) => {
    if (editingFolder) {
      onFolderUpdated(folder);
    } else {
      onFolderCreated(folder);
    }
    setIsModalOpen(false);
    setEditingFolder(null);
  };

  const handleDeleteFolder = async () => {
    if (!deletingFolder) return;

    try {
      const response = await fetch(`/api/folders/${deletingFolder.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete folder');
      }

      onFolderDeleted(deletingFolder.id);
      setDeletingFolder(null);
    } catch (error) {
      console.error('Delete folder error:', error);
    }
  };

  const handleReorder = async (reorderedFolders: FolderType[]) => {
    // Optimistic update
    onFoldersReordered(reorderedFolders);

    try {
      const orderedIds = reorderedFolders.map((folder) => folder.id);
      const response = await fetch('/api/folders/reorder', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderedIds }),
      });

      if (!response.ok) {
        throw new Error('Failed to reorder folders');
      }

      toast({
        title: language === 'pt' ? 'Ordem atualizada' : 'Order updated',
        description: language === 'pt' ? 'A ordem das pastas foi atualizada' : 'Folders order has been updated',
      });
    } catch (error) {
      toast({
        title: language === 'pt' ? 'Erro' : 'Error',
        description: language === 'pt' ? 'Erro ao reordenar pastas' : 'Failed to reorder folders',
        variant: 'destructive',
      });
    }
  };

  const renderFolder = (folder: FolderType) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: folder.color || '#3B82F6' }}
            />
            <span className="font-medium">{folder.name}</span>
            <Badge variant="secondary" className="text-xs">
              {folder?._count?.messages || 0}{' '}
              {language === 'pt' ? 'mensagens' : 'messages'}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEditFolder(folder)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeletingFolder(folder)}
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Folder className="h-5 w-5" />
          {getTranslation('folders', language)}
        </h3>
        <Button onClick={handleCreateFolder} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          {getTranslation('newFolder', language)}
        </Button>
      </div>

      {folders.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Folder className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">
              {language === 'pt'
                ? 'Nenhuma pasta criada ainda'
                : 'No folders created yet'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <SortableList
          items={folders}
          onReorder={handleReorder}
          renderItem={renderFolder}
          getId={(folder) => folder.id}
        />
      )}

      {isModalOpen && (
        <FolderModal
          folder={editingFolder}
          onClose={() => {
            setIsModalOpen(false);
            setEditingFolder(null);
          }}
          onSaved={handleFolderSaved}
          language={language}
        />
      )}

      <AlertDialog
        open={!!deletingFolder}
        onOpenChange={() => setDeletingFolder(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {getTranslation('deleteFolder', language)}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {getTranslation('deleteFolderConfirm', language)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {getTranslation('cancel', language)}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteFolder}>
              {getTranslation('delete', language)}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
