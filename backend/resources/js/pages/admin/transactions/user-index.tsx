import * as React from "react"
import { Head, usePage, router } from '@inertiajs/react'
import {
  IconArrowDown,
  IconArrowUp,
  IconCalendar,
  IconChevronDown,
  IconCoins,
  IconCreditCard,
  IconFilter,
  IconSearch,
  IconUser,
  IconEye,
  IconShieldDollar,
  IconBrandCashapp,
  IconRecycle,
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
import { esc } from "node_modules/zod/v4/core/util.cjs"

// Transaction type definition
interface Transaction {
  id: number
  type: 'deposit' | 'withdrawal' | 'access_purchase' | 'admin_adjustment' | 'earning' | 'refund' | 'escrow'
  amount: number
  status: 'pending' | 'completed' | 'rejected'
  transaction_id: string | null
  description: string | null
  created_at: string
  paid_at: string | null
}

interface TransactionStats {
  totalDeposits: number
  totalWithdrawals: number
  pendingAmount: number
}

interface PageProps {
  transactions: {
    data: Transaction[]
    current_page: number
    last_page: number
    next_page_url: string | null
    prev_page_url: string | null
    total: number
  }
  stats: TransactionStats
  user: {
    id: number
    name: string | null
    email: string
    balance: number
    avatar: string | null
  }
  filters: {
    search?: string
    type?: string
    status?: string
  }
}

// Transaction status badge component
function TransactionStatusBadge({ status }: { status: string }) {
  const variants = {
    pending: "outline",
    completed: "outline",
    rejected: "destructive",
  } as const

  const colors = {
    pending: "text-yellow-600",
    completed: "text-green-600", 
    rejected: "text-red-600",
  } as const

  return (
    <Badge variant={variants[status as keyof typeof variants] || "outline"}>
      <span className={colors[status as keyof typeof colors] || "text-gray-600"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    </Badge>
  )
}

// Transaction type badge component
function TransactionTypeBadge({ type }: { type: string }) {
  const typeLabels = {
    deposit: "Deposit",
    withdrawal: "Withdrawal", 
    access_purchase: "Access Purchase",
    escrow: "Escrow",
    earning: "Earning",
    refund: "Refund",
    admin_adjustment: "Admin Adjustment"
  }

  const typeIcons = {
    deposit: IconArrowDown,
    withdrawal: IconArrowUp,
    access_purchase: IconCreditCard,
    admin_adjustment: IconCoins,
    escrow: IconShieldDollar,
    earning: IconBrandCashapp,
    refund: IconRecycle,
  }

  const Icon = typeIcons[type as keyof typeof typeIcons] || IconCoins

  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4" />
      {typeLabels[type as keyof typeof typeLabels] || type}
    </div>
  )
}

// Define table columns
const columns: ColumnDef<Transaction>[] = [
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
    cell: ({ row }) => {
      return format(new Date(row.original.created_at), "dd MMM yyyy, HH:mm")
    },
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => <TransactionTypeBadge type={row.original.type} />,
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
      const isPositive = transaction.type === "deposit" || 
        ((transaction.type === "admin_adjustment" || transaction.type === "earning" || transaction.type === "refund") && transaction.amount > 0)
      
      return (
        <div className={`text-right font-medium ${
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
    cell: ({ row }) => <TransactionStatusBadge status={row.original.status} />,
  },
  {
    accessorKey: "transaction_id",
    header: "Transaction ID",
    cell: ({ row }) => {
      const id = row.original.transaction_id
      return (
        <div className="font-mono text-sm">
          {id ? id.substring(0, 12) + "..." : "—"}
        </div>
      )
    },
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => {
      const description = row.original.description
      return (
        <div className="max-w-[200px] truncate">
          {description || "—"}
        </div>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      return (
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => router.visit(route('admin.transactions.show', row.original.id))}
        >
          <IconEye className="h-4 w-4" />
        </Button>
      )
    },
  },
]

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Dashboard',
    href: '/',
  },
  {
    title: 'Transaction History',
    href: '/transactions',
  },
]

export default function TransactionIndex() {
  const { transactions, stats, user, filters } = usePage<PageProps>().props
  
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [search, setSearch] = React.useState(filters.search || "")
  const [typeFilter, setTypeFilter] = React.useState(filters.type || "all")
  const [statusFilter, setStatusFilter] = React.useState(filters.status || "all")

  const table = useReactTable({
    data: transactions.data || [],
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
    pageCount: transactions.last_page || 1,
  })

  // Handle search and filters with debounce
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      const params: Record<string, string> = {}
      if (search) params.search = search
      if (typeFilter !== 'all') params.type = typeFilter
      if (statusFilter !== 'all') params.status = statusFilter
      
      router.get(route('admin.transactions.user.show', user.id), params, {
        preserveState: true,
        preserveScroll: true,
      })
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [search, typeFilter, statusFilter])

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Transaction History" />
      
      <div className="flex h-full flex-1 flex-col gap-6 p-4">
        {/* User Info Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* User Info Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Account Balance</CardTitle>
              <IconUser className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${user.balance.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {user.name || user.email}
              </p>
            </CardContent>
          </Card>

          {/* Total Deposits Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Deposits</CardTitle>
              <IconArrowDown className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                +${stats.totalDeposits.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                All time deposits
              </p>
            </CardContent>
          </Card>

          {/* Total Withdrawals Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Withdrawals</CardTitle>
              <IconArrowUp className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                -${stats.totalWithdrawals.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                All time withdrawals
              </p>
            </CardContent>
          </Card>

          {/* Pending Amount Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <IconCoins className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                ${stats.pendingAmount.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Pending transactions
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Transaction History</CardTitle>
              <div className="flex items-center gap-2">
                {/* Search */}
                <div className="relative">
                  <IconSearch className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search transactions..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 w-64"
                  />
                </div>

                {/* Type Filter */}
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

                {/* Status Filter */}
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
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Transaction Table */}
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader className="bg-muted sticky top-0 z-10">
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
                              "border-l-4 border-l-blue-500" :
                            isPositive
                              ? "border-l-4 border-l-green-500"
                              : "border-l-4 border-l-red-500"
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
                      <TableCell colSpan={columns.length} className="h-24 text-center">
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