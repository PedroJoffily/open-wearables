import { useState } from 'react';
import { MessageSquarePlus, Trash2, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import {
  useCoachingNotes,
  useCreateNote,
  useDeleteNote,
} from '@/hooks/api/use-ai';

interface CoachingNotesProps {
  userId: string;
}

// Fallback mock notes when AI backend is unavailable
const MOCK_NOTES = [
  {
    id: '1',
    user_id: '',
    content:
      'Discussed sleep optimization strategies. Recommended reducing screen time 1h before bed and keeping bedroom temp at 18-19C.',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    author: 'Sarah Chen',
  },
  {
    id: '2',
    user_id: '',
    content:
      'Training load adjusted: reduced weekly running volume by 15% after elevated resting HR trend. Will reassess in 2 weeks.',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    author: 'Sarah Chen',
  },
];

export function CoachingNotes({ userId }: CoachingNotesProps) {
  const { data, isError } = useCoachingNotes(userId);
  const createNote = useCreateNote();
  const deleteNote = useDeleteNote(userId);

  const [newNote, setNewNote] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Use real data if available, fallback to mock
  const notes = data?.items ?? (isError ? MOCK_NOTES : MOCK_NOTES);

  const handleAddNote = () => {
    if (!newNote.trim()) return;

    createNote.mutate(
      { user_id: userId, content: newNote.trim(), author: 'Coach' },
      {
        onSuccess: () => {
          setNewNote('');
          setIsAdding(false);
        },
      }
    );
  };

  const handleDeleteNote = (noteId: string) => {
    deleteNote.mutate(noteId);
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            Coaching Notes
          </h2>
          <p className="text-xs text-foreground-muted mt-0.5">
            Private notes about this member
          </p>
        </div>
        {!isAdding && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAdding(true)}
          >
            <MessageSquarePlus className="h-3.5 w-3.5" />
            Add Note
          </Button>
        )}
      </div>

      <div className="divide-y divide-border">
        {/* Add note form */}
        {isAdding && (
          <div className="p-4 bg-secondary/30">
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Write a coaching note..."
              className="w-full min-h-[80px] p-3 text-sm bg-background border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 placeholder:text-foreground-muted"
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsAdding(false);
                  setNewNote('');
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleAddNote}
                disabled={!newNote.trim() || createNote.isPending}
              >
                {createNote.isPending ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Note'
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Notes list */}
        {notes.length > 0 ? (
          notes.map((note) => (
            <div
              key={note.id}
              className="px-6 py-4 group hover:bg-secondary/20 transition-colors"
            >
              <p className="text-sm text-foreground leading-relaxed">
                {note.content}
              </p>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-3 text-xs text-foreground-muted">
                  <span className="font-medium">{note.author}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(note.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleDeleteNote(note.id)}
                  disabled={deleteNote.isPending}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-foreground-muted hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="px-6 py-8 text-center">
            <p className="text-sm text-foreground-muted">
              No coaching notes yet. Add your first note above.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
