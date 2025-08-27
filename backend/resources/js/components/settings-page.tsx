import * as React from "react"
import { IconEdit, IconPlus, IconTrash } from "@tabler/icons-react"
import { toast } from "sonner"
import { set, z } from "zod"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { router } from '@inertiajs/react'
import { Download } from "lucide-react"

// Schema for setting data validation
export const settingSchema = z.object({
  id: z.number(),
  key: z.string(),
  name: z.string(),
  value: z.string().nullable(),
})

// Setting Edit/Add Dialog Component
function SettingDialog({ setting, onUpdate, isEdit = false }: { 
  setting?: z.infer<typeof settingSchema>, 
  onUpdate: () => void,
  isEdit?: boolean
}) {
  const [open, setOpen] = React.useState(false)
  const [formData, setFormData] = React.useState({
    key: setting?.key || "",
    name: setting?.name || "",
    value: setting?.value || "",
  })
  const [file, setFile] = React.useState<File | null>(null)

  const isFileType = formData.key.includes('_img') || formData.key.includes('_file')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const data = new FormData()
    data.append('key', formData.key)
    data.append('name', formData.name)
    
    if (isFileType && file) {
      data.append('file', file)
    } else {
      data.append('value', formData.value)
    }

    if (isEdit && setting) {
      data.append('_method', 'PATCH');
      router.post(route('admin.settings.update', setting.id), data, {
        onSuccess: () => {
          toast.success("Setting updated successfully")
          setOpen(false)
          onUpdate()
        },
        onError: (errors) => {
          if (errors) {
            Object.entries(errors).forEach(([field, message]) => {
              toast.error(`${field}: ${message}`);
            });
          } else {
            toast.error("Failed to update setting");
          }
        }
      })
    } else {
      router.post(route('admin.settings.store'), data, {
        onSuccess: () => {
          toast.success("Setting created successfully")
          setOpen(false)
          setFormData({ key: "", name: "", value: "" })
          setFile(null)
          onUpdate()
        },
        onError: (errors) => {
          if (errors) {
            Object.entries(errors).forEach(([field, message]) => {
              toast.error(`${field}: ${message}`);
            });
          } else {
            toast.error("Failed to create setting");
          }
        }
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button variant="ghost" size="icon">
            <IconEdit className="h-4 w-4" />
          </Button>
        ) : (
          <Card className="flex cursor-pointer items-center justify-center border-dashed hover:border-primary">
            <CardContent className="flex items-center justify-center p-6">
              <IconPlus className="h-8 w-8 text-muted-foreground" />
            </CardContent>
          </Card>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Setting' : 'Create New Setting'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {!isEdit && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="key" className="text-right">
                  Key
                </Label>
                <Input
                  id="key"
                  value={formData.key}
                  onChange={(e) => setFormData({...formData, key: e.target.value})}
                  className="col-span-3"
                  required
                />
              </div>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="value" className="text-right">
                {isFileType ? 'File' : 'Value'}
              </Label>
              {isFileType ? (
                <Input
                  id="file"
                  type="file"
                  accept={formData.key.includes('_img') ? 'image/*' : '*/*'}
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="col-span-3"
                />
              ) : (
                <Input
                  id="value"
                  value={formData.value}
                  onChange={(e) => setFormData({...formData, value: e.target.value})}
                  className="col-span-3"
                />
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">{isEdit ? 'Save Changes' : 'Create Setting'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function SettingsPage({ settings }: { settings: Record<string, z.infer<typeof settingSchema>> }) {
  const refreshData = () => {
    router.reload()
  }

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this setting?")) {
      router.delete(route('admin.settings.destroy', id), {
        onSuccess: () => {
          toast.success("Setting deleted successfully")
          refreshData()
        },
        onError: () => {
          toast.error("Failed to delete setting")
        }
      })
    }
  }

  const settingList = Object.values(settings)

  return (
    <div className="flex w-full flex-col gap-6 p-4 lg:p-6">
      <h2 className="text-2xl font-bold tracking-tight">System Settings</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {settingList.map((setting) => (
          <Card key={setting.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {setting.name}
              </CardTitle>
              <div className="flex items-center gap-1">
                <SettingDialog setting={setting} onUpdate={refreshData} isEdit={true} />
                {!['site_title', 'logo_img', 'support_link'].includes(setting.key) && (
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(setting.id)}>
                    <IconTrash className="h-4 w-4 text-red-500" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(setting.key.includes('_img') || setting.key.includes('_file')) ? (
                  <span className="flex items-center gap-2">File Attached
                    <a
                      href={setting.value || '#'}
                      target="_blank"
                      download={setting.name}
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 h-10 w-auto text-blue-600 hover:underline"
                    >
                      <Download className="w-5 h-5" />
                    </a>

                  </span> ) : (setting.value || 'Not set')}
              </div>
              <p className="text-xs text-muted-foreground">
                Key: {setting.key}
              </p>
            </CardContent>
            <CardFooter>
              {(setting.key.includes('_img') || setting.key === 'logo_img') && setting.value && (
                <img src={setting.value} alt="Logo" className="h-10 w-auto" />
              )}
              {(setting.key.includes('_file')) && setting.value && (
                <a href={setting.value} target="_blank" rel="noopener noreferrer" className="h-10 w-auto">
                View File
                </a>
              )}
            </CardFooter>
          </Card>
        ))}
        <SettingDialog onUpdate={refreshData} />
      </div>
    </div>
  )
}