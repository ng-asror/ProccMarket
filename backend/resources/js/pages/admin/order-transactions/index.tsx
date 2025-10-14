import * as React from "react"
import { Head, usePage, router } from '@inertiajs/react'
import {
  IconAlertTriangle,
  IconCalendar,
  IconChevronDown,
  IconClock,
  IconCoins,
  IconEye,
  IconFilter,
  IconRefresh,
  IconSearch,
  IconShoppingCart,
  IconTrendingUp,
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
import { format } from "date-fns"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import AppLayout from '@/layouts/app-layout'
import { BreadcrumbItem } from '@/types'

interface User {
  id: number
  name: string | null
  email: string
  avatar: string | null
}

interface OrderTransaction {
  id: number
  conversation_id: number
  title: string
  description: string
  amount: number
  deadline: string | null
  status: string
  status_color: string
  created_at: string
  accepted_at: string | null
  completed_at: string | null
  delivered_at: string | null
  cancelled_at: string | null
  released_at: string | null
  dispute_raised_at: string | null
  revision_count: number
  revision_reason: string | null
  has_revisions: boolean
  creator: User
  executor: User
  client: User
  freelancer: User
  cancelled_by: User | null
  dispute_raised_by: User | null
  cancellation_reason: string | null
  dispute_reason: string | null
}

interface PageProps {
  transactions: OrderTransaction[]
  pagination: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
  filters: {
    status: string
    disputes_only: boolean
    has_revisions: boolean
    search: string
  }
  statuses: {
    pending: string
    accepted: string
    in_progress: string
    delivered: string
    completed: string
    dispute: string
    cancelled: string
    refunded: string
    released: string
    cancellation_requested: string
  }
  stats: {
    total: number
    active: number
    disputes: number
    completed: number
    with_revisions: number
    total_volume: number
  }
}

const getStatusVariant = (color: string) => {
  const variants: Record<string, "outline" | "default"> = {
    yellow: "outline",
    blue: "outline",
    purple: "outline",
    green: "outline",
    orange: "outline",
    red: "outline",
    gray: "outline",
  }
  return variants[color] || "outline"
}

const getStatusColorClass = (color: string) => {
  const colors: Record<string, string> = {
    yellow: "text-yellow-600",
    blue: "text-blue-600",
    purple: "text-purple-600",
    green: "text-green-600",
    orange: "text-orange-600",
    red: "text-red-600",
    gray: "text-gray-600",
  }
  return colors[color] || "text-gray-600"
}

const adminColumns: ColumnDef<OrderTransaction>[] = [
  {
    accessorKey: "id",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        ID
        <IconChevronDown
          className={`ml-2 h-4 w-4 ${
            column.getIsSorted() === "desc" ? "rotate-180" : ""
          }`}
        />
      </Button>
    ),
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
        Created
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
    accessorKey: "title",
    header: "Order Title",
    cell: ({ row }) => (
      <div className="max-w-xs">
        <div className="font-medium text-sm truncate">{row.original.title}</div>
        <div className="text-xs text-muted-foreground truncate">
          {row.original.description.substring(0, 50)}...
        </div>
      </div>
    ),
  },
  {
    accessorKey: "client",
    header: "Client",
    cell: ({ row }) => {
      const user = row.original.client;

      if (!user) {
        return (
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-500 flex-shrink-0 text-xs font-semibold">
              ?
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm truncate">Unknown</div>
              <div className="text-xs text-muted-foreground truncate">No email</div>
            </div>
          </div>
        );
      }

      return (
        <div className="flex items-center gap-2 min-w-0">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name || user.email}
              className="h-7 w-7 rounded-full flex-shrink-0"
            />
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-blue-700 flex-shrink-0 text-xs font-semibold">
              {user.name
                ? user.name.charAt(0).toUpperCase()
                : user.email?.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="text-sm truncate">{user.name || "No name"}</div>
            <div className="text-xs text-muted-foreground truncate">{user.email}</div>
          </div>
        </div>
      );
    }
  },
  {
    accessorKey: "freelancer",
    header: "Freelancer",
    cell: ({ row }) => {
      const user = row.original.freelancer

      if (!user) {
        return (
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-500 flex-shrink-0 text-xs font-semibold">
              ?
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm truncate">Unknown</div>
              <div className="text-xs text-muted-foreground truncate">No email</div>
            </div>
          </div>
        );
      }
      
      return (
        <div className="flex items-center gap-2 min-w-0">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name || user.email}
              className="h-7 w-7 rounded-full flex-shrink-0"
            />
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-green-100 text-green-700 flex-shrink-0 text-xs font-semibold">
              {user.name
                ? user.name.charAt(0).toUpperCase()
                : user.email?.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="text-sm truncate">{user.name || "No name"}</div>
            <div className="text-xs text-muted-foreground truncate">{user.email}</div>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "amount",
    header: ({ column }) => (
      <div className="text-right">
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Amount
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
        ${row.original.amount.toLocaleString()}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const transaction = row.original
      return (
        <div className="flex flex-col gap-1">
          <Badge variant={getStatusVariant(transaction.status_color)} className="text-xs w-fit">
            <span className={getStatusColorClass(transaction.status_color)}>
              {transaction.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </span>
          </Badge>
          {transaction.has_revisions && transaction.revision_count > 0 && (
            <Badge variant="outline" className="text-xs w-fit bg-cyan-50 text-cyan-700 border-cyan-300">
              <IconRefresh className="h-3 w-3 mr-1" />
              {transaction.revision_count}x
            </Badge>
          )}
        </div>
      )
    },
  },
  {
    id: "flags",
    header: "",
    cell: ({ row }) => {
      const transaction = row.original
      return (
        <div className="flex items-center gap-1">
          {transaction.status === 'dispute' && (
            <div className="flex items-center text-orange-600" title="In Dispute">
              <IconAlertTriangle className="h-4 w-4" />
            </div>
          )}
          {transaction.status === 'cancellation_requested' && (
            <div className="flex items-center text-yellow-600" title="Cancellation Requested">
              <IconClock className="h-4 w-4" />
            </div>
          )}
        </div>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const transaction = row.original

      return (
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.visit(route('admin.order-transactions.show', transaction.id))}
        >
          <IconEye className="h-4 w-4 mr-2" />
          View
        </Button>
      )
    },
  },
]

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Admin Dashboard',
    href: '/dashboard',
  },
  {
    title: 'Order Transactions',
    href: '/order-transactions',
  },
]

export default function AdminOrderTransactionIndex() {
  const { transactions, pagination, filters, statuses, stats } = usePage<PageProps>().props  

  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [search, setSearch] = React.useState(filters.search || "")
  const [statusFilter, setStatusFilter] = React.useState(filters.status || "all")
  const [disputesOnly, setDisputesOnly] = React.useState(filters.disputes_only || false)
  const [hasRevisions, setHasRevisions] = React.useState(filters.has_revisions || false)

  const table = useReactTable({
    data: Array.isArray(transactions) ? transactions : [],
    columns: adminColumns,
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
    pageCount: pagination.last_page || 1,
  })

  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      const params: Record<string, string | boolean> = {}
      if (search) params.search = search
      if (statusFilter !== 'all') params.status = statusFilter
      if (disputesOnly) params.disputes_only = true
      if (hasRevisions) params.has_revisions = true

      router.get(route('admin.order-transactions.index'), params, {
        preserveState: true,
        preserveScroll: true,
      })
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [search, statusFilter, disputesOnly, hasRevisions])

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Admin - Order Transactions" />

      <div className="flex h-full flex-1 flex-col gap-6 p-4">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <IconShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">All time orders</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
              <IconClock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.active}</div>
              <p className="text-xs text-muted-foreground">In progress</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Disputes</CardTitle>
              <IconAlertTriangle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.disputes}</div>
              <p className="text-xs text-muted-foreground">Need attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">With Revisions</CardTitle>
              <IconRefresh className="h-4 w-4 text-cyan-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-cyan-600">{stats.with_revisions}</div>
              <p className="text-xs text-muted-foreground">Had changes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
              <IconTrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ${stats.total_volume.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Completed orders</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>All Order Transactions</CardTitle>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative">
                <IconSearch className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by title or user..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <IconFilter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value={statuses.pending}>Pending</SelectItem>
                  <SelectItem value={statuses.accepted}>Accepted</SelectItem>
                  <SelectItem value={statuses.in_progress}>In Progress</SelectItem>
                  <SelectItem value={statuses.delivered}>Delivered</SelectItem>
                  <SelectItem value={statuses.completed}>Completed</SelectItem>
                  <SelectItem value={statuses.dispute}>Dispute</SelectItem>
                  <SelectItem value={statuses.cancellation_requested}>Cancel Requested</SelectItem>
                  <SelectItem value={statuses.cancelled}>Cancelled</SelectItem>
                  <SelectItem value={statuses.refunded}>Refunded</SelectItem>
                  <SelectItem value={statuses.released}>Released</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant={disputesOnly ? "default" : "outline"}
                onClick={() => setDisputesOnly(!disputesOnly)}
              >
                <IconAlertTriangle className="h-4 w-4 mr-2" />
                Disputes Only
              </Button>

              <Button
                variant={hasRevisions ? "default" : "outline"}
                onClick={() => setHasRevisions(!hasRevisions)}
              >
                <IconRefresh className="h-4 w-4 mr-2" />
                With Revisions
              </Button>
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
                    table.getRowModel().rows.map((row) => {
                      const transaction = row.original
                      const isDispute = transaction.status === 'dispute'
                      const isCancellationRequested = transaction.status === 'cancellation_requested'

                      return (
                        <TableRow
                          key={row.id}
                          className={`${
                            isDispute
                              ? "border-l-4 border-l-orange-500 bg-orange-50/30"
                              : isCancellationRequested
                              ? "border-l-4 border-l-yellow-500 bg-yellow-50/30"
                              : "hover:bg-muted/50"
                          }`}
                        >
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id}>
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      )
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={adminColumns.length} className="h-24 text-center">
                        No order transactions found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-4">
              <div className="text-sm text-muted-foreground">
                Page {pagination.current_page} of {pagination.last_page}
                ({pagination.total} total orders)
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (pagination.current_page > 1) {
                      const params: Record<string, string | boolean> = { page: String(pagination.current_page - 1) }
                      if (search) params.search = search
                      if (statusFilter !== 'all') params.status = statusFilter
                      if (disputesOnly) params.disputes_only = true
                      if (hasRevisions) params.has_revisions = true

                      router.visit(route('admin.order-transactions.index', params), {
                        preserveState: true,
                        preserveScroll: true,
                      })
                    }
                  }}
                  disabled={pagination.current_page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (pagination.current_page < pagination.last_page) {
                      const params: Record<string, string | boolean> = { page: String(pagination.current_page + 1) }
                      if (search) params.search = search
                      if (statusFilter !== 'all') params.status = statusFilter
                      if (disputesOnly) params.disputes_only = true
                      if (hasRevisions) params.has_revisions = true

                      router.visit(route('admin.order-transactions.index', params), {
                        preserveState: true,
                        preserveScroll: true,
                      })
                    }
                  }}
                  disabled={pagination.current_page === pagination.last_page}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}