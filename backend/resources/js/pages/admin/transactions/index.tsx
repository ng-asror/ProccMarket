import * as React from "react"
import { Head, usePage, router } from '@inertiajs/react'
import {
  IconDownload,
  IconEye,
  IconFilter,
  IconSearch,
  IconCalendar,
  IconUser,
  IconCoins,
  IconClock,
  IconTrendingUp,
  IconEdit,
  IconChevronDown,
  IconArrowDown,
  IconArrowUp,
  IconCreditCard,
  IconCalculator,
  IconMoneybagPlus,
  IconRecycle,
  IconBrandCashapp,
  IconShieldDollar,
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
  DialogTrigger,
} from "@/components/ui/dialog"
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
import { Textarea } from "@/components/ui/textarea"
import AppLayout from '@/layouts/app-layout'
import { BreadcrumbItem } from '@/types'

interface Transaction {
  id: number
  type: 'deposit' | 'withdrawal' | 'access_purchase' | 'admin_adjustment' | 'earning' | 'refund' | 'escrow'
  amount: number
  status: 'pending' | 'completed' | 'rejected'
  transaction_id: string | null
  description: string | null
  created_at: string
  paid_at: string | null
  user: {
    id: number
    name: string | null
    email: string
    avatar: string | null
  }
}

interface AdminPageProps {
  transactions: {
    data: Transaction[]
    current_page: number
    last_page: number
    next_page_url: string | null
    prev_page_url: string | null
    total: number
  }
  stats: {
    totalDeposits: number
    totalWithdrawals: number
    pendingTransactions: number
    totalTransactions: number
    todayTransactions: number
  }
  filters: {
    search?: string
    user_id?: string
    type?: string
    status?: string
    date_from?: string
    date_to?: string
  }
}

