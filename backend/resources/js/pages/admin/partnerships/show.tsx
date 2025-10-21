import * as React from "react"
import { Head, router, usePage } from '@inertiajs/react'
import {
  IconArrowLeft,
  IconTrash,
  IconUser,
  IconMail,
  IconCoins,
  IconCalendar,
  IconFileText,
  IconClock,
} from "@tabler/icons-react"
import { toast } from "sonner"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import AppLayout from '@/layouts/app-layout'
import { BreadcrumbItem } from '@/types'

interface Application {
  id: number
  user: {
    id: number
    name: string
    email: string
    avatar: string | null
    balance: number
    created_at: string
  }
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
  updated_at: string
}

interface PageProps {
  application: Application
}

export default function AdminPartnershipShow() {
  const { application } = usePage<PageProps>().props
  const [deleteDialog, setDeleteDialog] = React.useState(false)

  const handleDelete = () => {
    router.delete(route('admin.partnerships.destroy', application.id), {
      onSuccess: () => {
        toast.success('Application deleted successfully')
        router.visit(route('admin.partnerships.index'))
      },
      onError: () => {
        toast.error('Failed to delete application')
      }
    })
  }

  const breadcrumbs: BreadcrumbItem[] = [
    {
      title: 'Dashboard',
      href: '/admin',
    },
    {
      title: 'Partnership Applications',
      href: '/admin/partnerships',
    },
    {
      title: `Application #${application.id}`,
      href: route('admin.partnerships.show', application.id),
    },
  ]

  const statusColors = {
    pending: "text-yellow-600 bg-yellow-50 border-yellow-200",
    under_review: "text-blue-600 bg-blue-50 border-blue-200",
    approved: "text-green-600 bg-green-50 border-green-200",
    rejected: "text-red-600 bg-red-50 border-red-200",
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`Application #${application.id} - ${application.user.name}`} />
      
      <div className="flex h-full flex-1 flex-col gap-6 p-4 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col items-start gap-4">
            <Button
              variant="outline"
              onClick={() => router.visit(route('admin.partnerships.index'))}
            >
              <IconArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Application #{application.id}</h1>
              <p className="text-muted-foreground">
                {format(new Date(application.created_at), "dd MMMM yyyy, HH:mm")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="destructive"
              onClick={() => setDeleteDialog(true)}
            >
              <IconTrash className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        {/* User Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconUser className="h-5 w-5" />
              User Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              {application.user.avatar ? (
                <img
                  src={application.user.avatar}
                  alt={application.user.name}
                  className="h-16 w-16 rounded-full"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-2xl">
                  {application.user.name 
                    ? application.user.name.charAt(0).toUpperCase() 
                    : application.user.email.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h3 className="text-xl font-semibold">{application.user.name || "No name"}</h3>
                <p className="text-muted-foreground flex items-center gap-2">
                  <IconMail className="h-4 w-4" />
                  {application.user.email}
                </p>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Balance</p>
                <p className="text-lg font-semibold flex items-center gap-2">
                  <IconCoins className="h-5 w-5 text-green-600" />
                  ${application.user.balance.toLocaleString()}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Registered</p>
                <p className="text-lg font-semibold flex items-center gap-2">
                  <IconCalendar className="h-5 w-5" />
                  {format(new Date(application.user.created_at), "dd MMM yyyy")}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">User ID</p>
                <p className="text-lg font-semibold font-mono">
                  #{application.user.id}
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.visit(route('admin.transactions.user.show', application.user.id))}
            >
              View User Transactions
            </Button>
          </CardContent>
        </Card>

        {/* Application Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconFileText className="h-5 w-5" />
              Application Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Deposit Amount */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                Deposit Amount
              </h4>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-green-600">
                  ${application.deposit_amount.toLocaleString()}
                </p>
              </div>
            </div>

            <Separator />

            {/* Processing Experience */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                Processing and Cryptocurrency Experience
              </h4>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm whitespace-pre-wrap">
                  {application.processing_experience}
                </p>
              </div>
            </div>

            <Separator />

            {/* About Yourself */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                About Yourself and Experience
              </h4>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm whitespace-pre-wrap">
                  {application.about_yourself}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Admin Notes and Review Info */}
        {(application.admin_notes || application.reviewed_at) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconClock className="h-5 w-5" />
                Review Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {application.reviewed_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Reviewed At</p>
                  <p className="text-lg font-semibold">
                    {format(new Date(application.reviewed_at), "dd MMMM yyyy, HH:mm")}
                  </p>
                  {application.reviewer && (
                    <p className="text-sm text-muted-foreground">
                      Reviewed by: {application.reviewer.name}
                    </p>
                  )}
                </div>
              )}

              {application.admin_notes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Admin Notes</p>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">
                      {application.admin_notes}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="h-3 w-3 rounded-full bg-primary" />
                  <div className="h-full w-0.5 bg-border" />
                </div>
                <div className="pb-4">
                  <p className="font-semibold">Application Submitted</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(application.created_at), "dd MMMM yyyy, HH:mm")}
                  </p>
                </div>
              </div>

              {application.reviewed_at && (
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="h-3 w-3 rounded-full bg-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">Reviewed</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(application.reviewed_at), "dd MMMM yyyy, HH:mm")}
                    </p>
                    {application.reviewer && (
                      <p className="text-sm text-muted-foreground">
                        {application.reviewer.name}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Application</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this application? This action cannot be undone.
              <br />
              <br />
              The user will be able to submit a new application after deletion.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}