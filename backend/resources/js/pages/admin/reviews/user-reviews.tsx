import * as React from "react"
import { Head, usePage, router } from '@inertiajs/react'
import {
  IconDownload,
  IconEye,
  IconFilter,
  IconSearch,
  IconCalendar,
  IconStar,
  IconStarFilled,
  IconChevronDown,
  IconTrash,
  IconArrowLeft,
  IconMessageCircle,
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
import { BreadcrumbItem, User } from '@/types'

interface Review {
  id: number
  star: number
  comment: string
  created_at: string
}

interface UserReviewPageProps {
  reviews: {
    data: Review[]
    current_page: number
    last_page: number
    next_page_url: string | null
    prev_page_url: string | null
    total: number
  }
  stats: {
    totalReviews: number
    averageRating: number
    ratingDistribution: {
      1: number
      2: number
      3: number
      4: number
      5: number
    }
    latestReviewDate: string | null
  }
  user: User
  filters: {
    search?: string
    star?: string
    date_from?: string
    date_to?: string
  }
}

// Star Rating Display Component
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        star <= rating ? (
          <IconStarFilled key={star} className="h-4 w-4 text-yellow-500" />
        ) : (
          <IconStar key={star} className="h-4 w-4 text-gray-300" />
        )
      ))}
    </div>
  )
}

// Delete Review Dialog
function DeleteReviewDialog({ review, onDelete }: {
  review: Review
  onDelete: () => void
}) {
  const [open, setOpen] = React.useState(false)

  const handleDelete = () => {
    router.delete(route('admin.reviews.destroy', review.id), {
      onSuccess: () => {
        toast.success("Review deleted successfully")
        setOpen(false)
        onDelete()
      },
      onError: () => {
        toast.error("Failed to delete review")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <IconTrash className="h-4 w-4 text-red-600" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Review</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this review? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Rating:</span>
              <StarRating rating={review.star} />
            </div>
            <div>
              <span className="text-sm font-medium">Comment:</span>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {review.comment}
              </p>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            Delete Review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Define table columns
const userReviewColumns = (refreshData: () => void): ColumnDef<Review>[] => [
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
    accessorKey: "star",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Rating
        <IconChevronDown
          className={`ml-2 h-4 w-4 ${
            column.getIsSorted() === "desc" ? "rotate-180" : ""
          }`}
        />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <StarRating rating={row.original.star} />
        <span className="text-sm font-medium">{row.original.star}/5</span>
      </div>
    ),
  },
  {
    accessorKey: "comment",
    header: "Comment",
    cell: ({ row }) => (
      <div className="max-w-xl">
        <p className="text-sm line-clamp-3">{row.original.comment}</p>
      </div>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const review = row.original

      return (
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.visit(route('admin.reviews.show', review.id))}
          >
            <IconEye className="h-4 w-4" />
          </Button>
          <DeleteReviewDialog review={review} onDelete={refreshData} />
        </div>
      )
    },
  },
]

export default function UserReviewsPage() {
  const { reviews, stats, user, filters } = usePage<UserReviewPageProps>().props
  
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [search, setSearch] = React.useState(filters.search || "")
  const [starFilter, setStarFilter] = React.useState(filters.star || "all")
  const [dateFrom, setDateFrom] = React.useState(filters.date_from || "")
  const [dateTo, setDateTo] = React.useState(filters.date_to || "")

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
      title: user.name || user.email,
      href: `/admin/reviews/user/${user.id}`,
    },
  ]

  const refreshData = () => {
    router.reload()
  }

  const table = useReactTable({
    data: reviews.data || [],
    columns: userReviewColumns(refreshData),
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
    pageCount: reviews.last_page || 1,
  })

  // Handle filters with debounce
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      const params: Record<string, string> = {}
      if (search) params.search = search
      if (starFilter !== 'all') params.star = starFilter
      if (dateFrom) params.date_from = dateFrom
      if (dateTo) params.date_to = dateTo
      
      router.get(route('admin.reviews.user', user.id), params, {
        preserveState: true,
        preserveScroll: true,
      })
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [search, starFilter, dateFrom, dateTo])

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`Reviews - ${user.name || user.email}`} />
      
      <div className="flex h-full flex-1 flex-col gap-6 p-4">
        {/* Back Button and User Info */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.visit(route('admin.reviews.index'))}
          >
            <IconArrowLeft className="h-4 w-4 mr-2" />
            Back to All Reviews
          </Button>
        </div>

        {/* User Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              {user.avatar ? (
                <img
                  src={user.avatar_url || undefined}
                  alt={user.name || user.email}
                  className="h-16 w-16 rounded-full"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-xl font-semibold">
                  {user.name 
                    ? user.name.charAt(0).toUpperCase() 
                    : user.email.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1">
                <h2 className="text-2xl font-bold">{user.name || "No name"}</h2>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
              <IconMessageCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalReviews}
              </div>
              <p className="text-xs text-muted-foreground">
                All time reviews
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
              <IconStarFilled className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center gap-2">
                {stats.averageRating}
                <StarRating rating={Math.round(stats.averageRating)} />
              </div>
              <p className="text-xs text-muted-foreground">
                Out of 5 stars
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Latest Review</CardTitle>
              <IconCalendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.latestReviewDate 
                  ? format(new Date(stats.latestReviewDate), "dd MMM")
                  : "N/A"}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.latestReviewDate 
                  ? format(new Date(stats.latestReviewDate), "yyyy")
                  : "No reviews yet"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Rating Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Rating Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = stats.ratingDistribution[star as keyof typeof stats.ratingDistribution]
                const percentage = stats.totalReviews > 0 
                  ? (count / stats.totalReviews) * 100 
                  : 0

                return (
                  <div key={star} className="flex items-center gap-3">
                    <div className="flex items-center gap-1 w-16">
                      <span className="text-sm font-medium">{star}</span>
                      <IconStarFilled className="h-3 w-3 text-yellow-500" />
                    </div>
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-yellow-500 transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-20 text-right">
                      {count} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Filters and Table */}
        <Card>
          <CardHeader>
            <CardTitle>User Reviews</CardTitle>
            
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative">
                <IconSearch className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search comments..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>

              <Select value={starFilter} onValueChange={setStarFilter}>
                <SelectTrigger className="w-40">
                  <IconFilter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ratings</SelectItem>
                  <SelectItem value="5">⭐⭐⭐⭐⭐ (5)</SelectItem>
                  <SelectItem value="4">⭐⭐⭐⭐ (4)</SelectItem>
                  <SelectItem value="3">⭐⭐⭐ (3)</SelectItem>
                  <SelectItem value="2">⭐⭐ (2)</SelectItem>
                  <SelectItem value="1">⭐ (1)</SelectItem>
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
                    table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        className="hover:bg-muted/50"
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
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={userReviewColumns(refreshData).length} className="h-24 text-center">
                        No reviews found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-4">
              <div className="text-sm text-muted-foreground">
                Page {reviews.current_page} of {reviews.last_page} 
                ({reviews.total} total reviews)
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (reviews.prev_page_url) {
                      router.visit(reviews.prev_page_url, {
                        preserveState: true,
                        preserveScroll: true,
                      })
                    }
                  }}
                  disabled={!reviews.prev_page_url}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (reviews.next_page_url) {
                      router.visit(reviews.next_page_url, {
                        preserveState: true,
                        preserveScroll: true,
                      })
                    }
                  }}
                  disabled={!reviews.next_page_url}
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