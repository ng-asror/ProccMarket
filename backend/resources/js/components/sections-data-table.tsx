import { IconChevronDown, IconDotsVertical, IconEdit, IconLayoutColumns, IconPlus, IconSearch, IconTrash } from '@tabler/icons-react';
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
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { router } from '@inertiajs/react';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { parse } from 'path';

// Schema for section data validation
export const sectionSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  access_price: z.number(),
  default_roles: z.array(z.number()).nullable(),
  image: z.string().nullable(),
  image_url: z.string().nullable(),
  topics_count: z.number().optional(),
  users_count: z.number().optional(),
});

// Role type for dropdown
export type Role = {
  id: number;
  name: string;
};

function RoleMultiSelect({
  value,
  onChange,
  roles,
}: {
  value: number[];
  onChange: (value: number[]) => void;
  roles: any[];
}) {
  return (
    <Select
      onValueChange={(val) => {
        const numVal = parseInt(val);
        console.log(numVal, value);
        
        onChange(
          value.map(Number).includes(numVal)
            ? value.map(Number).filter((v) => v !== numVal)
            : [...value.map(Number), numVal]
        );
      }}
    >
      <SelectTrigger className="border rounded-md">
        <SelectValue placeholder="Select roles" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Roles</SelectLabel>
          {roles.map((role) => (
            <SelectItem key={role.id} value={role.id.toString()}>
              <div className="flex items-center">
                <Checkbox checked={value.map(Number).includes(role.id)} className="mr-2" />
                {role.name} ({role.users_count} users)
              </div>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

// Section Edit/Add Dialog Component
function SectionDialog({
  section,
  onUpdate,
  isEdit = false,
  roles
}: {
  section?: z.infer<typeof sectionSchema>;
  onUpdate: () => void;
  isEdit?: boolean;
  roles: Role[];
}) {
  const [open, setOpen] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: section?.name || '',
    description: section?.description || '',
    access_price: section?.access_price.toString() || '0',
    default_roles: section?.default_roles || [],
  });
  const [imageFile, setImageFile] = React.useState<File | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const formDataToSend = new FormData();
    formDataToSend.append('name', formData.name);
    formDataToSend.append('description', formData.description);
    formDataToSend.append('access_price', formData.access_price);
    formData.default_roles.forEach(roleId => {
      formDataToSend.append('default_roles[]', roleId);
    });

    if (imageFile) {
      formDataToSend.append('image', imageFile);
    }

    if (isEdit && section) {
      formDataToSend.append('_method', 'PATCH');
      router.post(route('admin.sections.update', section.id), formDataToSend, {
        onSuccess: () => {
          toast.success('Section updated successfully');
          setOpen(false);
          onUpdate();
        },
        onError: (errors) => {
          toast.error('Failed to update section');
        },
      });
    } else {
      router.post(route('admin.sections.store'), formDataToSend, {
        onSuccess: () => {
          toast.success('Section created successfully');
          setOpen(false);
          setFormData({
            name: '',
            description: '',
            access_price: '0',
            default_roles: []
          });
          setImageFile(null);
          onUpdate();
        },
        onError: (errors) => {
          toast.error('Failed to create section');
        },
      });
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEdit ? (
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <IconEdit className="mr-2 h-4 w-4" />
            Edit Section
          </DropdownMenuItem>
        ) : (
          <Button size="sm">
            <IconPlus className="mr-2 h-4 w-4" />
            Add Section
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Section' : 'Create New Section'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="col-span-3"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="access_price" className="text-right">
                Access Price
              </Label>
              <Input
                id="access_price"
                type="number"
                value={formData.access_price}
                onChange={(e) => setFormData({ ...formData, access_price: e.target.value })}
                className="col-span-3"
                min="0"
                step="0.01"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="default_roles" className="text-right">
                Free Access Roles
              </Label>
              <div className="col-span-3">
                <RoleMultiSelect
                  value={formData.default_roles}
                  onChange={(val) => setFormData({ ...formData, default_roles: val })}
                  roles={roles}
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  {formData.default_roles.map((id) => {
                    const role = roles.find((r) => r.id == id);
                    return role ? (
                      <Badge key={id} variant="secondary" className="text-sm">
                        {role.name} ({role.users_count} users)
                      </Badge>
                    ) : null;
                  })}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="image" className="text-right">
                Image
              </Label>
              <Input
                id="image"
                type="file"
                onChange={handleImageChange}
                className="col-span-3"
                accept="image/*"
              />
            </div>
            {isEdit && section?.image && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">
                  Current Image
                </Label>
                <div className="col-span-3">
                  <img
                    src={section.image_url}
                    alt={section.name}
                    className="h-20 w-20 object-cover rounded-md"
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="submit">{isEdit ? 'Save Changes' : 'Create Section'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const columns = (refreshData: () => void, roles: Role[]): ColumnDef<z.infer<typeof sectionSchema>>[] => [
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
      <Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} aria-label="Select row" />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        Name
        <IconChevronDown className={`ml-2 h-4 w-4 ${column.getIsSorted() === 'desc' ? 'rotate-180' : ''}`} />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="flex items-center">
        {row.original.image && (
          <img
            src={row.original.image_url}
            alt={row.original.name}
            className="h-10 w-10 object-cover rounded-md mr-3"
          />
        )}
        <div>
          <div className="font-medium">{row.original.name}</div>
          {row.original.description && (
            <div className="text-sm text-muted-foreground line-clamp-1">
              {row.original.description}
            </div>
          )}
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'access_price',
    header: ({ column }) => (
      <div className="text-right">
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Access Price
          <IconChevronDown className={`ml-2 h-4 w-4 ${column.getIsSorted() === 'desc' ? 'rotate-180' : ''}`} />
        </Button>
      </div>
    ),
    cell: ({ row }) => (
      <div className="text-right font-medium">
        {row.original.access_price.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
      </div>
    ),
  },
  {
    accessorKey: 'default_roles',
    header: () => <div className="text-center">Free Access Roles</div>,
    cell: ({ row }) => {
      const defaultRoles = row.original.default_roles || [];
      return (
        <div className="text-center">
          {defaultRoles.length > 0 ? (
            <div className="flex flex-wrap justify-center gap-1">
              {defaultRoles.slice(0, 3).map(roleId => {
                const role = roles.find(role => role.id == roleId);
                return role ? (
                  <Badge key={roleId} variant="secondary" className="text-xs">
                    {role.name}
                  </Badge>
                ) : null;
              })}
              {defaultRoles.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{defaultRoles.length - 3} more
                </Badge>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground">None</span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'topics_count',
    header: () => <div className="text-center">Topics</div>,
    cell: ({ row }) => <div className="text-center font-medium">{row.original.topics_count || 0}</div>,
  },
  {
    accessorKey: 'users_count',
    header: () => <div className="text-center">Users</div>,
    cell: ({ row }) => <div className="text-center font-medium">{row.original.users_count || 0}</div>,
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const section = row.original;

      const handleDelete = () => {
        if (section.topics_count && section.topics_count > 0) {
          toast.error('Cannot delete section with topics. Please remove all topics first.');
          return;
        }

        if (confirm('Are you sure you want to delete this section?')) {
          router.delete(route('admin.sections.destroy', section.id), {
            onSuccess: () => {
              toast.success('Section deleted successfully');
              refreshData();
            },
            onError: () => {
              toast.error('Failed to delete section');
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
            <SectionDialog section={section} onUpdate={refreshData} isEdit={true} roles={roles} />
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleDelete} className="text-red-600">
              <IconTrash className="mr-2 h-4 w-4" />
              Delete Section
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

export function SectionsDataTable({ data, filters, roles }: { data: any; filters: any; roles: Role[] }) {
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [search, setSearch] = React.useState(filters.search || '');

  // Debounced search
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      router.get(
        route('admin.sections.index'),
        { search },
        {
          preserveState: true,
          replace: true,
        },
      );
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [search]);

  // Handle sorting
  React.useEffect(() => {
    if (sorting.length > 0) {
      const sort = sorting[0];
      router.get(
        route('admin.sections.index'),
        {
          search,
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
    columns: columns(refreshData, roles),
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

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex items-center justify-between px-4 lg:px-6">
        <h2 className="text-2xl font-bold tracking-tight">Forum Sections</h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <IconSearch className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search sections..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-64 pl-8" />
          </div>

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

          <SectionDialog onUpdate={refreshData} roles={roles} />
        </div>
      </div>

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
                  <TableCell colSpan={columns(refreshData, roles).length} className="h-24 text-center">
                    No sections found.
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
                    { search, sort_by: sorting[0]?.id, sort_direction: sorting[0]?.desc ? 'desc' : 'asc' },
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
                    { search, sort_by: sorting[0]?.id, sort_direction: sorting[0]?.desc ? 'asc' : 'desc' },
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