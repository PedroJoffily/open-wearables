import { useState } from 'react';
import {
  FlaskConical,
  FileText,
  Image as ImageIcon,
  Plus,
  Trash2,
  Eye,
} from 'lucide-react';
import {
  useLabResults,
  useUploadLabResult,
  useDeleteLabResult,
} from '@/hooks/api/use-lab-results';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LabResultPreviewDialog } from './lab-result-preview-dialog';
import type { LabResult } from '@/lib/api/lab-results';

interface LabResultsSectionProps {
  userId: string;
}

const ACCEPTED_TYPES = '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png';

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// ============================================================================
// Upload Dialog
// ============================================================================

function UploadLabResultDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (formData: FormData) => void;
  isPending: boolean;
}) {
  const [title, setTitle] = useState('');
  const [testedAt, setTestedAt] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title || !testedAt) return;

    const formData = new FormData();
    formData.append('title', title);
    // Convert date (YYYY-MM-DD) to ISO datetime at midnight UTC
    formData.append('tested_at', new Date(testedAt).toISOString());
    formData.append('file', file);

    onSubmit(formData);
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setTitle('');
      setTestedAt('');
      setFile(null);
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Lab Result</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="lab-title">Title</Label>
            <Input
              id="lab-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Complete Blood Count"
              maxLength={255}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lab-tested-at">Test Date</Label>
            <Input
              id="lab-tested-at"
              type="date"
              value={testedAt}
              onChange={(e) => setTestedAt(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lab-file">File (PDF, JPG, PNG, max 20MB)</Label>
            <Input
              id="lab-file"
              type="file"
              accept={ACCEPTED_TYPES}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              required
            />
            {file && (
              <p className="text-xs text-foreground-muted">
                {file.name} ({formatSize(file.size)})
              </p>
            )}
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={isPending || !file || !title || !testedAt}
          >
            {isPending ? 'Uploading...' : 'Upload'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Skeleton
// ============================================================================

function LabResultsSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex items-center justify-between p-4 border border-border rounded-lg bg-secondary/30"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-muted rounded animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 w-48 bg-muted rounded animate-pulse" />
              <div className="h-3 w-32 bg-muted/50 rounded animate-pulse" />
            </div>
          </div>
          <div className="h-8 w-20 bg-muted/50 rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function LabResultsSection({ userId }: LabResultsSectionProps) {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [previewLab, setPreviewLab] = useState<LabResult | null>(null);

  const { data: labs, isLoading } = useLabResults(userId);
  const { mutate: uploadLab, isPending: isUploading } =
    useUploadLabResult(userId);
  const { mutate: deleteLab } = useDeleteLabResult(userId);

  const handleUpload = (formData: FormData) => {
    uploadLab(formData, {
      onSuccess: () => setUploadOpen(false),
    });
  };

  const handleDelete = (labId: string) => {
    if (!confirm('Delete this lab result? This cannot be undone.')) return;
    deleteLab(labId);
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FlaskConical className="h-4 w-4 text-foreground-muted" />
          <h3 className="text-sm font-medium text-foreground">Lab Results</h3>
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setUploadOpen(true)}
        >
          <Plus className="h-4 w-4 mr-1" />
          Upload Result
        </Button>
      </div>

      <div className="p-6">
        {isLoading ? (
          <LabResultsSkeleton />
        ) : !labs || labs.length === 0 ? (
          <div className="text-center py-12 text-foreground-muted text-sm">
            No lab results yet. Upload the first one.
          </div>
        ) : (
          <div className="space-y-2">
            {labs.map((lab) => {
              const isPdf = lab.content_type === 'application/pdf';
              const Icon = isPdf ? FileText : ImageIcon;
              const iconColor = isPdf ? 'text-red-400' : 'text-blue-400';
              const iconBg = isPdf ? 'bg-red-500/10' : 'bg-blue-500/10';

              return (
                <div
                  key={lab.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg bg-secondary/30 group"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`p-2 ${iconBg} rounded-lg shrink-0`}>
                      <Icon className={`h-5 w-5 ${iconColor}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">
                        {lab.title}
                      </p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-foreground-secondary">
                          Tested: {formatDate(lab.tested_at)}
                        </span>
                        <span className="text-xs text-foreground-muted">
                          Uploaded {formatDate(lab.created_at)}
                        </span>
                        <span className="text-xs text-foreground-muted">
                          {formatSize(lab.size_bytes)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setPreviewLab(lab)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <button
                      onClick={() => handleDelete(lab.id)}
                      className="opacity-0 group-hover:opacity-100 p-2 text-foreground-muted hover:text-destructive transition-all"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <UploadLabResultDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onSubmit={handleUpload}
        isPending={isUploading}
      />

      <LabResultPreviewDialog
        userId={userId}
        lab={previewLab}
        open={!!previewLab}
        onOpenChange={(open) => {
          if (!open) setPreviewLab(null);
        }}
      />
    </div>
  );
}
