import * as React from "react"
import {
  IconBan,
  IconCircleCheckFilled,
  IconCoins,
  IconDotsVertical,
  IconEdit,
  IconLayoutColumns,
  IconPlus,
  IconSearch,
  IconTrash,
  IconChevronDown,
  IconLock,
  IconHistory,
  IconX,
  IconUser,
  IconUpload,
  IconPhoto,
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
  VisibilityState,
} from "@tanstack/react-table"
import { toast } from "sonner"
import { z } from "zod"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
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
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs"
import { router } from '@inertiajs/react'
import { parse } from "path"
import { Textarea } from "./ui/textarea"

// Schema for user data validation
export const userSchema = z.object({
  id: z.number(),
  name: z.string().nullable(),
  email: z.string(),
  role: z.object({
    id: z.number(),
    name: z.string(),
  }).nullable(),
  balance: z.number(),
  banned: z.boolean(),
  description: z.string().nullable(),
  avatar: z.string().nullable(),
  avatar_url: z.string().nullable(),
  is_admin: z.boolean(),
  created_at: z.string(),
})

// Add User Dialog Component
function AddUserDialog({ roles, onUpdate }: { roles: any[], onUpdate: () => void }) {
  const [open, setOpen] = React.useState(false)
  const [formData, setFormData] = React.useState({
    name: "",
    telegram_id: "",
    email: "",
    role_id: "",
    password: "",
    is_admin: false,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    router.post(route('admin.users.store'), formData, {
      onSuccess: () => {
        toast.success("User created successfully")
        setOpen(false)
        setFormData({ name: "", telegram_id: "", email: "", role_id: "", password: "", is_admin: false })
        onUpdate()
      },
      onError: (errors) => {
        toast.error("Failed to create user")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <IconPlus className="h-4 w-4" />
          <span className="hidden sm:inline">Add User</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Telegram ID
              </Label>
              <Input
                id="telegram_id"
                value={formData.telegram_id}
                onChange={(e) => setFormData({ ...formData, telegram_id: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Role *
              </Label>
              <Select
                value={formData.role_id}
                onValueChange={(value) => setFormData({ ...formData, role_id: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id.toString()}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="is_admin" className="text-right">
                Admin
              </Label>
              <div className="col-span-3 flex items-center space-x-2">
                <Checkbox
                  id="is_admin"
                  checked={formData.is_admin}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_admin: checked === true })}
                />
                <label htmlFor="is_admin" className="text-sm font-medium leading-none">
                  Is Administrator
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Create User</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Password Change Dialog Component
function PasswordChangeDialog({ user, onUpdate }: { user: z.infer<typeof userSchema>, onUpdate: () => void }) {
  const [open, setOpen] = React.useState(false)
  const [password, setPassword] = React.useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long")
      return
    }

    router.patch(route('admin.users.password.update', user.id), { password }, {
      onSuccess: () => {
        toast.success("Password updated successfully")
        setOpen(false)
        setPassword("")
        onUpdate()
      },
      onError: (errors) => {
        toast.error("Failed to update password")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <IconLock className="mr-2 h-4 w-4" />
          Change Password
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Password for {user.name || user.email}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                New Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Update Password</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Balance Update Dialog Component
function BalanceUpdateDialog({ user, onUpdate }: { user: z.infer<typeof userSchema>, onUpdate: () => void }) {
  const [open, setOpen] = React.useState(false)
  const [amount, setAmount] = React.useState("")
  const [type, setType] = React.useState<"add" | "subtract">("add")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error("Please enter a valid amount")
      return
    }

    if (type === "subtract" && numAmount > user.balance) {
      toast.error("Cannot subtract more than current balance")
      return
    }

    router.patch(route('admin.users.balance.update', user.id), {
      amount: numAmount,
      type
    }, {
      onSuccess: () => {
        toast.success(`Balance ${type === 'add' ? 'added' : 'subtracted'} successfully`)
        setOpen(false)
        setAmount("")
        onUpdate()
      },
      onError: (errors) => {
        toast.error("Failed to update balance")
      }
    })
  }

  const newBalance = type === "add"
    ? parseFloat(user.balance) + (parseFloat(amount) || 0)
    : parseFloat(user.balance) - (parseFloat(amount) || 0)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <IconCoins className="mr-2 h-4 w-4" />
          Update Balance
        </DropdownMenuItem>
      </DialogTrigger>
      <>
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault()
            router.visit(route('admin.transactions.user.show', user.id))
          }}
        >
          <IconHistory className="mr-2 h-4 w-4" />
          Transaction History
        </DropdownMenuItem>
      </>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Balance for {user.name || user.email}</DialogTitle>
          <DialogDescription>
            Current balance: {user.balance.toLocaleString()}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Action
              </Label>
              <Select value={type} onValueChange={(v: "add" | "subtract") => setType(v)}>
                <SelectTrigger className="col-span-2">
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">Add to balance</SelectItem>
                  <SelectItem value="subtract">Subtract from balance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Amount
              </Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="col-span-2"
                min="0"
                step="0.01"
                required
              />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label className="text-right">
                New Balance
              </Label>
              <div className={`col-span-2 font-bold ${type === "add" ? "text-green-600" : "text-red-600"}`}>
                {newBalance.toLocaleString()}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Update Balance</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// User Edit Dialog Component
function UserEditDialog({ user, roles, onUpdate }: {
  user: z.infer<typeof userSchema>,
  roles: any[],
  onUpdate: () => void
}) {
  const [open, setOpen] = React.useState(false)
  const [formData, setFormData] = React.useState({
    name: user.name || "",
    email: user.email,
    role_id: user.role?.id.toString() || "",
    is_admin: user.is_admin,
    description: user.description || "",
  })
  const [avatarFile, setAvatarFile] = React.useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(user.avatar_url || null)
  const [removeAvatar, setRemoveAvatar] = React.useState(false)
  const avatarFileInputRef = React.useRef<HTMLInputElement>(null)

  const [coverFile, setCoverFile] = React.useState<File | null>(null)
  const [coverPreview, setCoverPreview] = React.useState<string | null>(user.cover_url || null)
  const [removeCover, setRemoveCover] = React.useState(false)
  const coverFileInputRef = React.useRef<HTMLInputElement>(null)

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file size (max 2MB)
      if (file.size > 2048 * 1024) {
        toast.error("Image size must be less than 2MB")
        return
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error("Please upload an image file")
        return
      }

      setAvatarFile(file)
      setRemoveAvatar(false)
      
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file size (max 5MB for cover)
      if (file.size > 5120 * 1024) {
        toast.error("Cover image size must be less than 5MB")
        return
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error("Please upload an image file")
        return
      }

      setCoverFile(file)
      setRemoveCover(false)
      
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setCoverPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveAvatar = () => {
    setAvatarFile(null)
    setAvatarPreview(null)
    setRemoveAvatar(true)
    if (avatarFileInputRef.current) {
      avatarFileInputRef.current.value = ""
    }
  }

  const handleRemoveCover = () => {
    setCoverFile(null)
    setCoverPreview(null)
    setRemoveCover(true)
    if (coverFileInputRef.current) {
      coverFileInputRef.current.value = ""
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const submitData = new FormData()
    submitData.append('name', formData.name)
    submitData.append('email', formData.email)
    submitData.append('role_id', formData.role_id)
    submitData.append('is_admin', formData.is_admin ? '1' : '0')
    submitData.append('description', formData.description)
    
    if (avatarFile) {
      submitData.append('avatar', avatarFile)
    }
    
    if (removeAvatar && !avatarFile) {
      submitData.append('remove_avatar', '1')
    }

    if (coverFile) {
      submitData.append('cover', coverFile)
    }
    
    if (removeCover && !coverFile) {
      submitData.append('remove_cover', '1')
    }

    router.post(route('admin.users.update', user.id), submitData, {
      onSuccess: () => {
        toast.success("User updated successfully")
        setOpen(false)
        onUpdate()
      },
      onError: (errors) => {
        const errorMessages = Object.values(errors).flat()
        toast.error(errorMessages[0] || "Failed to update user")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <IconEdit className="mr-2 h-4 w-4" />
          Edit User
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit User Profile</DialogTitle>
          <DialogDescription>
            Update user information, role, avatar and cover image
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 py-4">
            {/* Cover Image Section */}
            <div className="space-y-3">
              <Label>Profile Cover</Label>
              <div className="space-y-3">
                {coverPreview ? (
                  <div className="relative group rounded-lg overflow-hidden border-2 border-border">
                    <img
                      src={coverPreview}
                      alt="Cover preview"
                      className="w-full h-48 object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveCover}
                      className="absolute top-3 right-3 h-8 w-8 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-lg"
                    >
                      <IconX className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="w-full h-48 rounded-lg bg-muted flex items-center justify-center border-2 border-dashed border-border">
                    <div className="text-center">
                      <IconPhoto className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No cover image</p>
                    </div>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <input
                    ref={coverFileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/jpg,image/gif"
                    onChange={handleCoverChange}
                    className="hidden"
                    id="cover-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => coverFileInputRef.current?.click()}
                    className="flex-1"
                  >
                    <IconUpload className="mr-2 h-4 w-4" />
                    {coverPreview ? "Change Cover" : "Upload Cover"}
                  </Button>
                  {coverPreview && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveCover}
                      className="text-destructive hover:text-destructive"
                    >
                      <IconX className="mr-2 h-4 w-4" />
                      Remove
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG or GIF. Max size 5MB. Recommended: 1200x400px
                </p>
              </div>
            </div>

            {/* Avatar Section */}
            <div className="space-y-3">
              <Label>Profile Avatar</Label>
              <div className="flex items-start gap-4">
                <div className="relative">
                  {avatarPreview ? (
                    <div className="relative group">
                      <img
                        src={avatarPreview}
                        alt="Avatar preview"
                        className="h-24 w-24 rounded-full object-cover border-2 border-border"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      >
                        <IconX className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-border">
                      <IconUser className="h-10 w-10 text-muted-foreground" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 space-y-2">
                  <input
                    ref={avatarFileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/jpg,image/gif"
                    onChange={handleAvatarChange}
                    className="hidden"
                    id="avatar-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => avatarFileInputRef.current?.click()}
                    className="w-full"
                  >
                    <IconUpload className="mr-2 h-4 w-4" />
                    {avatarPreview ? "Change Avatar" : "Upload Avatar"}
                  </Button>
                  {avatarPreview && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveAvatar}
                      className="w-full text-destructive hover:text-destructive"
                    >
                      <IconX className="mr-2 h-4 w-4" />
                      Remove Avatar
                    </Button>
                  )}
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG or GIF. Max size 2MB.
                  </p>
                </div>
              </div>
            </div>

            {/* Name */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="col-span-3"
                placeholder="Enter full name"
              />
            </div>

            {/* Email */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="col-span-3"
                required
                placeholder="user@example.com"
              />
            </div>

            {/* Description */}
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="description" className="text-right pt-2">
                Bio
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="col-span-3 min-h-[100px] resize-none"
                placeholder="Write a short bio about this user..."
                maxLength={1000}
              />
              <div className="col-start-2 col-span-3 text-xs text-muted-foreground">
                {formData.description.length}/1000 characters
              </div>
            </div>

            {/* Role */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Role *
              </Label>
              <Select
                value={formData.role_id}
                onValueChange={(value) => setFormData({ ...formData, role_id: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id.toString()}>
                      <div className="flex items-center gap-2">
                        {role.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Admin Status */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="is_admin" className="text-right">
                Admin Access
              </Label>
              <div className="col-span-3 flex items-center space-x-2">
                <Checkbox
                  id="is_admin"
                  checked={formData.is_admin}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_admin: checked === true })}
                />
                <label htmlFor="is_admin" className="text-sm font-medium leading-none cursor-pointer">
                  Grant administrator privileges
                </label>
              </div>
            </div>

            {/* User Stats Info */}
            <div className="grid grid-cols-4 items-start gap-4 pt-4 border-t">
              <Label className="text-right text-muted-foreground">
                User Info
              </Label>
              <div className="col-span-3 space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Current Balance:</span>
                  <Badge variant="outline" className="font-mono">
                    {user.balance.toLocaleString()}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant={user.banned ? "destructive" : "outline"}>
                    {user.banned ? "Banned" : "Active"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Joined:</span>
                  <span className="text-foreground">
                    {new Date(user.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

const columns = (roles: any[], refreshData: () => void): ColumnDef<z.infer<typeof userSchema>>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(undefined)}
      >
        User
        {column.getIsSorted() && (
          <IconChevronDown
            className={`ml-2 h-4 w-4 ${column.getIsSorted() === "desc" ? "rotate-180" : ""}`}
          />
        )}
      </Button>
    ),
    cell: ({ row }) => {
      const user = row.original
      return (
        <div className="flex items-center gap-3">
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.name || user.email}
              className="h-10 w-10 rounded-full"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex flex-col">
            <span className="font-medium">{user.name || "No name"}</span>
            <span className="text-muted-foreground text-sm">{user.email}</span>
          </div>
        </div>
      )
    },
    enableHiding: false,
  },
  {
    accessorKey: "Telegram ID",
    header: ({ column }) => (
      <div className="text-center">
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          TG ID
          <IconChevronDown
            className={`ml-2 h-4 w-4 ${column.getIsSorted() === "desc" ? "rotate-180" : ""}`}
          />
        </Button>
      </div>
    ),
    cell: ({ row }) => (
      <div className="text-center">
        {row.original.telegram_id || "-"}
      </div>
    ),
  },
  {
    accessorKey: "role",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Role
        <IconChevronDown
          className={`ml-2 h-4 w-4 ${column.getIsSorted() === "desc" ? "rotate-180" : ""}`}
        />
      </Button>
    ),
    cell: ({ row }) => (
      <Badge variant="outline">
        {row.original.role?.name || "Guest"}
      </Badge>
    ),
    sortingFn: (rowA, rowB) => {
      const roleA = rowA.original.role?.name || "Guest"
      const roleB = rowB.original.role?.name || "Guest"
      return roleA.localeCompare(roleB)
    },
  },
  {
    accessorKey: "balance",
    header: ({ column }) => (
      <div className="text-center">
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Balance
          <IconChevronDown
            className={`ml-2 h-4 w-4 ${column.getIsSorted() === "desc" ? "rotate-180" : ""}`}
          />
        </Button>
      </div>
    ),
    cell: ({ row }) => (
      <div className="text-center font-medium">
        {row.original.balance.toLocaleString()}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Status
        <IconChevronDown
          className={`ml-2 h-4 w-4 ${column.getIsSorted() === "desc" ? "rotate-180" : ""}`}
        />
      </Button>
    ),
    cell: ({ row }) => {
      const user = row.original
      return (
        <Badge variant={user.banned ? "destructive" : "outline"}>
          {user.banned ? (
            <>Banned</>
          ) : (
            <>
              <IconCircleCheckFilled className="mr-1 h-3 w-3 fill-green-500" />
              Active 
              {!!user.is_admin && (
                <span className="ml-1 text-xs font-semibold text-yellow-500">(Admin)</span>
              )}
            </>
          )}
        </Badge>
      )
    },
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Joined
        <IconChevronDown
          className={`ml-2 h-4 w-4 ${column.getIsSorted() === "desc" ? "rotate-180" : ""}`}
        />
      </Button>
    ),
    cell: ({ row }) => {
      const date = new Date(row.original.created_at)
      return date.toLocaleDateString()
    },
    sortingFn: (rowA, rowB) => {
      return new Date(rowA.original.created_at).getTime() - new Date(rowB.original.created_at).getTime()
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const user = row.original

      const handleBan = () => {
        router.post(route('admin.users.ban', user.id), {}, {
          onSuccess: () => {
            toast.success("User banned successfully")
            refreshData()
          },
          onError: () => {
            toast.error("Failed to ban user")
          }
        })
      }

      const handleUnban = () => {
        router.post(route('admin.users.unban', user.id), {}, {
          onSuccess: () => {
            toast.success("User unbanned successfully")
            refreshData()
          },
          onError: () => {
            toast.error("Failed to unban user")
          }
        })
      }

      const handleDelete = () => {
        if (confirm("Are you sure you want to delete this user?")) {
          router.delete(route('admin.users.destroy', user.id), {
            onSuccess: () => {
              toast.success("User deleted successfully")
              refreshData()
            },
            onError: () => {
              toast.error("Failed to delete user")
            }
          })
        }
      }

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="data-[state=open]:bg-muted flex h-8 w-8 p-0"
              size="icon"
            >
              <IconDotsVertical className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <UserEditDialog user={user} roles={roles} onUpdate={refreshData} />
            <PasswordChangeDialog user={user} onUpdate={refreshData} />
            <BalanceUpdateDialog user={user} onUpdate={refreshData} />
            <DropdownMenuSeparator />
            {user.banned ? (
              <DropdownMenuItem onClick={handleUnban}>
                <IconCircleCheckFilled className="mr-2 h-4 w-4" />
                Unban User
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={handleBan}>
                <IconBan className="mr-2 h-4 w-4" />
                Ban User
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={handleDelete} className="text-red-600">
              <IconTrash className="mr-2 h-4 w-4" />
              Delete User
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

export function UsersDataTable({ data, roles, filters }: {
  data: any,
  roles: any[],
  filters: any
}) {
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [search, setSearch] = React.useState(filters.search || "")
  const [activeTab, setActiveTab] = React.useState(filters.tab || "all")

  // Handle search and tab changes
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      router.get(route('admin.users.index'), { search, tab: activeTab }, {
        preserveState: true,
        replace: true
      })
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [search, activeTab])

  // Handle sorting
  React.useEffect(() => {
    if (sorting.length > 0) {
      const sort = sorting[0]
      router.get(route('admin.users.index'), {
        search,
        tab: activeTab,
        sort_by: sort.id,
        sort_direction: sort.desc ? 'desc' : 'asc'
      }, {
        preserveState: true,
        replace: true
      })
    }
  }, [sorting])

  const refreshData = () => {
    router.reload()
  }

  const tableData = React.useMemo(() => data.data || [], [data])
  const pageCount = data.last_page || 1
  const currentPage = data.current_page || 1

  const table = useReactTable({
    data: tableData,
    columns: columns(roles, refreshData),
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    pageCount,
  })

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-col justify-start gap-6">
      <div className="flex items-center justify-between px-4 lg:px-6">
        <TabsList className="hidden md:flex">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="admins">Admins</TabsTrigger>
        </TabsList>

        <div className="flex items-center gap-2">
          <div className="relative">
            <IconSearch className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 w-52"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <IconLayoutColumns />
                <span className="hidden lg:inline">Columns</span>
                <IconChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {table
                .getAllColumns()
                .filter(
                  (column) =>
                    typeof column.accessorFn !== "undefined" &&
                    column.getCanHide()
                )
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>

          <AddUserDialog roles={roles} onUpdate={refreshData} />
        </div>
      </div>

      <TabsContent value="all" className="px-4 lg:px-6">
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="bg-muted sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id} colSpan={header.colSpan}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns(roles, refreshData).length}
                    className="h-24 text-center"
                  >
                    No users found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between px-4">
          <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>

          <div className="flex w-full items-center gap-8 lg:w-fit mt-2">
            <div className="flex w-fit items-center justify-center text-sm font-medium">
              Page {currentPage} of {pageCount}
            </div>

            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  router.get(
                    data.prev_page_url,
                    { search, sort_by: sorting[0]?.id, sort_direction: sorting[0]?.desc ? 'desc' : 'asc' },
                    {
                      preserveState: true,
                      preserveScroll: true,
                    },
                  );
                }}
                disabled={!data.prev_page_url}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  router.get(
                    data.next_page_url,
                    { search, sort_by: sorting[0]?.id, sort_direction: sorting[0]?.desc ? 'asc' : 'desc' },
                    {
                      preserveState: true,
                      preserveScroll: true,
                    },
                  );
                }}
                disabled={!data.next_page_url}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="users" className="px-4 lg:px-6">
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="bg-muted sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id} colSpan={header.colSpan}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns(roles, refreshData).length}
                    className="h-24 text-center"
                  >
                    No users found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between px-4">
          <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>

          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="flex w-fit items-center justify-center text-sm font-medium">
              Page {currentPage} of {pageCount}
            </div>

            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.get(data.prev_page_url)}
                disabled={!data.prev_page_url}
              >
                Previous
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => router.get(data.next_page_url)}
                disabled={!data.next_page_url}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="admins" className="px-4 lg:px-6">
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="bg-muted sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id} colSpan={header.colSpan}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns(roles, refreshData).length}
                    className="h-24 text-center"
                  >
                    No admins found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between px-4">
          <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>

          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="flex w-fit items-center justify-center text-sm font-medium">
              Page {currentPage} of {pageCount}
            </div>

            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.get(data.prev_page_url)}
                disabled={!data.prev_page_url}
              >
                Previous
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => router.get(data.next_page_url)}
                disabled={!data.next_page_url}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  )
}