import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useLabResultBlobUrl } from '@/hooks/api/use-lab-results';
import type { LabResult } from '@/lib/api/lab-results';

interface LabResultPreviewDialogProps {
  userId: string;
  lab: LabResult | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatTestDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function LabResultPreviewDialog({
  userId,
  lab,
  open,
  onOpenChange,
}: LabResultPreviewDialogProps) {
  const { blobUrl, isLoading } = useLabResultBlobUrl(
    userId,
    open ? lab : null
  );

  const isPdf = lab?.content_type === 'application/pdf';
  const isImage = lab?.content_type?.startsWith('image/');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{lab?.title || 'Lab Result'}</DialogTitle>
          <DialogDescription>
            {lab ? `Test date: ${formatTestDate(lab.tested_at)}` : null}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-[70vh] bg-muted rounded-md overflow-hidden flex items-center justify-center">
          {isLoading || !blobUrl ? (
            <div className="flex flex-col items-center gap-2 text-foreground-muted">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-sm">Loading file...</span>
            </div>
          ) : isPdf ? (
            <iframe
              src={blobUrl}
              title={lab?.title}
              className="w-full h-full min-h-[70vh] border-0"
            />
          ) : isImage ? (
            <img
              src={blobUrl}
              alt={lab?.title}
              className="max-w-full max-h-[70vh] object-contain"
            />
          ) : (
            <span className="text-sm text-foreground-muted">
              Unsupported file type
            </span>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
