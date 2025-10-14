import * as React from "react"
import { Head, usePage, router } from '@inertiajs/react'
import {
  IconAlertTriangle,
  IconBan,
  IconCalendar,
  IconCheck,
  IconClock,
  IconFileText,
  IconRefresh,
  IconUser,
  IconX,
} from "@tabler/icons-react"
import { format } from "date-fns"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
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
  message_id: number | null
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
  revision_requested_at: string | null
  has_revisions: boolean
  creator: User
  executor: User
  client: User
  freelancer: User
  cancelled_by: User | null
  dispute_raised_by: User | null
  revision_requested_by: User | null
  cancellation_reason: string | null
  dispute_reason: string | null
  admin_note: string | null
}

interface PageProps {
  transaction: OrderTransaction
  flash?: {
    success?: string
    error?: string
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

function UserDisplay({ user, label, roleColor }: { user: User; label: string; roleColor?: string }) {
  return (
    <div>
      <Label className="text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-3 mt-2">
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={user.name || user.email}
            className="h-10 w-10 rounded-full"
          />
        ) : (
          <div className={`flex h-10 w-10 items-center justify-center rounded-full ${roleColor || 'bg-muted'}`}>
            <span className="font-semibold">
              {user.name
                ? user.name.charAt(0).toUpperCase()
                : user.email.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div>
          <div className="font-medium">{user.name || "No name"}</div>
          <div className="text-sm text-muted-foreground">{user.email}</div>
        </div>
      </div>
    </div>
  )
}

function ResolveDisputeDialog({ transaction }: { transaction: OrderTransaction }) {
  const [open, setOpen] = React.useState(false)
  const [resolution, setResolution] = React.useState<'refund' | 'release'>('refund')
  const [adminNote, setAdminNote] = React.useState('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    router.post(
      route('admin.order-transactions.resolve-dispute', transaction.id), 
      {
        resolution,
        admin_note: adminNote,
      }, 
      {
        preserveScroll: true,
        onSuccess: () => {
          setOpen(false)
          setIsSubmitting(false)
        },
        onError: () => {
          setIsSubmitting(false)
        }
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <IconCheck className="h-4 w-4 mr-2" />
          Resolve Dispute
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resolve Dispute</DialogTitle>
          <DialogDescription>
            Choose who should receive the escrowed funds for this order.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Resolution Decision</Label>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  type="button"
                  variant={resolution === 'refund' ? 'default' : 'outline'}
                  className="h-auto flex-col items-start p-4"
                  onClick={() => setResolution('refund')}
                  disabled={isSubmitting}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <IconX className="h-4 w-4" />
                    <span className="font-semibold">Refund Client</span>
                  </div>
                  <span className="text-xs text-left">
                    Return ${transaction.amount.toLocaleString()} to {transaction.client.name || transaction.client.email}
                  </span>
                </Button>

                <Button
                  type="button"
                  variant={resolution === 'release' ? 'default' : 'outline'}
                  className="h-auto flex-col items-start p-4"
                  onClick={() => setResolution('release')}
                  disabled={isSubmitting}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <IconCheck className="h-4 w-4" />
                    <span className="font-semibold">Release to Freelancer</span>
                  </div>
                  <span className="text-xs text-left">
                    Pay ${transaction.amount.toLocaleString()} to {transaction.freelancer.name || transaction.freelancer.email}
                  </span>
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin_note">Admin Note (Optional)</Label>
              <Textarea
                id="admin_note"
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Add a note explaining your decision..."
                rows={4}
                disabled={isSubmitting}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Processing...' : 'Confirm Resolution'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ForceCancelDialog({ transaction }: { transaction: OrderTransaction }) {
  const [open, setOpen] = React.useState(false)
  const [reason, setReason] = React.useState('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (reason.length < 10) {
      toast.error("Reason must be at least 10 characters")
      return
    }

    setIsSubmitting(true)

    router.post(
      route('admin.order-transactions.force-cancel', transaction.id), 
      {
        reason,
      }, 
      {
        preserveScroll: true,
        onSuccess: () => {
          setOpen(false)
          setIsSubmitting(false)
        },
        onError: () => {
          setIsSubmitting(false)
        }
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive">
          <IconBan className="h-4 w-4 mr-2" />
          Force Cancel
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Force Cancel Transaction</DialogTitle>
          <DialogDescription>
            This will cancel the transaction and refund any escrowed funds to the client.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Cancellation Reason *</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why you are cancelling this transaction..."
                rows={4}
                required
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">
                Minimum 10 characters. This will be visible to both users.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={isSubmitting}>
              {isSubmitting ? 'Processing...' : 'Confirm Cancellation'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ForceCompleteDialog({ transaction }: { transaction: OrderTransaction }) {
  const [open, setOpen] = React.useState(false)
  const [adminNote, setAdminNote] = React.useState('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    router.post(
      route('admin.order-transactions.force-complete', transaction.id), 
      {
        admin_note: adminNote,
      }, 
      {
        preserveScroll: true,
        onSuccess: () => {
          setOpen(false)
          setIsSubmitting(false)
        },
        onError: () => {
          setIsSubmitting(false)
        }
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default">
          <IconCheck className="h-4 w-4 mr-2" />
          Force Complete
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Force Complete Transaction</DialogTitle>
          <DialogDescription>
            This will mark the order as completed and release payment to the freelancer.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="admin_note">Admin Note (Optional)</Label>
              <Textarea
                id="admin_note"
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Add a note explaining why you're completing this order..."
                rows={4}
                disabled={isSubmitting}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Processing...' : 'Confirm Completion'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

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

export default function AdminOrderTransactionShow() {
  const { transaction, flash } = usePage<PageProps>().props

  React.useEffect(() => {
    if (flash?.success) {
      toast.success(flash.success)
    }
    if (flash?.error) {
      toast.error(flash.error)
    }
  }, [flash])

  const breadcrumbsWithCurrent: BreadcrumbItem[] = [
    ...breadcrumbs,
    {
      title: `Order #${transaction.id}`,
      href: `/order-transactions/${transaction.id}`,
    }
  ]

  const isDispute = transaction.status === 'dispute'
  const canResolve = isDispute
  const canCancel = !['cancelled', 'refunded', 'released', 'completed'].includes(transaction.status)
  const canComplete = ['delivered', 'in_progress', 'accepted'].includes(transaction.status)

  return (
    <AppLayout breadcrumbs={breadcrumbsWithCurrent}>
      <Head title={`Order Transaction #${transaction.id}`} />

      <div className="flex h-full flex-1 flex-col gap-6 p-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Order #{transaction.id}</h1>
            <p className="text-muted-foreground">
              Created on {format(new Date(transaction.created_at), "dd MMMM yyyy 'at' HH:mm")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={getStatusVariant(transaction.status_color)} className="text-sm px-3 py-1">
              <span className={getStatusColorClass(transaction.status_color)}>
                {transaction.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </span>
            </Badge>
            {transaction.has_revisions && (
              <Badge variant="outline" className="text-sm px-3 py-1 bg-cyan-50 text-cyan-700 border-cyan-300">
                <IconRefresh className="h-4 w-4 mr-1" />
                {transaction.revision_count} Revision{transaction.revision_count > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </div>

        {/* Dispute Alert */}
        {isDispute && (
          <Card className="border-orange-500 bg-orange-50/30">
            <CardHeader>
              <div className="flex items-center gap-2">
                <IconAlertTriangle className="h-5 w-5 text-orange-600" />
                <CardTitle className="text-orange-600">Dispute Raised</CardTitle>
              </div>
              <CardDescription>
                This transaction is in dispute and requires admin intervention.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <Label className="text-muted-foreground">Raised By</Label>
                  <div className="flex items-center gap-2 mt-1">
                    {transaction.dispute_raised_by && (
                      <>
                        <IconUser className="h-4 w-4" />
                        <span>{transaction.dispute_raised_by.name || transaction.dispute_raised_by.email}</span>
                      </>
                    )}
                  </div>
                </div>
                {transaction.dispute_raised_at && (
                  <div>
                    <Label className="text-muted-foreground">Date</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <IconCalendar className="h-4 w-4" />
                      <span>{format(new Date(transaction.dispute_raised_at), "dd MMM yyyy HH:mm")}</span>
                    </div>
                  </div>
                )}
                {transaction.dispute_reason && (
                  <div>
                    <Label className="text-muted-foreground">Reason</Label>
                    <p className="mt-1 text-sm bg-white p-3 rounded-md border">
                      {transaction.dispute_reason}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Revision Alert */}
        {transaction.has_revisions && transaction.revision_count > 0 && (
          <Card className="border-cyan-500 bg-cyan-50/30">
            <CardHeader>
              <div className="flex items-center gap-2">
                <IconRefresh className="h-5 w-5 text-cyan-600" />
                <CardTitle className="text-cyan-600">Revision History</CardTitle>
              </div>
              <CardDescription>
                This order has been revised {transaction.revision_count} time{transaction.revision_count > 1 ? 's' : ''}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {transaction.revision_requested_by && (
                  <div>
                    <Label className="text-muted-foreground">Last Requested By</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <IconUser className="h-4 w-4" />
                      <span>{transaction.revision_requested_by.name || transaction.revision_requested_by.email}</span>
                    </div>
                  </div>
                )}
                {transaction.revision_requested_at && (
                  <div>
                    <Label className="text-muted-foreground">Last Revision Date</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <IconCalendar className="h-4 w-4" />
                      <span>{format(new Date(transaction.revision_requested_at), "dd MMM yyyy HH:mm")}</span>
                    </div>
                  </div>
                )}
                {transaction.revision_reason && (
                  <div>
                    <Label className="text-muted-foreground">Last Revision Reason</Label>
                    <p className="mt-1 text-sm bg-white p-3 rounded-md border">
                      {transaction.revision_reason}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* Order Details */}
          <Card>
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Title</Label>
                <p className="font-medium mt-1">{transaction.title}</p>
              </div>

              <div>
                <Label className="text-muted-foreground">Description</Label>
                <p className="text-sm mt-1 whitespace-pre-wrap">{transaction.description}</p>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Amount</Label>
                  <p className="text-2xl font-bold mt-1">
                    ${transaction.amount.toLocaleString()}
                  </p>
                </div>

                {transaction.deadline && (
                  <div>
                    <Label className="text-muted-foreground">Deadline</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <IconClock className="h-4 w-4" />
                      <span className="text-sm">
                        {format(new Date(transaction.deadline), "dd MMM yyyy")}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              <div>
                <Label className="text-muted-foreground">Conversation ID</Label>
                <p className="font-mono text-sm mt-1">#{transaction.conversation_id}</p>
              </div>

              {transaction.message_id && (
                <div>
                  <Label className="text-muted-foreground">Message ID</Label>
                  <p className="font-mono text-sm mt-1">#{transaction.message_id}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Participants */}
          <Card>
            <CardHeader>
              <CardTitle>Participants</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <UserDisplay 
                user={transaction.client} 
                label="Client (Paying)" 
                roleColor="bg-blue-100 text-blue-700"
              />
              <Separator />
              <UserDisplay 
                user={transaction.freelancer} 
                label="Freelancer (Working)" 
                roleColor="bg-green-100 text-green-700"
              />
              <Separator />
              <div className="text-xs text-muted-foreground pt-2">
                <p><strong>Creator:</strong> {transaction.creator.name || transaction.creator.email}</p>
                <p><strong>Executor:</strong> {transaction.executor.name || transaction.executor.email}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="rounded-full bg-green-500 p-2">
                    <IconCheck className="h-4 w-4 text-white" />
                  </div>
                  {transaction.accepted_at && <div className="h-full w-px bg-border" />}
                </div>
                <div className="flex-1 pb-4">
                  <p className="font-medium">Order Created</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(transaction.created_at), "dd MMM yyyy HH:mm")}
                  </p>
                </div>
              </div>

              {transaction.accepted_at && (
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="rounded-full bg-green-500 p-2">
                      <IconCheck className="h-4 w-4 text-white" />
                    </div>
                    {(transaction.delivered_at || transaction.completed_at) && <div className="h-full w-px bg-border" />}
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="font-medium">Order Accepted & Funds Escrowed</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(transaction.accepted_at), "dd MMM yyyy HH:mm")}
                    </p>
                  </div>
                </div>
              )}

              {transaction.has_revisions && transaction.revision_count > 0 && (
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="rounded-full bg-cyan-500 p-2">
                      <IconRefresh className="h-4 w-4 text-white" />
                    </div>
                    <div className="h-full w-px bg-border" />
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="font-medium">Revision{transaction.revision_count > 1 ? 's' : ''} Requested</p>
                    <p className="text-sm text-muted-foreground">
                      {transaction.revision_count} time{transaction.revision_count > 1 ? 's' : ''}
                      {transaction.revision_requested_at && ` - Last: ${format(new Date(transaction.revision_requested_at), "dd MMM yyyy HH:mm")}`}
                    </p>
                    {transaction.revision_reason && (
                      <p className="text-sm mt-2 bg-cyan-50 p-2 rounded border border-cyan-200">
                        {transaction.revision_reason}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {transaction.delivered_at && (
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="rounded-full bg-green-500 p-2">
                      <IconFileText className="h-4 w-4 text-white" />
                    </div>
                    {transaction.completed_at && <div className="h-full w-px bg-border" />}
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="font-medium">Work Delivered</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(transaction.delivered_at), "dd MMM yyyy HH:mm")}
                    </p>
                  </div>
                </div>
              )}

              {transaction.completed_at && (
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="rounded-full bg-green-500 p-2">
                      <IconCheck className="h-4 w-4 text-white" />
                    </div>
                    {transaction.released_at && <div className="h-full w-px bg-border" />}
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="font-medium">Order Completed</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(transaction.completed_at), "dd MMM yyyy HH:mm")}
                    </p>
                  </div>
                </div>
              )}

              {transaction.released_at && (
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="rounded-full bg-green-500 p-2">
                      <IconCheck className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Payment Released</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(transaction.released_at), "dd MMM yyyy HH:mm")}
                    </p>
                  </div>
                </div>
              )}

              {transaction.cancelled_at && (
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="rounded-full bg-red-500 p-2">
                      <IconX className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Order Cancelled</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(transaction.cancelled_at), "dd MMM yyyy HH:mm")}
                    </p>
                    {transaction.cancelled_by && (
                      <p className="text-sm text-muted-foreground">
                        By: {transaction.cancelled_by.name || transaction.cancelled_by.email}
                      </p>
                    )}
                    {transaction.cancellation_reason && (
                      <p className="text-sm mt-2 bg-muted p-2 rounded">
                        {transaction.cancellation_reason}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Admin Notes */}
        {transaction.admin_note && (
          <Card className="border-purple-200 bg-purple-50/30">
            <CardHeader>
              <CardTitle className="text-purple-900">Admin Note</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{transaction.admin_note}</p>
            </CardContent>
          </Card>
        )}

        {/* Admin Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Admin Actions</CardTitle>
            <CardDescription>
              Take action on this order transaction
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            {canResolve && <ResolveDisputeDialog transaction={transaction} />}
            {canComplete && <ForceCompleteDialog transaction={transaction} />}
            {canCancel && <ForceCancelDialog transaction={transaction} />}
            <Button
              variant="outline"
              onClick={() => router.visit(route('admin.order-transactions.index'))}
            >
              Back to List
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}