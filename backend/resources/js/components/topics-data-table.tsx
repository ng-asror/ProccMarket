import {
  IconChevronDown,
  IconDotsVertical,
  IconLayoutColumns,
  IconSearch,
  IconTrash,
  IconLock,
  IconLockOpen,
  IconHeart,
  IconEye,
  IconShare,
  IconMessage,
  IconFilter,
  IconX
} from '@tabler/icons-react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from '@tanstack/react-table';
import * as React from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { router } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { topicSchema, User } from '@/types/topic-types';
import { TopicDialog } from './topic-dialog';


const columns = (refreshData: () => void, sections: any[], allSections: any[], users: User[]): ColumnDef<z.infer<typeof topicSchema>>[] => [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'title',
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        Topic
        <IconChevronDown className={`ml-2 h-4 w-4 ${column.getIsSorted() === 'desc' ? 'rotate-180' : ''}`} />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="flex items-start space-x-3 max-w-md">
        {row.original.image_url && (
          <img
            src={row.original.image?.startsWith('http://') || row.original.image?.startsWith('https://') ? row.original.image : row.original.image_url}
            alt={row.original.title}
            className="h-12 w-12 object-cover rounded-md flex-shrink-0"
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="font-medium text-sm line-clamp-2">{row.original.title}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {new Date(row.original.created_at).toLocaleDateString()}
          </div>
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'user',
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        Author
        <IconChevronDown className={`ml-2 h-4 w-4 ${column.getIsSorted() === 'desc' ? 'rotate-180' : ''}`} />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="flex items-center space-x-2">
        <Avatar className="h-8 w-8">
          <AvatarImage src={row.original.user.avatar || undefined} />
          <AvatarFallback>{row.original.user.name?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
        </Avatar>
        <div className="text-sm font-medium">{row.original.user.name}</div>
      </div>
    ),
  },
  {
    accessorKey: 'section',
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        Section
        <IconChevronDown className={`ml-2 h-4 w-4 ${column.getIsSorted() === 'desc' ? 'rotate-180' : ''}`} />
      </Button>
    ),
    cell: ({ row }) => (
      <Badge variant="outline">{row.original.section.name}</Badge>
    ),
  },
  {
    accessorKey: 'posts_count',
    header: ({ column }) => (
      <div className="text-center">
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          <IconMessage className="h-4 w-4" />
          <IconChevronDown className={`ml-1 h-3 w-3 ${column.getIsSorted() === 'desc' ? 'rotate-180' : ''}`} />
        </Button>
      </div>
    ),
    cell: ({ row }) => <div className="text-center font-medium">{row.original.posts_count || 0}</div>,
  },
  {
    accessorKey: 'views_count',
    header: ({ column }) => (
      <div className="text-center">
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          <IconEye className="h-4 w-4" />
          <IconChevronDown className={`ml-1 h-3 w-3 ${column.getIsSorted() === 'desc' ? 'rotate-180' : ''}`} />
        </Button>
      </div>
    ),
    cell: ({ row }) => <div className="text-center font-medium">{row.original.views_count || 0}</div>,
  },
  {
    accessorKey: 'likes_count',
    header: ({ column }) => (
      <div className="text-center">
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          <IconHeart className="h-4 w-4" />
          <IconChevronDown className={`ml-1 h-3 w-3 ${column.getIsSorted() === 'desc' ? 'rotate-180' : ''}`} />
        </Button>
      </div>
    ),
    cell: ({ row }) => (
      <div className="text-center">
        <div className="flex items-center justify-center space-x-1">
          <span className="text-green-600 font-medium">{row.original.likes_count || 0}</span>
          <span className="text-muted-foreground">/</span>
          <span className="text-red-600 font-medium">{row.original.dislikes_count || 0}</span>
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'shares_count',
    header: ({ column }) => (
      <div className="text-center">
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          <IconShare className="h-4 w-4" />
          <IconChevronDown className={`ml-1 h-3 w-3 ${column.getIsSorted() === 'desc' ? 'rotate-180' : ''}`} />
        </Button>
      </div>
    ),
    cell: ({ row }) => <div className="text-center font-medium">{row.original.shares_count || 0}</div>,
  },
  {
    accessorKey: 'closed',
    header: ({ column }) => (
      <div className="text-center">
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Status
          <IconChevronDown className={`ml-1 h-3 w-3 ${column.getIsSorted() === 'desc' ? 'rotate-180' : ''}`} />
        </Button>
      </div>
    ),
    cell: ({ row }) => (
      <div className="text-center">
        {row.original.closed ? (
          <Badge variant="destructive" className="gap-1">
            <IconLock className="h-3 w-3" />
            Closed
          </Badge>
        ) : (
          <Badge variant="secondary" className="gap-1">
            <IconLockOpen className="h-3 w-3" />
            Open
          </Badge>
        )}
      </div>
    ),
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const topic = row.original;

      const handleToggleStatus = () => {
        router.patch(route('admin.topics.toggle-status', topic.id), {}, {
          onSuccess: () => {
            toast.success(`Topic ${topic.closed ? 'opened' : 'closed'} successfully`);
            refreshData();
          },
        });
      };

      const handleDelete = () => {
        if (confirm('Are you sure you want to delete this topic? All related data will be permanently deleted.')) {
          router.delete(route('admin.topics.destroy', topic.id), {
            onSuccess: () => {
              toast.success('Topic deleted successfully');
              refreshData();
            },
            onError: () => {
              toast.error('Failed to delete topic');
            },
          });
        }
      };

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex h-8 w-8 p-0 data-[state=open]:bg-muted" size="icon">
              <IconDotsVertical className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <TopicDialog topic={topic} onUpdate={refreshData} isEdit={true} sections={sections} allSections={allSections} users={users} />
            <DropdownMenuItem onClick={handleToggleStatus}>
              {topic.closed ? (
                <>
                  <IconLockOpen className="mr-2 h-4 w-4" />
                  Open Topic
                </>
              ) : (
                <>
                  <IconLock className="mr-2 h-4 w-4" />
                  Close Topic
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleDelete} className="text-red-600">
              <IconTrash className="mr-2 h-4 w-4" />
              Delete Topic
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

export function TopicsDataTable({
  data,
  filters,
  sections,
  allSections,
  users
}: {
  data: any;
  filters: any;
  sections: any[];
  users: User[];
  allSections: any[];
}) {
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [search, setSearch] = React.useState(filters.search || '');
  const [sectionFilter, setSectionFilter] = React.useState(filters.section_filter || '');
  const [userFilter, setUserFilter] = React.useState(filters.user_filter || '');
  const [statusFilter, setStatusFilter] = React.useState(filters.status_filter || '');

  // Debounced search
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      router.get(
        route('admin.topics.index'),
        {
          search,
          section_filter: sectionFilter || undefined,
          user_filter: userFilter || undefined,
          status_filter: statusFilter || undefined,
        },
        {
          preserveState: true,
          replace: true,
        },
      );
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [search, sectionFilter, userFilter, statusFilter]);

  // Handle sorting
  React.useEffect(() => {
    if (sorting.length > 0) {
      const sort = sorting[0];
      router.get(
        route('admin.topics.index'),
        {
          search,
          section_filter: sectionFilter || undefined,
          user_filter: userFilter || undefined,
          status_filter: statusFilter || undefined,
          sort_by: sort.id,
          sort_direction: sort.desc ? 'desc' : 'asc',
        },
        {
          preserveState: true,
          replace: true,
        },
      );
    }
  }, [sorting]);

  const refreshData = () => {
    router.reload();
  };

  const tableData = React.useMemo(() => data.data || [], [data]);
  const pageCount = data.last_page || 1;
  const currentPage = data.current_page || 1;

  const table = useReactTable({
    data: tableData,
    columns: columns(refreshData, sections, allSections, users),
    state: {
      sorting,
      columnVisibility,
      rowSelection,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    pageCount,
  });

  const selectedRowIds = Object.keys(rowSelection).filter(id => rowSelection[id]).map(Number);
  const selectedTopics = tableData.filter((_, index) => selectedRowIds.includes(index));

  const handleBulkDelete = () => {
    if (selectedTopics.length === 0) {
      toast.error('Please select topics to delete');
      return;
    }

    if (confirm(`Are you sure you want to delete ${selectedTopics.length} topics? All related data will be permanently deleted.`)) {
      const topicIds = selectedTopics.map(topic => topic.id);

      router.post(route('admin.topics.bulk-delete'), {
        topic_ids: topicIds
      }, {
        onSuccess: () => {
          toast.success(`${selectedTopics.length} topics deleted successfully`);
          setRowSelection({});
          refreshData();
        },
        onError: () => {
          toast.error('Failed to delete topics');
        },
      });
    }
  };

  const handleBulkToggleStatus = (status: boolean) => {
    if (selectedTopics.length === 0) {
      toast.error('Please select topics to update');
      return;
    }

    const topicIds = selectedTopics.map(topic => topic.id);
    const statusText = status ? 'close' : 'open';

    router.post(route('admin.topics.bulk-toggle-status'), {
      topic_ids: topicIds,
      status: status
    }, {
      onSuccess: () => {
        toast.success(`${selectedTopics.length} topics ${statusText}d successfully`);
        setRowSelection({});
        refreshData();
      },
      onError: () => {
        toast.error(`Failed to ${statusText} topics`);
      },
    });
  };

  const clearFilters = () => {
    setSearch('');
    setSectionFilter('');
    setUserFilter('');
    setStatusFilter('');
  };

  const hasActiveFilters = search || sectionFilter || userFilter || statusFilter;

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex items-center justify-between px-4 lg:px-6">
        <h2 className="text-2xl font-bold tracking-tight">Forum Topics</h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <IconSearch className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search topics..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64 pl-8"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <IconFilter className="h-4 w-4" />
                <span className="sr-only lg:not-sr-only lg:ml-2">Filters</span>
                <IconChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-4">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Section</Label>
                  <Select value={sectionFilter} onValueChange={setSectionFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All sections" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={undefined}>All sections</SelectItem>
                      {sections.map((section) => (
                        <SelectItem key={section.id} value={section.id.toString()}>
                          {section.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium">User</Label>
                  <Select value={userFilter} onValueChange={setUserFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All users" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={undefined}>All users</SelectItem>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          <div className="flex items-center">
                            <Avatar className="h-6 w-6 mr-2">
                              <AvatarImage src={user.avatar || undefined} />
                              <AvatarFallback>{user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            {user.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={undefined}>All statuses</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {hasActiveFilters && (
                  <Button variant="outline" size="sm" onClick={clearFilters} className="w-full">
                    <IconX className="h-4 w-4 mr-2" />
                    Clear Filters
                  </Button>
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <IconLayoutColumns className="h-4 w-4" />
                <span className="sr-only lg:not-sr-only lg:ml-2">Columns</span>
                <IconChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {table
                .getAllColumns()
                .filter((column) => typeof column.accessorFn !== 'undefined' && column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {column.id.replace('_', ' ')}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>

          <TopicDialog onUpdate={refreshData} sections={sections} allSections={allSections} users={users} />
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedTopics.length > 0 && (
        <div className="px-4 lg:px-6">
          <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg border">
            <span className="text-sm font-medium">
              {selectedTopics.length} topic{selectedTopics.length !== 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center gap-2 ml-auto">
              <Button size="sm" variant="outline" onClick={() => handleBulkToggleStatus(false)}>
                <IconLockOpen className="h-4 w-4 mr-2" />
                Open Selected
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleBulkToggleStatus(true)}>
                <IconLock className="h-4 w-4 mr-2" />
                Close Selected
              </Button>
              <Button size="sm" variant="destructive" onClick={handleBulkDelete}>
                <IconTrash className="h-4 w-4 mr-2" />
                Delete Selected
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="px-4 lg:px-6">
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id} colSpan={header.colSpan}>
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns(refreshData, sections, allSections, users).length} className="h-24 text-center">
                    No topics found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between space-x-2 px-4 py-4">
          <div className="flex-1 text-sm text-muted-foreground">
            {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div className="flex items-center space-x-6 lg:space-x-8">
            <div className="flex w-[100px] items-center justify-center text-sm font-medium">
              Page {currentPage} of {pageCount}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  router.get(
                    data.prev_page_url,
                    {
                      search,
                      section_filter: sectionFilter || undefined,
                      user_filter: userFilter || undefined,
                      status_filter: statusFilter || undefined,
                      sort_by: sorting[0]?.id,
                      sort_direction: sorting[0]?.desc ? 'desc' : 'asc'
                    },
                    {
                      preserveState: true,
                      preserveScroll: true,
                    },
                  );
                }}
                disabled={!data.prev_page_url}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  router.get(
                    data.next_page_url,
                    {
                      search,
                      section_filter: sectionFilter || undefined,
                      user_filter: userFilter || undefined,
                      status_filter: statusFilter || undefined,
                      sort_by: sorting[0]?.id,
                      sort_direction: sorting[0]?.desc ? 'desc' : 'asc'
                    },
                    {
                      preserveState: true,
                      preserveScroll: true,
                    },
                  );
                }}
                disabled={!data.next_page_url}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}