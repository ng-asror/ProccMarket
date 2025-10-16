import * as React from "react"
import { Head, usePage, router } from '@inertiajs/react'
import {
  IconPlus,
  IconSearch,
  IconFilter,
  IconEdit,
  IconTrash,
  IconEye,
  IconEyeOff,
  IconPhoto,
  IconCalendar,
  IconLink,
  IconChevronDown,
} from "@tabler/icons-react"
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table"
import { toast } from "sonner"
import { format } from "date-fns"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import AppLayout from '@/layouts/app-layout'
import { BreadcrumbItem } from '@/types'

interface Banner {
  id: number
  title: string
  description: string | null
  image: string
  image_url: string
  link: string | null
  is_active: boolean
  order: number
  starts_at: string | null
  ends_at: string | null
  created_at: string
}

interface BannerPageProps {
  banners: {
    data: Banner[]
    current_page: number
    last_page: number
    next_page_url: string | null
    prev_page_url: string | null
    total: number
  }
  stats: {
    total: number
    active: number
    inactive: number
    scheduled: number
  }
  filters: {
    search?: string
    status?: string
  }
}

// Delete Confirmation Dialog
function DeleteDialog({ 
  banner, 
  open, 
  onOpenChange 
}: { 
  banner: Banner | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const handleDelete = () => {
    if (!banner) return
    
    router.delete(route('admin.banners.destroy', banner.id), {
      onSuccess: () => {
        toast.success('Banner deleted successfully')
        onOpenChange(false)
      },
      onError: () => {
        toast.error('Failed to delete banner')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Banner</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{banner?.title}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Admin Dashboard',
    href: '/admin',
  },
  {
    title: 'Banners',
    href: '/admin/banners',
  },
]

export default function BannerIndex() {
  const { banners, stats, filters } = usePage<BannerPageProps>().props
  
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [search, setSearch] = React.useState(filters.search || "")
  const [statusFilter, setStatusFilter] = React.useState(filters.status || "all")
  const [selectedRows, setSelectedRows] = React.useState<number[]>([])
  const [deleteDialog, setDeleteDialog] = React.useState<{ open: boolean; banner: Banner | null }>({
    open: false,
    banner: null
  })

  const toggleBannerStatus = (banner: Banner) => {
    router.post(route('admin.banners.toggleStatus', banner.id), {}, {
      onSuccess: () => {
        toast.success(`Banner ${banner.is_active ? 'deactivated' : 'activated'} successfully`)
      },
      onError: () => {
        toast.error('Failed to update banner status')
      }
    })
  }

  const handleBulkDelete = () => {
    if (selectedRows.length === 0) return

    router.post(route('admin.banners.bulkDelete'), {
      ids: selectedRows
    }, {
      onSuccess: () => {
        toast.success(`${selectedRows.length} banners deleted successfully`)
        setSelectedRows([])
      },
      onError: () => {
        toast.error('Failed to delete banners')
      }
    })
  }

  const columns: ColumnDef<Banner>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => {
            table.toggleAllPageRowsSelected(!!value)
            if (value) {
              setSelectedRows(banners.data.map(b => b.id))
            } else {
              setSelectedRows([])
            }
          }}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={selectedRows.includes(row.original.id)}
          onCheckedChange={(value) => {
            if (value) {
              setSelectedRows([...selectedRows, row.original.id])
            } else {
              setSelectedRows(selectedRows.filter(id => id !== row.original.id))
            }
          }}
        />
      ),
    },
    {
      accessorKey: "image",
      header: "Image",
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <img
            src={row.original.image_url}
            alt={row.original.title}
            className="h-16 w-24 object-cover rounded-md border"
          />
        </div>
      ),
    },
    {
      accessorKey: "title",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Title
          <IconChevronDown
            className={`ml-2 h-4 w-4 ${
              column.getIsSorted() === "desc" ? "rotate-180" : ""
            }`}
          />
        </Button>
      ),
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.title}</div>
          {row.original.description && (
            <div className="text-sm text-muted-foreground line-clamp-2">
              {row.original.description}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: "link",
      header: "Link",
      cell: ({ row }) => (
        <div className="text-sm">
          {row.original.link ? (
            <a 
              href={row.original.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline flex items-center gap-1"
            >
              <IconLink className="h-3 w-3" />
              <span className="max-w-[200px] truncate">{row.original.link}</span>
            </a>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "order",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Display Order
          <IconChevronDown
            className={`ml-2 h-4 w-4 ${
              column.getIsSorted() === "desc" ? "rotate-180" : ""
            }`}
          />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-center font-mono">{row.original.order}</div>
      ),
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => {
        const banner = row.original
        const isScheduled = banner.starts_at && new Date(banner.starts_at) > new Date()
        
        return (
          <Badge 
            variant="outline" 
            className={
              banner.is_active 
                ? isScheduled 
                  ? "text-blue-600" 
                  : "text-green-600"
                : "text-gray-600"
            }
          >
            {banner.is_active 
              ? isScheduled 
                ? "Scheduled" 
                : "Active"
              : "Inactive"}
          </Badge>
        )
      },
    },
    {
      accessorKey: "created_at",
      header: "Created",
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {format(new Date(row.original.created_at), "dd MMM yyyy")}
        </div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const banner = row.original
        

        return (
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleBannerStatus(banner)}
              title={banner.is_active ? "Deactivate" : "Activate"}
            >
              {banner.is_active ? (
                <IconEyeOff className="h-4 w-4" />
              ) : (
                <IconEye className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.visit(route('admin.banners.edit', banner.id))}
            >
              <IconEdit className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteDialog({ open: true, banner })}
            >
              <IconTrash className="h-4 w-4 text-red-600" />
            </Button>
          </div>
        )
      },
    },
  ]

  const table = useReactTable({
    data: banners.data || [],
    columns,
    state: {
      sorting,
      columnFilters,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination: true,
    pageCount: banners.last_page || 1,
  })

  // Handle filters with debounce
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      const params: Record<string, string> = {}
      if (search) params.search = search
      if (statusFilter !== 'all') params.status = statusFilter
      
      router.get(route('admin.banners.index'), params, {
        preserveState: true,
        preserveScroll: true,
      })
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [search, statusFilter])

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Admin - Banner Management" />
      
      <div className="flex h-full flex-1 flex-col gap-6 p-4">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Banners</CardTitle>
              <IconPhoto className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <IconEye className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inactive</CardTitle>
              <IconEyeOff className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{stats.inactive}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
              <IconCalendar className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.scheduled}</div>
            </CardContent>
          </Card>
        </div>

        {/* Banners Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Banner Management</CardTitle>
              <Button onClick={() => router.visit(route('admin.banners.create'))}>
                <IconPlus className="h-4 w-4 mr-2" />
                Add Banner
              </Button>
            </div>
            
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative">
                <IconSearch className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search banners..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <IconFilter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>

              {selectedRows.length > 0 && (
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={handleBulkDelete}
                >
                  <IconTrash className="h-4 w-4 mr-2" />
                  Delete Selected ({selectedRows.length})
                </Button>
              )}
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader className="bg-muted">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="h-24 text-center">
                        No banners found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-4">
              <div className="text-sm text-muted-foreground">
                Page {banners.current_page} of {banners.last_page} 
                ({banners.total} total banners)
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (banners.prev_page_url) {
                      router.visit(banners.prev_page_url, {
                        preserveState: true,
                        preserveScroll: true,
                      })
                    }
                  }}
                  disabled={!banners.prev_page_url}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (banners.next_page_url) {
                      router.visit(banners.next_page_url, {
                        preserveState: true,
                        preserveScroll: true,
                      })
                    }
                  }}
                  disabled={!banners.next_page_url}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <DeleteDialog 
        banner={deleteDialog.banner}
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, banner: null })}
      />
    </AppLayout>
  )
}