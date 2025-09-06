import * as React from "react"
import { Head, usePage, router } from '@inertiajs/react'
import {
  IconArrowDown,
  IconArrowUp,
  IconArrowLeft,
  IconCalendar,
  IconCoins,
  IconCreditCard,
  IconUser,
  IconHash,
  IconFileText,
  IconClock,
  IconCheck,
  IconX,
} from "@tabler/icons-react"
import { format } from "date-fns"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import AppLayout from '@/layouts/app-layout'
import { BreadcrumbItem } from '@/types'

interface Transaction {
  id: number
  type: 'deposit' | 'withdrawal' | 'access_purchase' | 'admin_adjustment'
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
  payable?: {
    type: string
    id: number
    created_at: string
  }
}

interface PageProps {
  transaction: Transaction
}

// Transaction status badge with icon
function TransactionStatusBadge({ status }: { status: string }) {
  const statusConfig = {
    pending: {
      variant: "outline" as const,
      icon: IconClock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      label: "Pending"
    },
    completed: {
      variant: "default" as const,
      icon: IconCheck,
      color: "text-green-600",
      bgColor: "bg-green-50",
      label: "Completed"
    },
    rejected: {
      variant: "destructive" as const,
      icon: IconX,
      color: "text-red-600",
      bgColor: "bg-red-50",
      label: "Rejected"
    }
  }

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
  const Icon = config.icon

  return (
    <Badge variant={config.variant} className="flex items-center gap-2">
      <Icon className="h-4 w-4" />
      {config.label}
    </Badge>
  )
}

