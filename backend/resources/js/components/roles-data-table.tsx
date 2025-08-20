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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { router } from '@inertiajs/react';

// Schema for role data validation
export const roleSchema = z.object({
    id: z.number(),
    name: z.string(),
    min_deposit: z.number(),
    users_count: z.number().optional(),
});

// Role Edit/Add Dialog Component
function RoleDialog({ role, onUpdate, isEdit = false }: { role?: z.infer<typeof roleSchema>; onUpdate: () => void; isEdit?: boolean }) {
    const [open, setOpen] = React.useState(false);
    const [formData, setFormData] = React.useState({
        name: role?.name || '',
        min_deposit: role?.min_deposit.toString() || '0',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const data = {
            name: formData.name,
            min_deposit: parseFloat(formData.min_deposit),
        };

        if (isEdit && role) {
            router.patch(route('admin.roles.update', role.id), data, {
                onSuccess: () => {
                    toast.success('Role updated successfully');
                    setOpen(false);
                    onUpdate();
                },
                onError: (errors) => {
                    toast.error('Failed to update role');
                },
            });
        } else {
            router.post(route('admin.roles.store'), data, {
                onSuccess: () => {
                    toast.success('Role created successfully');
                    setOpen(false);
                    setFormData({ name: '', min_deposit: '0' });
                    onUpdate();
                },
                onError: (errors) => {
                    toast.error('Failed to create role');
                },
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {isEdit ? (
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <IconEdit className="mr-2 h-4 w-4" />
                        Edit Role
                    </DropdownMenuItem>
                ) : (
                    <Button size="sm">
                        <IconPlus className="mr-2 h-4 w-4" />
                        Add Role
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{isEdit ? 'Edit Role' : 'Create New Role'}</DialogTitle>
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
                            <Label htmlFor="min_deposit" className="text-right">
                                Min Deposit
                            </Label>
                            <Input
                                id="min_deposit"
                                type="number"
                                value={formData.min_deposit}
                                onChange={(e) => setFormData({ ...formData, min_deposit: e.target.value })}
                                className="col-span-3"
                                min="0"
                                step="0.01"
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit">{isEdit ? 'Save Changes' : 'Create Role'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

const columns = (refreshData: () => void): ColumnDef<z.infer<typeof roleSchema>>[] => [
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
    },
    {
        accessorKey: 'min deposit',
        header: ({ column }) => (
            <div className="text-right">
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                    Min Deposit
                    <IconChevronDown className={`ml-2 h-4 w-4 ${column.getIsSorted() === 'desc' ? 'rotate-180' : ''}`} />
                </Button>
            </div>
        ),
        cell: ({ row }) => (
            <div className="text-right font-medium">{row.original.min_deposit.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</div>
        ),
    },
    {
        accessorKey: 'users count',
        header: () => <div className="text-center">Users</div>,
        cell: ({ row }) => <div className="text-center font-medium">{row.original.users_count || 0}</div>,
    },
    {
        id: 'actions',
        cell: ({ row }) => {
            const role = row.original;

            const handleDelete = () => {
                if (confirm('Are you sure you want to delete this role?')) {
                    router.delete(route('admin.roles.destroy', role.id), {
                        onSuccess: () => {
                            toast.success('Role deleted successfully');
                            refreshData();
                        },
                        onError: () => {
                            toast.error('Failed to delete role');
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
                        <RoleDialog role={role} onUpdate={refreshData} isEdit={true} />
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                            <IconTrash className="mr-2 h-4 w-4" />
                            Delete Role
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
    },
];

export function RolesDataTable({ data, filters }: { data: any; filters: any }) {
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = React.useState({});
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [search, setSearch] = React.useState(filters.search || '');

    // Debounced search
    React.useEffect(() => {
        const timeoutId = setTimeout(() => {
            router.get(
                route('admin.roles.index'),
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
                route('admin.roles.index'),
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
        columns: columns(refreshData),
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
                <h2 className="text-2xl font-bold tracking-tight">Roles</h2>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <IconSearch className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search roles..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-64 pl-8" />
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
                                            {column.id}
                                        </DropdownMenuCheckboxItem>
                                    );
                                })}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <RoleDialog onUpdate={refreshData} />
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
                                    <TableCell colSpan={columns(refreshData).length} className="h-24 text-center">
                                        No roles found.
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
