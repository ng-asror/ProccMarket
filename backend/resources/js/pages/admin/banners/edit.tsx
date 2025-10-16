import * as React from "react"
import { Head, router, useForm, usePage } from '@inertiajs/react'
import { IconArrowLeft, IconUpload, IconX } from "@tabler/icons-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import AppLayout from '@/layouts/app-layout'
import { BreadcrumbItem } from '@/types'

interface Banner {
  id: number
  title: string
  description: string | null
  image: string
  image_url: string
  link: string | null
  is_active: boolean
  order: number
  starts_at: string | null
  ends_at: string | null
}

interface EditPageProps {
  banner: Banner
}

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Admin Dashboard',
    href: '/admin',
  },
  {
    title: 'Banners',
    href: '/admin/banners',
  },
  {
    title: 'Edit Banner',
    href: '#',
  },
]

export default function BannerEdit() {
  const { banner } = usePage<EditPageProps>().props
  const [imagePreview, setImagePreview] = React.useState<string | null>(banner.image_url)
  
  const { data, setData, post, processing, errors } = useForm({
    title: banner.title,
    description: banner.description || '',
    image: null as File | null,
    link: banner.link || '',
    is_active: banner.is_active,
    order: banner.order,
    starts_at: banner.starts_at || '',
    ends_at: banner.ends_at || '',
    _method: 'PUT',
  })

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setData('image', file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setData('image', null)
    setImagePreview(banner.image_url)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    post(route('admin.banners.update', banner.id), {
      onSuccess: () => {
        toast.success('Banner updated successfully')
      },
      onError: () => {
        toast.error('Failed to update banner')
      }
    })
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`Edit Banner - ${banner.title}`} />
      
      <div className="flex h-full flex-1 flex-col gap-6 p-4 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => router.visit(route('admin.banners.index'))}
          >
            <IconArrowLeft className="h-4 w-4 mr-2" />
            Back to Banners
          </Button>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
            <h1 className="text-3xl font-bold">Edit Banner</h1>
              <CardTitle>Banner Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">
                  Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  value={data.title}
                  onChange={(e) => setData('title', e.target.value)}
                  placeholder="Enter banner title"
                  className={errors.title ? 'border-red-500' : ''}
                />
                {errors.title && (
                  <p className="text-sm text-red-500">{errors.title}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={data.description}
                  onChange={(e) => setData('description', e.target.value)}
                  placeholder="Enter banner description"
                  rows={3}
                  className={errors.description ? 'border-red-500' : ''}
                />
                {errors.description && (
                  <p className="text-sm text-red-500">{errors.description}</p>
                )}
              </div>

              {/* Image Upload */}
              <div className="space-y-2">
                <Label htmlFor="image">Banner Image</Label>
                
                <div className="relative w-full h-64 rounded-lg overflow-hidden border">
                  <img
                    src={imagePreview || ''}
                    alt="Banner preview"
                    className="w-full h-full object-cover"
                  />
                  {data.image && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={removeImage}
                    >
                      <IconX className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <label
                  htmlFor="image"
                  className="flex items-center justify-center w-full h-12 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/80 transition-colors"
                >
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <IconUpload className="w-4 h-4" />
                    <span>Click to change image</span>
                  </div>
                  <input
                    id="image"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </label>
                
                {errors.image && (
                  <p className="text-sm text-red-500">{errors.image}</p>
                )}
              </div>

              {/* Link */}
              <div className="space-y-2">
                <Label htmlFor="link">Link URL (Optional)</Label>
                <Input
                  id="link"
                  type="url"
                  value={data.link}
                  onChange={(e) => setData('link', e.target.value)}
                  placeholder="https://example.com"
                  className={errors.link ? 'border-red-500' : ''}
                />
                {errors.link && (
                  <p className="text-sm text-red-500">{errors.link}</p>
                )}
              </div>

              {/* Order */}
              <div className="space-y-2">
                <Label htmlFor="order">Display Order</Label>
                <Input
                  id="order"
                  type="number"
                  min="0"
                  value={data.order}
                  onChange={(e) => setData('order', parseInt(e.target.value) || 0)}
                  placeholder="0"
                  className={errors.order ? 'border-red-500' : ''}
                />
                <p className="text-xs text-muted-foreground">
                  Lower numbers appear first
                </p>
                {errors.order && (
                  <p className="text-sm text-red-500">{errors.order}</p>
                )}
              </div>

              {/* Schedule */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="starts_at">Start Date (Optional)</Label>
                  <Input
                    id="starts_at"
                    type="datetime-local"
                    value={data.starts_at}
                    onChange={(e) => setData('starts_at', e.target.value)}
                    className={errors.starts_at ? 'border-red-500' : ''}
                  />
                  {errors.starts_at && (
                    <p className="text-sm text-red-500">{errors.starts_at}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ends_at">End Date (Optional)</Label>
                  <Input
                    id="ends_at"
                    type="datetime-local"
                    value={data.ends_at}
                    onChange={(e) => setData('ends_at', e.target.value)}
                    className={errors.ends_at ? 'border-red-500' : ''}
                  />
                  {errors.ends_at && (
                    <p className="text-sm text-red-500">{errors.ends_at}</p>
                  )}
                </div>
              </div>

              {/* Active Status */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="is_active">Active Status</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable this banner to show on the website
                  </p>
                </div>
                <Switch
                  id="is_active"
                  checked={data.is_active}
                  onCheckedChange={(checked) => setData('is_active', checked)}
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={processing}
                  className="flex-1"
                >
                  {processing ? 'Updating...' : 'Update Banner'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.visit(route('admin.banners.index'))}
                  disabled={processing}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </AppLayout>
  )
}