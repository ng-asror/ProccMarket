import * as React from "react"
import { Head, usePage, router } from '@inertiajs/react'
import {
  IconArrowLeft,
  IconStar,
  IconStarFilled,
  IconCalendar,
  IconUser,
  IconTrash,
  IconMail,
} from "@tabler/icons-react"
import { toast } from "sonner"

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
import AppLayout from '@/layouts/app-layout'
import { BreadcrumbItem } from '@/types'

interface Review {
  id: number
  star: number
  comment: string
  created_at: string
  user: {
    id: number
    name: string | null
    email: string
    avatar: string | null
  }
}

interface ReviewShowPageProps {
  review: Review
}

// Star Rating Display Component
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        star <= rating ? (
          <IconStarFilled key={star} className="h-5 w-5 text-yellow-500" />
        ) : (
          <IconStar key={star} className="h-5 w-5 text-gray-300" />
        )
      ))}
    </div>
  )
}

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Admin Dashboard',
    href: '/admin',
  },
  {
    title: 'Reviews',
    href: '/admin/reviews',
  },
  {
    title: 'Review Details',
    href: '#',
  },
]

export default function ReviewShowPage() {
  const { review } = usePage<ReviewShowPageProps>().props
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)

  const handleDelete = () => {
    router.delete(route('admin.reviews.destroy', review.id), {
      onSuccess: () => {
        toast.success("Review deleted successfully")
        router.visit(route('admin.reviews.index'))
      },
      onError: () => {
        toast.error("Failed to delete review")
      }
    })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`Review #${review.id}`} />
      
      <div className="flex h-full flex-1 flex-col gap-6 p-4 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.visit(route('admin.reviews.index'))}
          >
            <IconArrowLeft className="h-4 w-4 mr-2" />
            Back to Reviews
          </Button>

          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <IconTrash className="h-4 w-4 mr-2" />
                Delete Review
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Review</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this review? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDelete}>
                  Delete Review
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Review Details Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Review #{review.id}</CardTitle>
              <div className="flex items-center gap-2">
                <StarRating rating={review.star} />
                <span className="text-lg font-bold">{review.star}/5</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Date */}
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <IconCalendar className="h-5 w-5" />
              <span>{formatDate(review.created_at)}</span>
            </div>

            {/* Comment */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Comment
              </h3>
              <p className="text-base leading-relaxed p-4 bg-muted rounded-lg">
                {review.comment}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* User Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              className="flex items-center gap-4 p-4 rounded-lg hover:bg-muted cursor-pointer transition-colors"
              onClick={() => router.visit(route('admin.reviews.user', review.user.id))}
            >
              {review.user.avatar ? (
                <img
                  src={review.user.avatar}
                  alt={review.user.name || review.user.email}
                  className="h-16 w-16 rounded-full"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-xl font-semibold">
                  {review.user.name 
                    ? review.user.name.charAt(0).toUpperCase() 
                    : review.user.email.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <IconUser className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">
                    {review.user.name || "No name"}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <IconMail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {review.user.email}
                  </span>
                </div>
                <Button
                  variant="link"
                  className="p-0 h-auto mt-2 text-sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    router.visit(route('admin.reviews.user', review.user.id))
                  }}
                >
                  View all reviews from this user →
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}