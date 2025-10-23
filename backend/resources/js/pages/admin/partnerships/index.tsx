import * as React from "react"
import { Head, usePage, router } from '@inertiajs/react'
import {
  IconSearch,
  IconFilter,
  IconEye,
  IconTrash,
  IconDownload,
  IconCalendar,
  IconUser,
  IconCoins,
  IconClock,
  IconChevronDown,
  IconFileText,
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
import { BreadcrumbItem, User } from '@/types'

interface PartnershipApplication {
  id: number
  user: User,
  processing_experience: string
  deposit_amount: number
  about_yourself: string
  status: 'pending' | 'under_review' | 'approved' | 'rejected'
  status_label: string
  status_color: string
  admin_notes: string | null
  reviewed_at: string | null
  reviewer: {
    id: number
    name: string
  } | null
  created_at: string
}

interface PageProps {
  applications: {
    data: PartnershipApplication[]
    current_page: number
    last_page: number
    next_page_url: string | null
    prev_page_url: string | null
    total: number
  }
  stats: {
    total: number
    pending: number
    under_review: number
    approved: number
    rejected: number
  }
  filters: {
    search?: string
    status?: string
    date_from?: string
    date_to?: string
  }
}

// Delete Confirmation Dialog
function DeleteDialog({ 
  application, 
  open, 
  onOpenChange 
}: { 
  application: PartnershipApplication | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const handleDelete = () => {
    if (!application) return
    
    router.delete(route('admin.partnerships.destroy', application.id), {
      onSuccess: () => {
        toast.success('Application deleted')
        onOpenChange(false)
      },
      onError: () => {
        toast.error('An error occurred')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Application</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the application of {application?.user.name || application?.user.email}?
            <br />
            <br />
            After this action, the user will be able to submit a new application.
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
    title: 'Partnership Applications',
    href: '/admin/partnerships',
  },
]

export default function AdminPartnershipIndex() {
  const { applications, stats, filters } = usePage<PageProps>().props
  
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [search, setSearch] = React.useState(filters.search || "")
  const [statusFilter, setStatusFilter] = React.useState(filters.status || "all")
  const [dateFrom, setDateFrom] = React.useState(filters.date_from || "")
  const [dateTo, setDateTo] = React.useState(filters.date_to || "")
  const [selectedRows, setSelectedRows] = React.useState<number[]>([])
  const [deleteDialog, setDeleteDialog] = React.useState<{ 
    open: boolean
    application: PartnershipApplication | null 
  }>({
    open: false,
    application: null
  })

  const handleBulkDelete = () => {
    if (selectedRows.length === 0) return

    if (confirm(`Are you sure you want to delete ${selectedRows.length} applications?`)) {
      router.post(route('admin.partnerships.bulkDelete'), {
        ids: selectedRows
      }, {
        onSuccess: () => {
          toast.success(`${selectedRows.length} applications deleted`)
          setSelectedRows([])
        },
        onError: () => {
          toast.error('An error occurred')
        }
      })
    }
  }

  const handleExport = () => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (statusFilter !== 'all') params.set('status', statusFilter)
    if (dateFrom) params.set('date_from', dateFrom)
    if (dateTo) params.set('date_to', dateTo)
    
    window.open(`${route('admin.partnerships.export')}?${params.toString()}`, '_blank')
  }

  const columns: ColumnDef<PartnershipApplication>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => {
            table.toggleAllPageRowsSelected(!!value)
            if (value) {
              setSelectedRows(applications.data.map(a => a.id))
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
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => <span className="font-mono text-sm">#{row.original.id}</span>,
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          <IconCalendar className="mr-2 h-4 w-4" />
          Date
          <IconChevronDown
            className={`ml-2 h-4 w-4 ${
              column.getIsSorted() === "desc" ? "rotate-180" : ""
            }`}
          />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-sm">
          <div>{format(new Date(row.original.created_at), "dd MMM yyyy")}</div>
          <div className="text-muted-foreground">{format(new Date(row.original.created_at), "HH:mm")}</div>
        </div>
      ),
    },
    {
      accessorKey: "user",
      header: "User",
      cell: ({ row }) => {
        const user = row.original.user
        return (
          <div className="flex items-center gap-2 min-w-0">
            {user.avatar ? (
              <img
                src={user.avatar_url || undefined}
                alt={user.name || user.email}
                className="h-8 w-8 rounded-full flex-shrink-0"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted flex-shrink-0 text-xs">
                {user.name 
                  ? user.name.charAt(0).toUpperCase() 
                  : user.email.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="font-medium text-sm truncate">{user.name || "No name"}</div>
              <div className="text-xs text-muted-foreground truncate">{user.email}</div>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "deposit_amount",
      header: ({ column }) => (
        <div className="text-right">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <IconCoins className="mr-2 h-4 w-4" />
            Deposit
            <IconChevronDown
              className={`ml-2 h-4 w-4 ${
                column.getIsSorted() === "desc" ? "rotate-180" : ""
              }`}
            />
          </Button>
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-right font-medium text-sm">
          ${row.original.deposit_amount.toLocaleString()}
        </div>
      ),
    },
    {
      accessorKey: "processing_experience",
      header: "Experience",
      cell: ({ row }) => (
        <div className="max-w-xs">
          <p className="text-sm line-clamp-2 text-muted-foreground">
            {row.original.processing_experience}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const app = row.original
        const colors = {
          pending: "text-yellow-600 bg-yellow-50 border-yellow-200",
          under_review: "text-blue-600 bg-blue-50 border-blue-200",
          approved: "text-green-600 bg-green-50 border-green-200",
          rejected: "text-red-600 bg-red-50 border-red-200",
        }

        return (
          <Badge 
            variant="outline" 
            className={colors[app.status as keyof typeof colors]}
          >
            {app.status_label}
          </Badge>
        )
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const application = row.original

        return (
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.visit(route('admin.partnerships.show', application.id))}
            >
              <IconEye className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteDialog({ open: true, application })}
            >
              <IconTrash className="h-4 w-4 text-red-600" />
            </Button>
          </div>
        )
      },
    },
  ]

  const table = useReactTable({
    data: applications.data || [],
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
    pageCount: applications.last_page || 1,
  })

  // Handle filters with debounce
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      const params: Record<string, string> = {}
      if (search) params.search = search
      if (statusFilter !== 'all') params.status = statusFilter
      if (dateFrom) params.date_from = dateFrom
      if (dateTo) params.date_to = dateTo
      
      router.get(route('admin.partnerships.index'), params, {
        preserveState: true,
        preserveScroll: true,
      })
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [search, statusFilter, dateFrom, dateTo])

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Admin - Partnership Applications" />
      
      <div className="flex h-full flex-1 flex-col gap-6 p-4">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <IconFileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <IconClock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Under Review</CardTitle>
              <IconEye className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.under_review}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <IconUser className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <IconTrash className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            </CardContent>
          </Card>
        </div>

        {/* Applications Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Partnership Applications</CardTitle>
              <Button onClick={handleExport} variant="outline">
                <IconDownload className="h-4 w-4 mr-2" />
                Download CSV
              </Button>
            </div>
            
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative">
                <IconSearch className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
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
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>

              <Input
                type="date"
                placeholder="From"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-40"
              />

              <Input
                type="date"
                placeholder="To"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-40"
              />

              {selectedRows.length > 0 && (
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={handleBulkDelete}
                >
                  <IconTrash className="h-4 w-4 mr-2" />
                  Delete ({selectedRows.length})
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
                        No applications found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-4">
              <div className="text-sm text-muted-foreground">
                Page {applications.current_page} of {applications.last_page}
                ({applications.total} applications)
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (applications.prev_page_url) {
                      router.visit(applications.prev_page_url, {
                        preserveState: true,
                        preserveScroll: true,
                      })
                    }
                  }}
                  disabled={!applications.prev_page_url}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (applications.next_page_url) {
                      router.visit(applications.next_page_url, {
                        preserveState: true,
                        preserveScroll: true,
                      })
                    }
                  }}
                  disabled={!applications.next_page_url}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <DeleteDialog 
        application={deleteDialog.application}
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, application: null })}
      />
    </AppLayout>
  )
}