'use client';

import { useState, useEffect, useRef } from 'react';
import { Link } from '@tanstack/react-router';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type PaginationState,
} from '@tanstack/react-table';
import {
  Search,
  Eye,
  Trash2,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Link as LinkIcon,
  Loader2,
  Upload,
  Circle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { UserRead, UserQueryParams } from '@/lib/api/types';
import { copyToClipboard } from '@/lib/utils/clipboard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppleXmlUpload } from '@/hooks/api/use-users';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';

interface UsersTableProps {
  data: UserRead[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  isLoading?: boolean;
  onDelete: (userId: string) => void;
  isDeleting?: boolean;
  onQueryChange: (params: UserQueryParams) => void;
}

const columnToSortBy: Record<string, UserQueryParams['sort_by']> = {
  created_at: 'created_at',
  email: 'email',
  first_name: 'first_name',
  name: 'first_name',
};

function getInitials(firstName: string | null, lastName: string | null): string {
  const f = firstName?.charAt(0)?.toUpperCase() || '';
  const l = lastName?.charAt(0)?.toUpperCase() || '';
  return f + l || '?';
}

const avatarColors = [
  'bg-indigo-100 text-indigo-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-sky-100 text-sky-700',
  'bg-violet-100 text-violet-700',
  'bg-teal-100 text-teal-700',
];

function getAvatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

export function UsersTable({
  data,
  total,
  page,
  pageSize,
  pageCount,
  isLoading,
  onDelete,
  isDeleting,
  onQueryChange,
}: UsersTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'created_at', desc: true },
  ]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: page - 1,
    pageSize,
  });
  const [globalFilter, setGlobalFilter] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [copiedPairLink, setCopiedPairLink] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const { handleUpload, uploadingUserId } = useAppleXmlUpload();

  const onQueryChangeRef = useRef(onQueryChange);
  useEffect(() => {
    onQueryChangeRef.current = onQueryChange;
  });

  const prevSearchRef = useRef(debouncedSearch);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(globalFilter);
    }, 300);
    return () => clearTimeout(timer);
  }, [globalFilter]);

  useEffect(() => {
    const searchChanged = prevSearchRef.current !== debouncedSearch;
    prevSearchRef.current = debouncedSearch;

    if (searchChanged && pagination.pageIndex !== 0) {
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
      return;
    }

    const effectivePage = searchChanged ? 1 : pagination.pageIndex + 1;
    const sortColumn = sorting[0];
    const sortBy = sortColumn ? columnToSortBy[sortColumn.id] : 'created_at';
    const sortOrder = sortColumn?.desc ? 'desc' : 'asc';

    onQueryChangeRef.current({
      page: effectivePage,
      limit: pagination.pageSize,
      sort_by: sortBy,
      sort_order: sortOrder,
      search: debouncedSearch || undefined,
    });
  }, [pagination, sorting, debouncedSearch]);

  const handleCopyPairLink = async (userId: string) => {
    const pairLink = `${window.location.origin}/users/${userId}/pair`;
    const success = await copyToClipboard(
      pairLink,
      'Pairing link copied to clipboard'
    );
    if (success) {
      setCopiedPairLink(userId);
      setTimeout(() => setCopiedPairLink(null), 2000);
    }
  };

  const handleUploadClick = (userId: string) => {
    fileInputRefs.current[userId]?.click();
  };

  const SortableHeader = ({
    column,
    children,
  }: {
    column: {
      id: string;
      getIsSorted: () => false | 'asc' | 'desc';
      toggleSorting: (desc?: boolean) => void;
    };
    children: React.ReactNode;
  }) => {
    const isSortable = column.id in columnToSortBy;

    if (!isSortable) {
      return (
        <span className="text-xs font-medium text-foreground-muted uppercase tracking-wider">
          {children}
        </span>
      );
    }

    return (
      <button
        className="flex items-center gap-1 text-xs font-medium text-foreground-muted uppercase tracking-wider hover:text-foreground-secondary transition-colors"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        {children}
        {column.getIsSorted() === 'asc' ? (
          <ChevronUp className="h-3 w-3" />
        ) : column.getIsSorted() === 'desc' ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronsUpDown className="h-3 w-3 opacity-50" />
        )}
      </button>
    );
  };

  const columns: ColumnDef<UserRead>[] = [
    {
      id: 'member',
      accessorFn: (row) =>
        `${row.first_name || ''} ${row.last_name || ''}`.trim(),
      header: ({ column }) => (
        <SortableHeader column={column}>Member</SortableHeader>
      ),
      cell: ({ row }) => {
        const fullName =
          `${row.original.first_name || ''} ${row.original.last_name || ''}`.trim();
        const initials = getInitials(
          row.original.first_name,
          row.original.last_name
        );
        const colorClass = getAvatarColor(row.original.id);
        return (
          <Link
            to="/users/$userId"
            params={{ userId: row.original.id }}
            className="flex items-center gap-3 group"
          >
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${colorClass}`}
            >
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                {fullName || 'Unnamed Member'}
              </p>
              <p className="text-xs text-foreground-muted truncate">
                {row.original.email || 'No email'}
              </p>
            </div>
          </Link>
        );
      },
    },
    {
      id: 'status',
      header: () => (
        <span className="text-xs font-medium text-foreground-muted uppercase tracking-wider">
          Status
        </span>
      ),
      cell: () => (
        <div className="flex items-center gap-1.5">
          <Circle className="h-2 w-2 fill-status-online text-status-online" />
          <span className="text-xs text-foreground-secondary">Active</span>
        </div>
      ),
      enableSorting: false,
    },
    {
      accessorKey: 'created_at',
      header: ({ column }) => (
        <SortableHeader column={column}>Joined</SortableHeader>
      ),
      cell: ({ row }) => (
        <span className="text-xs text-foreground-muted">
          {formatDistanceToNow(new Date(row.original.created_at), {
            addSuffix: true,
          })}
        </span>
      ),
    },
    {
      id: 'actions',
      header: () => (
        <span className="text-xs font-medium text-foreground-muted uppercase tracking-wider text-right block">
          Actions
        </span>
      ),
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <Button variant="outline" size="icon" asChild>
            <Link to="/users/$userId" params={{ userId: row.original.id }}>
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleUploadClick(row.original.id)}
            disabled={uploadingUserId === row.original.id}
            title="Upload Apple Health XML"
          >
            {uploadingUserId === row.original.id ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
          </Button>
          <input
            ref={(el) => {
              fileInputRefs.current[row.original.id] = el;
            }}
            type="file"
            accept=".xml"
            onChange={(e) => handleUpload(row.original.id, e)}
            className="hidden"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleCopyPairLink(row.original.id)}
            title="Copy pairing link"
          >
            {copiedPairLink === row.original.id ? (
              <Check className="h-4 w-4 text-status-online" />
            ) : (
              <LinkIcon className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="destructive-outline"
            size="icon"
            onClick={() => onDelete(row.original.id)}
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
      enableSorting: false,
    },
  ];

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      pagination,
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    pageCount,
  });

  const currentPage = pagination.pageIndex;

  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisible = 5;

    if (pageCount <= maxVisible) {
      for (let i = 0; i < pageCount; i++) {
        pages.push(i);
      }
    } else {
      pages.push(0);

      if (currentPage > 2) {
        pages.push('ellipsis');
      }

      const start = Math.max(1, currentPage - 1);
      const end = Math.min(pageCount - 2, currentPage + 1);

      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) {
          pages.push(i);
        }
      }

      if (currentPage < pageCount - 3) {
        pages.push('ellipsis');
      }

      if (!pages.includes(pageCount - 1)) {
        pages.push(pageCount - 1);
      }
    }

    return pages;
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" />
          <Input
            type="text"
            placeholder="Search members by name or email..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="bg-secondary border-border px-9"
          />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted animate-spin" />
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className="border-b border-border text-left"
              >
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="px-4 py-3">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-border">
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center">
                  <p className="text-foreground-secondary">
                    {globalFilter
                      ? 'No members match your search criteria.'
                      : 'No members found'}
                  </p>
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-secondary/50 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pageCount > 0 && (
        <div className="p-4 border-t border-border flex items-center justify-between">
          <div className="text-sm text-foreground-muted">
            Showing{' '}
            <span className="font-medium text-foreground">
              {total === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1}
            </span>{' '}
            to{' '}
            <span className="font-medium text-foreground">
              {Math.min(
                (pagination.pageIndex + 1) * pagination.pageSize,
                total
              )}
            </span>{' '}
            of <span className="font-medium text-foreground">{total}</span> members
          </div>

          {pageCount > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => table.previousPage()}
                    className={
                      !table.getCanPreviousPage()
                        ? 'pointer-events-none opacity-50'
                        : 'cursor-pointer'
                    }
                  />
                </PaginationItem>

                {getPageNumbers().map((pageNum, idx) =>
                  pageNum === 'ellipsis' ? (
                    <PaginationItem key={`ellipsis-${idx}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        onClick={() => table.setPageIndex(pageNum)}
                        isActive={currentPage === pageNum}
                        className="cursor-pointer"
                      >
                        {pageNum + 1}
                      </PaginationLink>
                    </PaginationItem>
                  )
                )}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => table.nextPage()}
                    className={
                      !table.getCanNextPage()
                        ? 'pointer-events-none opacity-50'
                        : 'cursor-pointer'
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      )}
    </div>
  );
}
