import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState, useRef, useMemo, useEffect, type ReactNode } from 'react';
import { z } from 'zod';
import {
  ArrowLeft,
  Link as LinkIcon,
  Trash2,
  Check,
  Upload,
  Loader2,
  LayoutDashboard,
  Dumbbell,
  Moon,
  Scale,
  FlaskConical,
  Key,
  Copy,
  ClipboardList,
  type LucideIcon,
} from 'lucide-react';
import {
  useUser,
  useDeleteUser,
  useAppleXmlUpload,
  useGenerateInvitationCode,
} from '@/hooks/api/use-users';
import { ROUTES } from '@/lib/constants/routes';
import { copyToClipboard } from '@/lib/utils/clipboard';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { SleepSection } from '@/components/user/sleep-section';
import { ActivitySection } from '@/components/user/activity-section';
import { BodySection } from '@/components/user/body-section';
import { LabResultsSection } from '@/components/user/lab-results-section';
import { WorkoutSection } from '@/components/user/workout-section';
import { HealthScoresDashboard } from '@/components/user/health-scores-dashboard';
import { AIHealthSummary } from '@/components/user/ai-health-summary';
import { CoachingNotes } from '@/components/user/coaching-notes';
import type { DateRangeValue } from '@/components/ui/date-range-selector';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

const userSearchSchema = z.object({
  tab: z.string().optional(),
});

export const Route = createFileRoute('/_authenticated/users/$userId')({
  component: UserDetailPage,
  validateSearch: userSearchSchema,
});

interface TabConfig {
  id: string;
  label: string;
  icon: LucideIcon;
  content: ReactNode;
}

