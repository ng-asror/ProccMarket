import * as React from "react"
import { IconEdit, IconPlus, IconTrash } from "@tabler/icons-react"
import { toast } from "sonner"
import { z } from "zod"

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (isEdit && setting) {
      router.patch(route('admin.settings.update', setting.id), {
        name: formData.name,
        value: formData.value,
      }, {
        onSuccess: () => {
          toast.success("Setting updated successfully")
          setOpen(false)
          onUpdate()
        },
        onError: () => {
          toast.error("Failed to update setting")
        }
      })
    } else {
      router.post(route('admin.settings.store'), formData, {
        onSuccess: () => {
          toast.success("Setting created successfully")
          setOpen(false)
          setFormData({ key: "", name: "", value: "" })
          onUpdate()
        },
        onError: () => {
          toast.error("Failed to create setting")
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
                Value
              </Label>
              <Input
                id="value"
                value={formData.value}
                onChange={(e) => setFormData({...formData, value: e.target.value})}
                className="col-span-3"
              />
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
                {!['site_title', 'logo', 'support_link'].includes(setting.key) && (
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(setting.id)}>
                    <IconTrash className="h-4 w-4 text-red-500" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {setting.value || 'Not set'}
              </div>
              <p className="text-xs text-muted-foreground">
                Key: {setting.key}
              </p>
            </CardContent>
            <CardFooter>
              {setting.key === 'logo' && setting.value && (
                <img src={setting.value} alt="Logo" className="h-10 w-auto" />
              )}
            </CardFooter>
          </Card>
        ))}
        <SettingDialog onUpdate={refreshData} />
      </div>
    </div>
  )
}