// Transaction Status Update Dialog
function TransactionStatusDialog({ transaction, onUpdate }: {
  transaction: Transaction
  onUpdate: () => void
}) {
  const [open, setOpen] = React.useState(false)
  const [status, setStatus] = React.useState(transaction.status)
  const [description, setDescription] = React.useState(transaction.description || "")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    router.patch(route('admin.transactions.updateStatus', transaction.id), {
      status,
      description,
    }, {
      onSuccess: () => {
        toast.success("Transaction status updated successfully")
        setOpen(false)
        onUpdate()
      },
      onError: () => {
        toast.error("Failed to update transaction status")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <IconEdit className="h-4 w-4 mr-2" />
          Update
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Transaction Status</DialogTitle>
          <DialogDescription>
            Transaction #{transaction.id}
            <br />
            User: {transaction.user.name || transaction.user.email}
            <br />
            Amount: ${Math.abs(transaction.amount).toLocaleString()}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Status
              </Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Notes
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="col-span-3"
                placeholder="Optional description or notes..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Update Transaction</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Define admin table columns
const adminColumns = (refreshData: () => void): ColumnDef<Transaction>[] => [
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
        <div className="flex items-center gap-2 min-w-0 cursor-pointer" 
            onClick={() => router.visit(route('admin.transactions.user.show', user.id))}
        >
          {user.avatar ? (
            <img
              src={user.avatar}
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
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => {
      const type = row.original.type
      const typeConfig = {
        deposit: { label: "Deposit", icon: IconArrowDown, color: "text-green-600" },
        withdrawal: { label: "Withdrawal", icon: IconArrowUp, color: "text-red-600" },
        access_purchase: { label: "Purchase", icon: IconCreditCard, color: "text-blue-600" },
        escrow: { label: "Escrow", icon: IconShieldDollar, color: "text-blue-600" },
        earning: { label: "Earning", icon: IconBrandCashapp, color: "text-green-600" },
        refund: { label: "Refund", icon: IconRecycle, color: "text-red-600" },
        admin_adjustment: { label: "Adjustment", icon: IconCoins, color: "text-purple-600" }
      }
      
      const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.deposit
      const Icon = config.icon

      return (
        <div className="flex items-center gap-2 text-sm">
          <Icon className={`h-4 w-4 ${config.color}`} />
          <span className="hidden sm:inline">{config.label}</span>
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
    cell: ({ row }) => {
      const transaction = row.original
      const isPositive = (transaction.type === "deposit" || transaction.type === "earning" || transaction.type === "refund") ||
        (transaction.type === "admin_adjustment" && transaction.amount > 0)
      
      return (
        <div className={`text-right font-medium text-sm ${
          isPositive ? "text-green-600" : "text-red-600"
        }`}>
          {isPositive ? "+" : "-"}${Math.abs(transaction.amount).toLocaleString()}
        </div>
      )
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status
      const variants = {
        pending: "outline" as const,
        completed: "outline" as const,
        rejected: "outline" as const,
      }

      const colors = {
        pending: "text-yellow-600",
        completed: "text-green-600", 
        rejected: "text-red-600",
      }

      return (
        <Badge variant={variants[status]} className="text-xs">
          <span className={colors[status as keyof typeof colors]}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </Badge>
      )
    },
  },
  {
    accessorKey: "transaction_id",
    header: "TX ID",
    cell: ({ row }) => {
      const id = row.original.transaction_id
      return (
        <div className="font-mono text-xs text-muted-foreground">
          {id ? id.substring(0, 8) + "..." : "—"}
        </div>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const transaction = row.original

      return (
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.visit(route('admin.transactions.show', transaction.id))}
          >
            <IconEye className="h-4 w-4" />
          </Button>
          <TransactionStatusDialog transaction={transaction} onUpdate={refreshData} />
        </div>
      )
    },
  },
]

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Admin Dashboard',
    href: '/admin',
  },
  {
    title: 'Transactions',
    href: '/admin/transactions',
  },
]

export default function AdminTransactionIndex() {
  const { transactions, stats, filters } = usePage<AdminPageProps>().props
  
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [search, setSearch] = React.useState(filters.search || "")
  const [typeFilter, setTypeFilter] = React.useState(filters.type || "all")
  const [statusFilter, setStatusFilter] = React.useState(filters.status || "all")
  const [dateFrom, setDateFrom] = React.useState(filters.date_from || "")
  const [dateTo, setDateTo] = React.useState(filters.date_to || "")

  const refreshData = () => {
    router.reload()
  }

  const table = useReactTable({
    data: transactions.data || [],
    columns: adminColumns(refreshData),
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
    pageCount: transactions.last_page || 1,
  })

  // Handle filters with debounce
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      const params: Record<string, string> = {}
      if (search) params.search = search
      if (typeFilter !== 'all') params.type = typeFilter
      if (statusFilter !== 'all') params.status = statusFilter
      if (dateFrom) params.date_from = dateFrom
      if (dateTo) params.date_to = dateTo
      
      router.get(route('admin.transactions.index'), params, {
        preserveState: true,
        preserveScroll: true,
      })
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [search, typeFilter, statusFilter, dateFrom, dateTo])

  const handleExport = () => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (typeFilter !== 'all') params.set('type', typeFilter)
    if (statusFilter !== 'all') params.set('status', statusFilter)
    if (dateFrom) params.set('date_from', dateFrom)
    if (dateTo) params.set('date_to', dateTo)
    
    window.open(`${route('admin.transactions.export')}?${params.toString()}`, '_blank')
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Admin - Transaction Management" />
      
      <div className="flex h-full flex-1 flex-col gap-6 p-4">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Deposits</CardTitle>
              <IconTrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ${stats.totalDeposits.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Completed deposits
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Withdrawals</CardTitle>
              <IconTrendingUp className="h-4 w-4 text-red-600 rotate-180" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                ${stats.totalWithdrawals.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Completed withdrawals
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <IconClock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {stats.pendingTransactions}
              </div>
              <p className="text-xs text-muted-foreground">
                Awaiting review
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
              <IconCoins className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalTransactions.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                All time
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today</CardTitle>
              <IconCalendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.todayTransactions}
              </div>
              <p className="text-xs text-muted-foreground">
                New today
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>All Transactions</CardTitle>
              <Button onClick={handleExport} variant="outline">
                <IconDownload className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
            
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative">
                <IconSearch className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40">
                  <IconFilter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="deposit">Deposit</SelectItem>
                  <SelectItem value="withdrawal">Withdrawal</SelectItem>
                  <SelectItem value="access_purchase">Access Purchase</SelectItem>
                  <SelectItem value="admin_adjustment">Admin Adjustment</SelectItem>
                  <SelectItem value="escrow">Escrow</SelectItem>
                  <SelectItem value="earning">Earning</SelectItem>
                  <SelectItem value="refund">Refund</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>

              <Input
                type="date"
                placeholder="From date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-40"
              />

              <Input
                type="date"
                placeholder="To date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-40"
              />
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
                      const isPositive = (transaction.type === "deposit" || transaction.type === "earning" || transaction.type === "refund") || 
                        (transaction.type === "admin_adjustment" && transaction.amount > 0)
                      
                      return (
                        <TableRow
                          key={row.id}
                          className={`${
                            transaction.type === "escrow" ? 
                              "border-l-4 border-l-blue-500 hover:bg-green-50/30" :
                            isPositive
                              ? "border-l-4 border-l-green-500 hover:bg-green-50/30"
                              : "border-l-4 border-l-red-500 hover:bg-red-50/30"
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
                      <TableCell colSpan={adminColumns(refreshData).length} className="h-24 text-center">
                        No transactions found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-4">
              <div className="text-sm text-muted-foreground">
                Page {transactions.current_page} of {transactions.last_page} 
                ({transactions.total} total transactions)
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (transactions.prev_page_url) {
                      router.visit(transactions.prev_page_url, {
                        preserveState: true,
                        preserveScroll: true,
                      })
                    }
                  }}
                  disabled={!transactions.prev_page_url}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (transactions.next_page_url) {
                      router.visit(transactions.next_page_url, {
                        preserveState: true,
                        preserveScroll: true,
                      })
                    }
                  }}
                  disabled={!transactions.next_page_url}
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