function UserDetailPage() {
  const { userId } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { data: user, isLoading: userLoading } = useUser(userId);

  // Tab state — initialize from search param
  const [activeTab, setActiveTab] = useState(search.tab || 'overview');

  // Sync tab from URL search param changes
  useEffect(() => {
    if (search.tab && search.tab !== activeTab) {
      setActiveTab(search.tab);
    }
  }, [search.tab]);

  // Date range states for different sections
  const [workoutDateRange, setWorkoutDateRange] = useState<DateRangeValue>(30);
  const [activityDateRange, setActivityDateRange] =
    useState<DateRangeValue>(30);
  const [sleepDateRange, setSleepDateRange] = useState<DateRangeValue>(30);

  const { mutate: deleteUser, isPending: isDeleting } = useDeleteUser();
  const { handleUpload, isUploading: isUploadingFile } = useAppleXmlUpload();
  const {
    mutate: generateToken,
    data: tokenData,
    isPending: isGeneratingToken,
  } = useGenerateInvitationCode();
  const [copied, setCopied] = useState(false);
  const [tokenCopied, setTokenCopied] = useState(false);
  const [isTokenDialogOpen, setIsTokenDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isUploading = isUploadingFile(userId);

  // Tab configuration
  const tabs: TabConfig[] = useMemo(
    () => [
      {
        id: 'overview',
        label: 'Overview',
        icon: LayoutDashboard,
        content: <HealthScoresDashboard userId={userId} />,
      },
      {
        id: 'activity',
        label: 'Activity & Workouts',
        icon: Dumbbell,
        content: (
          <div className="space-y-8">
            <ActivitySection
              userId={userId}
              dateRange={activityDateRange}
              onDateRangeChange={setActivityDateRange}
            />
            <WorkoutSection
              userId={userId}
              dateRange={workoutDateRange}
              onDateRangeChange={setWorkoutDateRange}
            />
          </div>
        ),
      },
      {
        id: 'sleep',
        label: 'Sleep',
        icon: Moon,
        content: (
          <SleepSection
            userId={userId}
            dateRange={sleepDateRange}
            onDateRangeChange={setSleepDateRange}
          />
        ),
      },
      {
        id: 'body',
        label: 'Body & Vitals',
        icon: Scale,
        content: <BodySection userId={userId} />,
      },
      {
        id: 'lab-results',
        label: 'Lab Results',
        icon: FlaskConical,
        content: <LabResultsSection userId={userId} />,
      },
      {
        id: 'notes',
        label: 'Notes & Messages',
        icon: ClipboardList,
        content: <CoachingNotes userId={userId} />,
      },
    ],
    [userId, workoutDateRange, activityDateRange, sleepDateRange]
  );

  const handleCopyPairLink = async () => {
    const pairLink = `${window.location.origin}/users/${userId}/pair`;
    const success = await copyToClipboard(
      pairLink,
      'Pairing link copied to clipboard'
    );
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleDelete = () => {
    deleteUser(userId, {
      onSuccess: () => {
        navigate({ to: ROUTES.users });
      },
    });
  };

  const handleGenerateToken = () => {
    generateToken(userId, {
      onSuccess: () => {
        setIsTokenDialogOpen(true);
      },
    });
  };

  const handleCopyToken = async () => {
    const success = await copyToClipboard(
      tokenData?.access_token || '',
      'Token copied to clipboard'
    );
    if (success) {
      setTokenCopied(true);
      setTimeout(() => setTokenCopied(false), 2000);
    }
  };
  if (!userLoading && !user) {
    return (
      <div className="p-8">
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <p className="text-foreground-secondary">Client not found</p>
          <Button variant="outline" className="mt-4" asChild>
            <Link to={ROUTES.users}>
              <ArrowLeft className="h-4 w-4" />
              Back to Clients
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to={ROUTES.users}
            className="p-2 text-foreground-secondary hover:text-foreground hover:bg-muted rounded-md transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          {userLoading ? (
            <div className="space-y-2">
              <div className="h-7 w-48 bg-muted rounded animate-pulse" />
              <div className="h-4 w-32 bg-muted/50 rounded animate-pulse" />
            </div>
          ) : (
            <div>
              <h1 className="text-2xl font-medium text-foreground">
                {user?.first_name || user?.last_name
                  ? `${user?.first_name || ''} ${user?.last_name || ''}`.trim()
                  : 'Unnamed Client'}
              </h1>
              <p className="text-sm text-foreground-muted">
                {user?.email || 'No email'}
              </p>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={handleUploadClick}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Upload Apple Health XML
              </>
            )}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xml"
            onChange={(e) => handleUpload(userId, e)}
            className="hidden"
          />
          <Button variant="secondary" onClick={handleCopyPairLink}>
            {copied ? (
              <>
                <Check className="h-4 w-4 text-emerald-600" />
                Copied!
              </>
            ) : (
              <>
                <LinkIcon className="h-4 w-4" />
                Copy Pairing Link
              </>
            )}
          </Button>
          <Button
            variant="secondary"
            onClick={handleGenerateToken}
            disabled={isGeneratingToken}
          >
            {isGeneratingToken ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Key className="h-4 w-4" />
                Generate SDK Token
              </>
            )}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isDeleting}>
                <Trash2 className="h-4 w-4" />
                {isDeleting ? 'Removing...' : 'Remove Client'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove Client</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to remove this client? This action cannot
                  be undone and will permanently delete all associated data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* AI Health Summary */}
      {!userLoading && user && (
        <AIHealthSummary
          userId={userId}
          memberName={
            user.first_name || user.last_name
              ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
              : 'this client'
          }
        />
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="gap-2">
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {tabs.map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className="space-y-6">
            {tab.content}
          </TabsContent>
        ))}
      </Tabs>

      {/* Token Dialog */}
      <Dialog open={isTokenDialogOpen} onOpenChange={setIsTokenDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Client Token Generated</DialogTitle>
            <DialogDescription>
              This token has infinite expiration time and can be used to access
              SDK endpoints for this user. Store it securely.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="token" className="text-foreground">
                Access Token
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="token"
                  readOnly
                  value={tokenData?.access_token || ''}
                  className="bg-muted border-border-hover font-mono text-sm focus-visible:ring-0"
                />
                <Button
                  onClick={handleCopyToken}
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                >
                  {tokenCopied ? (
                    <Check className="h-4 w-4 text-status-online" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-foreground-muted">
                Token type: {tokenData?.token_type || 'bearer'}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
