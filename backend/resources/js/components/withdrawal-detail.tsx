import * as React from "react"
import {
  IconCheck,
  IconX,
  IconEye,
  IconDotsVertical,
  IconSearch,
  IconLayoutColumns,
  IconChevronDown,
  IconCoins,
  IconClock,
  IconCircleCheck,
  IconCircleX,
  IconDownload,
  IconCalendar,
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
  VisibilityState,
} from "@tanstack/react-table"
import { toast } from "sonner"
import { z } from "zod"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { router } from '@inertiajs/react'

// Schema for withdrawal data validation
export const withdrawalSchema = z.object({
  id: z.number(),
  user: z.object({
    id: z.number(),
    name: z.string().nullable(),
    email: z.string(),
    avatar: z.string().nullable(),
    avatar_url: z.string().nullable(),
  }),
  amount: z.number(),
  requisites: z.string(),
  status: z.enum(['pending', 'approved', 'rejected', 'cancelled']),
  reason: z.string().nullable(),
  created_at: z.string(),
  processed_at: z.string().nullable(),
})

// Withdrawal Detail Dialog Component
function WithdrawalDetailDialog({ withdrawal, onUpdate }: { 
  withdrawal: z.infer<typeof withdrawalSchema>, 
  onUpdate: () => void 
}) {
  const [open, setOpen] = React.useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <IconEye className="mr-2 h-4 w-4" />
          View Details
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Withdrawal Request #{withdrawal.id}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="font-semibold">User Information</Label>
              <div className="mt-2 space-y-1">
                <div className="flex items-center gap-2">
                  {withdrawal.user.avatar ? (
                    <img
                      src={withdrawal.user.avatar}
                      alt={withdrawal.user.name || withdrawal.user.email}
                      className="h-8 w-8 rounded-full"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                      {withdrawal.user.name ? withdrawal.user.name.charAt(0).toUpperCase() : withdrawal.user.email.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="font-medium">{withdrawal.user.name || "No name"}</div>
                    <div className="text-sm text-gray-500">{withdrawal.user.email}</div>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <Label className="font-semibold">Request Details</Label>
              <div className="mt-2 space-y-2">
                <div className="text-sm">
                  <span className="font-medium">Amount:</span> {withdrawal.amount.toLocaleString()}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Status:</span>{" "}
                  <Badge variant={
                    withdrawal.status === 'approved' ? 'default' :
                    withdrawal.status === 'rejected' ? 'destructive' :
                    withdrawal.status === 'cancelled' ? 'secondary' : 'outline'
                  }>
                    {withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}
                  </Badge>
                </div>
                <div className="text-sm">
                  <span className="font-medium">Created:</span> {new Date(withdrawal.created_at).toLocaleString()}
                </div>
                {withdrawal.processed_at && (
                  <div className="text-sm">
                    <span className="font-medium">Processed:</span> {new Date(withdrawal.processed_at).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div>
            <Label className="font-semibold">Withdrawal Requisites</Label>
            <div className="mt-2 p-3 bg-gray-50 rounded-md text-sm">
              {withdrawal.requisites}
            </div>
          </div>

          {withdrawal.reason && (
            <div>
              <Label className="font-semibold">
                {withdrawal.status === 'rejected' ? 'Rejection Reason' : 'Notes'}
              </Label>
              <div className="mt-2 p-3 bg-gray-50 rounded-md text-sm">
                {withdrawal.reason}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Approve Withdrawal Dialog Component
function ApproveWithdrawalDialog({ withdrawal, onUpdate }: { 
  withdrawal: z.infer<typeof withdrawalSchema>, 
  onUpdate: () => void 
}) {
  const [open, setOpen] = React.useState(false)
  const [formData, setFormData] = React.useState({
    transaction_id: "",
    notes: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    router.post(route('admin.withdrawals.approve', withdrawal.id), formData, {
      onSuccess: () => {
        toast.success("Withdrawal request approved successfully")
        setOpen(false)
        setFormData({ transaction_id: "", notes: "" })
        onUpdate()
      },
      onError: (errors) => {
        toast.error("Failed to approve withdrawal request")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <IconCheck className="mr-2 h-4 w-4" />
          Approve
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Approve Withdrawal Request</DialogTitle>
          <DialogDescription>
            Approve withdrawal of {withdrawal.amount.toLocaleString()} for {withdrawal.user.name || withdrawal.user.email}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="transaction_id" className="text-right">
                Transaction ID
              </Label>
              <Input
                id="transaction_id"
                value={formData.transaction_id}
                onChange={(e) => setFormData({ ...formData, transaction_id: e.target.value })}
                className="col-span-3"
                placeholder="External transaction ID (optional)"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                Notes
              </Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="col-span-3"
                placeholder="Additional notes (optional)"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" className="bg-green-600 hover:bg-green-700">
              Approve Withdrawal
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Reject Withdrawal Dialog Component
function RejectWithdrawalDialog({ withdrawal, onUpdate }: { 
  withdrawal: z.infer<typeof withdrawalSchema>, 
  onUpdate: () => void 
}) {
  const [open, setOpen] = React.useState(false)
  const [reason, setReason] = React.useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason.trim()) {
      toast.error("Rejection reason is required")
      return
    }

    router.post(route('admin.withdrawals.reject', withdrawal.id), { reason }, {
      onSuccess: () => {
        toast.success("Withdrawal request rejected and balance restored")
        setOpen(false)
        setReason("")
        onUpdate()
      },
      onError: (errors) => {
        toast.error("Failed to reject withdrawal request")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <IconX className="mr-2 h-4 w-4" />
          Reject
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject Withdrawal Request</DialogTitle>
          <DialogDescription>
            Reject withdrawal of {withdrawal.amount.toLocaleString()} for {withdrawal.user.name || withdrawal.user.email}.
            The balance will be automatically restored to the user's account.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="reason" className="text-right">
                Reason *
              </Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="col-span-3"
                placeholder="Enter the reason for rejection..."
                rows={3}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" variant="destructive">
              Reject Withdrawal
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

const columns = (refreshData: () => void): ColumnDef<z.infer<typeof withdrawalSchema>>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "id",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(undefined)}
      >
        ID
        {column.getIsSorted() && (
          <IconChevronDown
            className={`ml-2 h-4 w-4 ${column.getIsSorted() === "desc" ? "rotate-180" : ""}`}
          />
        )}
      </Button>
    ),
    cell: ({ row }) => (
      <div className="font-medium">#{row.original.id}</div>
    ),
  },
  {
    accessorKey: "user",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(undefined)}
      >
        User
        {column.getIsSorted() && (
          <IconChevronDown
            className={`ml-2 h-4 w-4 ${column.getIsSorted() === "desc" ? "rotate-180" : ""}`}
          />
        )}
      </Button>
    ),
    cell: ({ row }) => {
      const user = row.original.user
      return (
        <div className="flex items-center gap-3">
          {user.avatar ? (
            <img
              src={user.avatar_url || undefined}
              alt={user.name || user.email}
              className="h-10 w-10 rounded-full"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex flex-col">
            <span className="font-medium">{user.name || "No name"}</span>
            <span className="text-muted-foreground text-sm">{user.email}</span>
          </div>
        </div>
      )
    },
    enableHiding: false,
    sortingFn: (rowA, rowB) => {
      const nameA = rowA.original.user.name || rowA.original.user.email
      const nameB = rowB.original.user.name || rowB.original.user.email
      return nameA.localeCompare(nameB)
    },
  },
  {
    accessorKey: "amount",
    header: ({ column }) => (
      <div className="text-center">
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Amount
          <IconChevronDown
            className={`ml-2 h-4 w-4 ${column.getIsSorted() === "desc" ? "rotate-180" : ""}`}
          />
        </Button>
      </div>
    ),
    cell: ({ row }) => (
      <div className="text-center font-medium">
        {row.original.amount.toLocaleString()}
      </div>
    ),
  },
  {
    accessorKey: "requisites",
    header: "Requisites",
    cell: ({ row }) => {
      const requisites = row.original.requisites
      return (
        <div className="max-w-[200px] truncate" title={requisites}>
          {requisites.length > 50 ? `${requisites.substring(0, 50)}...` : requisites}
        </div>
      )
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Status
        <IconChevronDown
          className={`ml-2 h-4 w-4 ${column.getIsSorted() === "desc" ? "rotate-180" : ""}`}
        />
      </Button>
    ),
    cell: ({ row }) => {
      const status = row.original.status
      return (
        <Badge variant={
          status === 'approved' ? 'default' :
          status === 'rejected' ? 'destructive' :
          status === 'cancelled' ? 'secondary' : 'outline'
        }>
          {status === 'pending' && <IconClock className="mr-1 h-3 w-3" />}
          {status === 'approved' && <IconCircleCheck className="mr-1 h-3 w-3" />}
          {status === 'rejected' && <IconCircleX className="mr-1 h-3 w-3" />}
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      )
    },
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Created
        <IconChevronDown
          className={`ml-2 h-4 w-4 ${column.getIsSorted() === "desc" ? "rotate-180" : ""}`}
        />
      </Button>
    ),
    cell: ({ row }) => {
      const date = new Date(row.original.created_at)
      return (
        <div className="text-sm">
          <div>{date.toLocaleDateString()}</div>
          <div className="text-muted-foreground">{date.toLocaleTimeString()}</div>
        </div>
      )
    },
    sortingFn: (rowA, rowB) => {
      return new Date(rowA.original.created_at).getTime() - new Date(rowB.original.created_at).getTime()
    },
  },
  {
    accessorKey: "processed_at",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Processed
        <IconChevronDown
          className={`ml-2 h-4 w-4 ${column.getIsSorted() === "desc" ? "rotate-180" : ""}`}
        />
      </Button>
    ),
    cell: ({ row }) => {
      const processedAt = row.original.processed_at
      if (!processedAt) {
        return <span className="text-muted-foreground">-</span>
      }
      const date = new Date(processedAt)
      return (
        <div className="text-sm">
          <div>{date.toLocaleDateString()}</div>
          <div className="text-muted-foreground">{date.toLocaleTimeString()}</div>
        </div>
      )
    },
    sortingFn: (rowA, rowB) => {
      const dateA = rowA.original.processed_at ? new Date(rowA.original.processed_at).getTime() : 0
      const dateB = rowB.original.processed_at ? new Date(rowB.original.processed_at).getTime() : 0
      return dateA - dateB
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const withdrawal = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="data-[state=open]:bg-muted flex h-8 w-8 p-0"
              size="icon"
            >
              <IconDotsVertical className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <WithdrawalDetailDialog withdrawal={withdrawal} onUpdate={refreshData} />
            
            {withdrawal.status === 'pending' && (
              <>
                <DropdownMenuSeparator />
                <ApproveWithdrawalDialog withdrawal={withdrawal} onUpdate={refreshData} />
                <RejectWithdrawalDialog withdrawal={withdrawal} onUpdate={refreshData} />
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

export function WithdrawalsDataTable({ data, stats, filters }: {
  data: any,
  stats: any,
  filters: any
}) {
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [search, setSearch] = React.useState(filters.search || "")
  const [statusFilter, setStatusFilter] = React.useState(filters.status || "all")
  const [dateFrom, setDateFrom] = React.useState(filters.date_from || "")
  const [dateTo, setDateTo] = React.useState(filters.date_to || "")

  // Handle search and filter changes
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      router.get(route('admin.withdrawals.index'), { 
        search, 
        status: statusFilter,
        date_from: dateFrom,
        date_to: dateTo
      }, {
        preserveState: true,
        replace: true
      })
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [search, statusFilter, dateFrom, dateTo])

  const refreshData = () => {
    router.reload()
  }

  const handleExport = () => {
    const params = new URLSearchParams({
      search,
      status: statusFilter,
      date_from: dateFrom,
      date_to: dateTo
    }).toString()
    
    window.open(`${route('admin.withdrawals.export')}?${params}`, '_blank')
  }

  const tableData = React.useMemo(() => data.data || [], [data])
  const pageCount = data.last_page || 1
  const currentPage = data.current_page || 1

  const table = useReactTable({
    data: tableData,
    columns: columns(refreshData),
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    pageCount,
  })

  return (
    <div className="w-full space-y-6">
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Pending</h3>
            <IconClock className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">{stats.pendingCount}</div>
          <p className="text-xs text-muted-foreground">
            ${stats.totalPending.toLocaleString()} total
          </p>
        </div>
        
        <div className="rounded-lg border bg-card p-4">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Approved</h3>
            <IconCircleCheck className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">{stats.approvedCount}</div>
          <p className="text-xs text-muted-foreground">
            ${stats.totalApproved.toLocaleString()} total
          </p>
        </div>
        
        <div className="rounded-lg border bg-card p-4">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Rejected</h3>
            <IconCircleX className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">{stats.rejectedCount}</div>
          <p className="text-xs text-muted-foreground">
            ${stats.totalRejected.toLocaleString()} total
          </p>
        </div>
        
        <div className="rounded-lg border bg-card p-4">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Today</h3>
            <IconCalendar className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">{stats.todayRequests}</div>
          <p className="text-xs text-muted-foreground">New requests</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative">
            <IconSearch className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search withdrawals..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 w-64"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
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
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <IconDownload className="mr-2 h-4 w-4" />
            Export
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <IconLayoutColumns className="mr-2 h-4 w-4" />
                Columns
                <IconChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {table
                .getAllColumns()
                .filter(
                  (column) =>
                    typeof column.accessorFn !== "undefined" &&
                    column.getCanHide()
                )
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="bg-muted sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={
                    row.original.status === 'pending' ? 'hover:bg-yellow-100 dark:hover:bg-yellow-900' :
                    row.original.status === 'approved' ? 'hover:bg-green-100 dark:hover:bg-green-900' :
                    row.original.status === 'rejected' ? 'hover:bg-red-100 dark:hover:bg-red-900' :
                    ''
                  }
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns(refreshData).length}
                  className="h-24 text-center"
                >
                  No withdrawal requests found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4">
        <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>

        <div className="flex w-full items-center gap-8 lg:w-fit mt-2">
          <div className="flex w-fit items-center justify-center text-sm font-medium">
            Page {currentPage} of {pageCount}
          </div>

          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                router.get(
                  data.prev_page_url,
                  { 
                    search, 
                    status: statusFilter,
                    date_from: dateFrom,
                    date_to: dateTo
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
                    status: statusFilter,
                    date_from: dateFrom,
                    date_to: dateTo
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
  )
}