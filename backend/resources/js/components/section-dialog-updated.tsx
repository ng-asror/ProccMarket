import * as React from 'react';
import { IconEdit, IconPlus } from '@tabler/icons-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { router } from '@inertiajs/react';
import { Section, Role } from '@/types/section-types';
import { RoleMultiSelect } from './role-multi-select';
import { ParentSectionSelector } from './parent-section-selector';

type SectionDialogProps = {
  section?: Section;
  onUpdate: () => void;
  isEdit?: boolean;
  roles: Role[];
  allSections: any[];
};

export function SectionDialog({
  section,
  onUpdate,
  isEdit = false,
  roles,
  allSections,
}: SectionDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: section?.name || '',
    description: section?.description || '',
    access_price: section?.access_price?.toString() || '0',
    default_roles: section?.default_roles || [],
    parent_id: section?.parent_id || null,
  });
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (section && isEdit) {
      setFormData({
        name: section.name,
        description: section.description || '',
        access_price: section.access_price.toString(),
        default_roles: section.default_roles || [],
        parent_id: section.parent_id || null,
      });
      setImagePreview(section.image_url || null);
    }
  }, [section, isEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate SVG file
    if (imageFile && !imageFile.name.toLowerCase().endsWith('.svg')) {
      toast.error('Only SVG files are allowed');
      return;
    }

    // Validate access price
    const price = parseFloat(formData.access_price);
    if (isNaN(price) || price < 0) {
      toast.error('Please enter a valid access price');
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append('name', formData.name.trim());
    formDataToSend.append('description', formData.description.trim());
    formDataToSend.append('access_price', price.toString());
    
    if (formData.parent_id !== null) {
      formDataToSend.append('parent_id', formData.parent_id.toString());
    }

    // Append default roles
    if (formData.default_roles.length > 0) {
      formData.default_roles.forEach((roleId) => {
        formDataToSend.append('default_roles[]', roleId.toString());
      });
    }

    // Append image file
    if (imageFile) {
      formDataToSend.append('image', imageFile);
    }

    if (isEdit && section) {
      formDataToSend.append('_method', 'PATCH');
      router.post(route('admin.sections.update', section.id), formDataToSend, {
        forceFormData: true,
        onSuccess: () => {
          toast.success('Section updated successfully');
          setOpen(false);
          onUpdate();
        },
        onError: (errors) => {
          const errorMessages = Object.values(errors).flat();
          toast.error(errorMessages[0] as string || 'Failed to update section');
        },
      });
    } else {
      router.post(route('admin.sections.store'), formDataToSend, {
        forceFormData: true,
        onSuccess: () => {
          toast.success('Section created successfully');
          setOpen(false);
          // Reset form
          setFormData({
            name: '',
            description: '',
            access_price: '0',
            default_roles: [],
            parent_id: null,
          });
          setImageFile(null);
          setImagePreview(null);
          onUpdate();
        },
        onError: (errors) => {
          const errorMessages = Object.values(errors).flat();
          toast.error(errorMessages[0] as string || 'Failed to create section');
        },
      });
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check if file is SVG
      if (!file.name.toLowerCase().endsWith('.svg')) {
        toast.error('Only SVG files are allowed');
        e.target.value = '';
        return;
      }

      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('File size must be less than 2MB');
        e.target.value = '';
        return;
      }

      setImageFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    const fileInput = document.getElementById('image') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEdit ? (
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <IconEdit className="mr-2 h-4 w-4" />
            Edit Section
          </DropdownMenuItem>
        ) : (
          <Button size="sm">
            <IconPlus className="mr-2 h-4 w-4" />
            Add Section
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Edit Section' : 'Create New Section'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Name Field */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="col-span-3"
                placeholder="Enter section name"
                required
              />
            </div>

            {/* Parent Section Field */}
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-3">
                Parent Section
              </Label>
              <div className="col-span-3">
                <ParentSectionSelector
                  value={formData.parent_id}
                  onChange={(value) =>
                    setFormData({ ...formData, parent_id: value })
                  }
                  allSections={allSections}
                  excludeId={section?.id}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Leave empty to create a root-level section
                </p>
              </div>
            </div>

            {/* Description Field */}
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="description" className="text-right pt-2">
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="col-span-3"
                placeholder="Enter section description (optional)"
                rows={3}
              />
            </div>

            {/* Access Price Field */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="access_price" className="text-right">
                Access Price <span className="text-red-500">*</span>
              </Label>
              <div className="col-span-3">
                <Input
                  id="access_price"
                  type="number"
                  value={formData.access_price}
                  onChange={(e) =>
                    setFormData({ ...formData, access_price: e.target.value })
                  }
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Set to 0 for free access
                </p>
              </div>
            </div>

            {/* Free Access Roles Field */}
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="default_roles" className="text-right pt-3">
                Free Access Roles
              </Label>
              <div className="col-span-3">
                <RoleMultiSelect
                  value={formData.default_roles}
                  onChange={(val) =>
                    setFormData({ ...formData, default_roles: val })
                  }
                  roles={roles}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Users with these roles get free access regardless of price
                </p>
                {formData.default_roles.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {formData.default_roles.map((id) => {
                      const role = roles.find((r) => r.id === id);
                      return role ? (
                        <Badge key={id} variant="secondary" className="text-sm">
                          {role.name}
                          {role.users_count !== undefined &&
                            ` (${role.users_count} users)`}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Image Upload Field */}
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="image" className="text-right pt-2">
                Image (SVG)
              </Label>
              <div className="col-span-3 space-y-2">
                <Input
                  id="image"
                  type="file"
                  onChange={handleImageChange}
                  accept=".svg"
                />
                <p className="text-xs text-muted-foreground">
                  Only SVG files are allowed (max 2MB)
                </p>
                
                {/* Image Preview */}
                {(imagePreview || (isEdit && section?.image_url && !imageFile)) && (
                  <div className="flex items-center gap-3 p-3 border rounded-md bg-muted/50">
                    <img
                      src={imagePreview || section?.image_url || ''}
                      alt="Preview"
                      className="h-16 w-16 object-contain rounded border bg-white"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {imageFile ? imageFile.name : 'Current image'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {imageFile 
                          ? `${(imageFile.size / 1024).toFixed(2)} KB`
                          : 'Uploaded image'}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveImage}
                    >
                      Remove
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {isEdit ? 'Save Changes' : 'Create Section'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}