// Transaction type badge with icon and color
function TransactionTypeBadge({ type }: { type: string }) {
  const typeConfig = {
    deposit: {
      icon: IconArrowDown,
      label: "Deposit",
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    withdrawal: {
      icon: IconArrowUp,
      label: "Withdrawal", 
      color: "text-red-600",
      bgColor: "bg-red-50"
    },
    access_purchase: {
      icon: IconCreditCard,
      label: "Access Purchase",
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    admin_adjustment: {
      icon: IconCoins,
      label: "Admin Adjustment",
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    }
  }

  const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.deposit
  const Icon = config.icon

  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-md ${config.bgColor}`}>
      <Icon className={`h-5 w-5 ${config.color}`} />
      <span className={`font-medium ${config.color}`}>{config.label}</span>
    </div>
  )
}

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Dashboard',
    href: '/',
  },
  {
    title: 'Transactions',
    href: '/transactions',
  },
  {
    title: 'Details',
    href: '#',
  },
]

export default function TransactionShow() {
  const { transaction } = usePage<PageProps>().props
  
  const isPositive = transaction.type === "deposit" || 
    (transaction.type === "admin_adjustment" && transaction.amount > 0)

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`Transaction #${transaction.id}`} />
      
      <div className="flex h-full flex-1 flex-col gap-6 p-4">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div>
            <Button
            variant="outline"
            size="sm"
            onClick={() => router.visit(route('admin.transactions.index'))}
          >
            <IconArrowLeft className="h-4 w-4 mr-2" />
            Back to Transactions
          </Button>
          </div>
          <div>
            <h1 className="text-2xl font-bold">Transaction Details</h1>
            <p className="text-muted-foreground">
              Transaction #{transaction.id}
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Main Transaction Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <IconCoins className="h-5 w-5" />
                  Transaction Information
                </CardTitle>
                <TransactionStatusBadge status={transaction.status} />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Transaction Type */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Type</label>
                <div className="mt-1">
                  <TransactionTypeBadge type={transaction.type} />
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Amount</label>
                <div className={`mt-1 text-3xl font-bold ${
                  isPositive ? "text-green-600" : "text-red-600"
                }`}>
                  {isPositive ? "+" : "-"}${Math.abs(transaction.amount).toLocaleString()}
                </div>
              </div>

              {/* Transaction ID */}
              {transaction.transaction_id && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <IconHash className="h-4 w-4" />
                    Transaction ID
                  </label>
                  <div className="mt-1 font-mono text-sm bg-muted p-2 rounded">
                    {transaction.transaction_id}
                  </div>
                </div>
              )}

              {/* Description */}
              {transaction.description && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <IconFileText className="h-4 w-4" />
                    Description
                  </label>
                  <div className="mt-1 text-sm bg-muted p-3 rounded">
                    {transaction.description}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline and Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconCalendar className="h-5 w-5" />
                Timeline & Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* User Information */}
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <IconUser className="h-4 w-4" />
                  User
                </label>
                <div className="mt-2 flex items-center gap-3">
                  {transaction.user.avatar ? (
                    <img
                      src={transaction.user.avatar}
                      alt={transaction.user.name || transaction.user.email}
                      className="h-10 w-10 rounded-full"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      {transaction.user.name 
                        ? transaction.user.name.charAt(0).toUpperCase() 
                        : transaction.user.email.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="font-medium">{transaction.user.name || "No name"}</div>
                    <div className="text-sm text-muted-foreground">{transaction.user.email}</div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Created Date */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Created At</label>
                <div className="mt-1 font-medium">
                  {format(new Date((transaction.payable?.created_at ?? transaction.created_at)), "EEEE, MMMM do, yyyy 'at' h:mm a")}
                </div>
                <div className="text-sm text-muted-foreground">
                  {format(new Date((transaction.payable?.created_at ?? transaction.created_at)), "EEEE")} ({format(new Date((transaction.payable?.created_at ?? transaction.created_at)), "yyyy-MM-dd HH:mm:ss")})
                </div>
              </div>

              {/* Paid Date */}
              {transaction.paid_at && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Processed At</label>
                  <div className="mt-1 font-medium">
                    {format(new Date(transaction.paid_at), "EEEE, MMMM do, yyyy 'at' h:mm a")}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(transaction.paid_at), "EEEE")} ({format(new Date(transaction.paid_at), "yyyy-MM-dd HH:mm:ss")})
                  </div>
                </div>
              )}

              {/* Processing Time */}
              {transaction.paid_at && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Processing Time</label>
                  <div className="mt-1 text-sm">
                    {(() => {
                    console.log(transaction.payable?.created_at);
                      const created = new Date((transaction.payable?.created_at ?? transaction.created_at))
                      const paid = new Date(transaction.paid_at)
                      const diffMs = paid.getTime() - created.getTime()
                      const diffMins = Math.floor(diffMs / (1000 * 60))
                      const diffHours = Math.floor(diffMins / 60)
                      const diffDays = Math.floor(diffHours / 24)

                      if (diffDays > 0) {
                        return `${diffDays} day${diffDays > 1 ? 's' : ''}, ${diffHours % 24} hour${(diffHours % 24) > 1 ? 's' : ''}`
                      } else if (diffHours > 0) {
                        return `${diffHours} hour${diffHours > 1 ? 's' : ''}, ${diffMins % 60} minute${(diffMins % 60) > 1 ? 's' : ''}`
                      } else {
                        return `${diffMins} minute${diffMins > 1 ? 's' : ''}`
                      }
                    })()}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status History (if needed) */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Transaction Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-full ${
                  transaction.status === 'completed' ? 'bg-green-100' :
                  transaction.status === 'rejected' ? 'bg-red-100' : 'bg-yellow-100'
                }`}>
                  {transaction.status === 'completed' ? (
                    <IconCheck className="h-6 w-6 text-green-600" />
                  ) : transaction.status === 'rejected' ? (
                    <IconX className="h-6 w-6 text-red-600" />
                  ) : (
                    <IconClock className="h-6 w-6 text-yellow-600" />
                  )}
                </div>
                <div>
                  <div className="font-medium capitalize">{transaction.status}</div>
                  <div className="text-sm text-muted-foreground">
                    {transaction.status === 'completed' && 'Transaction has been successfully processed'}
                    {transaction.status === 'rejected' && 'Transaction has been rejected'}
                    {transaction.status === 'pending' && 'Transaction is awaiting processing'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}