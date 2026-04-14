import { createFileRoute } from '@tanstack/react-router';
import { useState, useCallback } from 'react';
import { Plus, Users as UsersIcon } from 'lucide-react';
import { useUsers, useDeleteUser, useCreateUser } from '@/hooks/api/use-users';
import type { UserCreate, UserQueryParams } from '@/lib/api/types';
import { UsersTable } from '@/components/users/users-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const initialFormState: UserCreate = {
  external_user_id: '',
  first_name: '',
  last_name: '',
  email: '',
};

const DEFAULT_PAGE_SIZE = 9;

export const Route = createFileRoute('/_authenticated/users/')({
  component: UsersPage,
});

function UsersPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [formData, setFormData] = useState<UserCreate>(initialFormState);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [queryParams, setQueryParams] = useState<UserQueryParams>({
    page: 1,
    limit: DEFAULT_PAGE_SIZE,
    sort_by: 'created_at',
    sort_order: 'desc',
  });

  const { data, isLoading, isFetching, error, refetch } = useUsers(queryParams);
  const deleteUser = useDeleteUser();
  const createUser = useCreateUser();

  const handleQueryChange = useCallback((params: UserQueryParams) => {
    setQueryParams(params);
  }, []);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (formData.external_user_id && formData.external_user_id.length > 255) {
      errors.external_user_id =
        'External ID must be 255 characters or less';
    }

    if (formData.first_name && formData.first_name.length > 100) {
      errors.first_name = 'First name must be 100 characters or less';
    }

    if (formData.last_name && formData.last_name.length > 100) {
      errors.last_name = 'Last name must be 100 characters or less';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateUser = () => {
    if (!validateForm()) return;

    const payload: UserCreate = {
      external_user_id: formData.external_user_id?.trim() || null,
      first_name: formData.first_name?.trim() || null,
      last_name: formData.last_name?.trim() || null,
      email: formData.email?.trim() || null,
    };

    createUser.mutate(payload, {
      onSuccess: () => {
        setIsCreateDialogOpen(false);
        setFormData(initialFormState);
        setFormErrors({});
      },
    });
  };

  const handleCloseCreateDialog = () => {
    setIsCreateDialogOpen(false);
    setFormData(initialFormState);
    setFormErrors({});
  };

  const handleDeleteUser = () => {
    if (deleteUserId) {
      deleteUser.mutate(deleteUserId, {
        onSuccess: () => {
          setDeleteUserId(null);
        },
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-medium text-foreground">Members</h1>
          <p className="text-sm text-foreground-muted mt-1">
            Manage your studio members
          </p>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-muted rounded-md w-full" />
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 bg-muted/50 rounded-md" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <p className="text-foreground-secondary mb-4">
            Failed to load members. Please try again.
          </p>
          <Button onClick={() => refetch()}>Retry</Button>
        </div>
      </div>
    );
  }

  const users = data?.items ?? [];
  const total = data?.total ?? 0;
  const pageCount = data?.pages ?? 0;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-medium text-foreground">Members</h1>
          <p className="text-sm text-foreground-muted mt-1">
            Manage your studio members and their wearable connections
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Member
        </Button>
      </div>

      {total > 0 || queryParams.search ? (
        <UsersTable
          data={users}
          total={total}
          page={queryParams.page ?? 1}
          pageSize={queryParams.limit ?? DEFAULT_PAGE_SIZE}
          pageCount={pageCount}
          isLoading={isFetching}
          onDelete={setDeleteUserId}
          isDeleting={deleteUser.isPending}
          onQueryChange={handleQueryChange}
        />
      ) : (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <UsersIcon className="h-12 w-12 text-foreground-secondary mx-auto mb-4" />
          <p className="text-foreground-secondary mb-2">No members yet</p>
          <Button
            variant="outline"
            onClick={() => setIsCreateDialogOpen(true)}
            className="mt-4"
          >
            <Plus className="h-4 w-4" />
            Add First Member
          </Button>
        </div>
      )}

      <Dialog
        open={isCreateDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseCreateDialog();
          } else {
            setIsCreateDialogOpen(true);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Member</DialogTitle>
            <DialogDescription>
              Add a new member to connect wearable devices and track their
              health data.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="external_user_id" className="text-foreground">
                External ID
              </Label>
              <Input
                id="external_user_id"
                type="text"
                placeholder="e.g., user_12345 or external system ID"
                value={formData.external_user_id || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    external_user_id: e.target.value,
                  })
                }
                maxLength={255}
                className="bg-muted border-border-hover"
              />
              {formErrors.external_user_id && (
                <p className="text-xs text-destructive">
                  {formErrors.external_user_id}
                </p>
              )}
              <p className="text-[10px] text-foreground-muted">
                Your unique identifier for this user (max 255 characters)
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="first_name" className="text-foreground">
                  First Name
                </Label>
                <Input
                  id="first_name"
                  type="text"
                  placeholder="John"
                  value={formData.first_name || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, first_name: e.target.value })
                  }
                  maxLength={100}
                  className="bg-muted border-border-hover"
                />
                {formErrors.first_name && (
                  <p className="text-xs text-destructive">
                    {formErrors.first_name}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="last_name" className="text-foreground">
                  Last Name
                </Label>
                <Input
                  id="last_name"
                  type="text"
                  placeholder="Doe"
                  value={formData.last_name || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, last_name: e.target.value })
                  }
                  maxLength={100}
                  className="bg-muted border-border-hover"
                />
                {formErrors.last_name && (
                  <p className="text-xs text-destructive">{formErrors.last_name}</p>
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-foreground">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="john.doe@example.com"
                value={formData.email || ''}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="bg-muted border-border-hover"
              />
              {formErrors.email && (
                <p className="text-xs text-destructive">{formErrors.email}</p>
              )}
            </div>
          </div>
          <DialogFooter className="gap-3">
            <Button variant="outline" onClick={handleCloseCreateDialog}>
              Cancel
            </Button>
            <Button onClick={handleCreateUser} disabled={createUser.isPending}>
              {createUser.isPending ? 'Creating...' : 'Add Member'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!deleteUserId}
        onOpenChange={(open) => !open && setDeleteUserId(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Remove Member?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently remove the
              member and all associated data including:
            </DialogDescription>
          </DialogHeader>
          <div>
            <ul className="list-disc list-inside text-sm text-foreground-muted space-y-1">
              <li>All wearable device connections</li>
              <li>All health data (sleep, activity)</li>
              <li>All automation triggers for this user</li>
            </ul>
            <div className="mt-4 p-3 bg-muted rounded-md">
              <p className="text-xs text-foreground-muted">Member ID:</p>
              <code className="font-mono text-sm text-foreground">
                {deleteUserId}
              </code>
            </div>
          </div>
          <DialogFooter className="gap-3">
            <Button variant="outline" onClick={() => setDeleteUserId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={deleteUser.isPending}
            >
              {deleteUser.isPending ? 'Removing...' : 'Remove Member'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
