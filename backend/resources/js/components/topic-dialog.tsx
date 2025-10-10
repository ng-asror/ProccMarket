import * as React from 'react';
import { router } from '@inertiajs/react';
import { Switch } from '@/components/ui/switch';
import { ParentSectionSelector } from './parent-section-selector';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  IconEdit,
  IconPlus,
} from '@tabler/icons-react';
import { topicSchema, User } from '@/types/topic-types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { DropdownMenuItem } from './ui/dropdown-menu';
import { Button } from './ui/button';
import { Label } from '@/components/ui/label';
import { Input } from './ui/input';
import { RichTextEditor } from './rich-text-editor';




export function TopicDialog({
  topic,
  onUpdate,
  isEdit = false,
  sections,
  allSections,
  users
}: {
  topic?: z.infer<typeof topicSchema>;
  onUpdate: () => void;
  isEdit?: boolean;
  sections: any[];
  allSections: any[];
  users: User[];
}) {
  const [open, setOpen] = React.useState(false);
  const [formData, setFormData] = React.useState({
    section_id: topic?.section?.id || null,
    user_id: topic?.user?.id?.toString() || '',
    title: topic?.title || '',
    content: topic?.content || '',
    closed: topic?.closed || false,
  });
  const [imageFile, setImageFile] = React.useState<File | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const formDataToSend = new FormData();
    formDataToSend.append('section_id', formData.section_id?.toString() || '');
    formDataToSend.append('user_id', formData.user_id);
    formDataToSend.append('title', formData.title);
    formDataToSend.append('content', formData.content);
    formDataToSend.append('closed', formData.closed ? '1' : '0');

    if (imageFile) {
      formDataToSend.append('image', imageFile);
    }

    if (isEdit && topic) {
      formDataToSend.append('_method', 'PATCH');
      router.post(route('admin.topics.update', topic.id), formDataToSend, {
        onSuccess: () => {
          toast.success('Topic updated successfully');
          setOpen(false);
          onUpdate();
        },
        onError: (errors) => {
          toast.error('Failed to update topic');
        },
      });
    } else {
      router.post(route('admin.topics.store'), formDataToSend, {
        onSuccess: () => {
          toast.success('Topic created successfully');
          setOpen(false);
          setFormData({
            section_id: '',
            user_id: '',
            title: '',
            content: '',
            closed: false,
          });
          setImageFile(null);
          onUpdate();
        },
        onError: (errors) => {
          toast.error('Failed to create topic');
        },
      });
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEdit ? (
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <IconEdit className="mr-2 h-4 w-4" />
            Edit Topic
          </DropdownMenuItem>
        ) : (
          <Button size="sm">
            <IconPlus className="mr-2 h-4 w-4" />
            Add Topic
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl max-w-4xl max-h-[90vh] overflow-y-auto"
        onInteractOutside={(event) => {
            event.preventDefault();
        }}>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Topic' : 'Create New Topic'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <ParentSectionSelector
                  value={formData.section_id}
                  onChange={(val) => setFormData({ ...formData, section_id: val })}
                  allSections={allSections}
                  excludeId={topic?.section?.id}
                  root_level={true}
                />
                {/* <Select value={formData.section_id} onValueChange={(value) => setFormData({ ...formData, section_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select section" />
                  </SelectTrigger>
                  <SelectContent>
                    {sections.map((section) => (
                      <SelectItem key={section.id} value={section.id.toString()}>
                        {section.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select> */}
              </div>
              <div>
                <Label htmlFor="user_id">User</Label>


                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      {formData.user_id
                        ? users.find((u) => u.id.toString() === formData.user_id.toString())?.name || users.find((u) => u.id.toString() === formData.user_id.toString())?.email
                        : "Select user"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0" onWheel={(e) => e.stopPropagation()}>
                    <Command>
                      <CommandInput placeholder="Search user..." />
                      <CommandList>
                        {users.map((user) => (
                          <CommandItem
                            key={user.id}
                            value={`${user.name?.toLowerCase()} ${user.email?.toLowerCase()} ${user.telegram_id}`}
                            onSelect={() => setFormData({ ...formData, user_id: user.id.toString() })}
                          >
                            <div className="flex items-center">
                              <Avatar className="h-6 w-6 mr-2">
                                <AvatarImage src={user.avatar || undefined} />
                                <AvatarFallback>{user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              {user.name || user.email || user.telegram_id}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="content">Content</Label>
              <RichTextEditor
                    value={formData.content}
                    onChange={(value) => setFormData({ ...formData, content: value })}
                />
            </div>

            <div>
              <Label htmlFor="image">Image</Label>
              <Input
                id="image"
                type="file"
                onChange={handleImageChange}
                accept="image/*"
              />
            </div>

            {isEdit && topic?.image && (
              <div>
                <Label>Current Image</Label>
                <img
                  src={(topic.image?.startsWith('http://') || topic.image?.startsWith('https://') ? topic.image : topic.image_url) || undefined}
                  alt={topic.title}
                  className="h-32 w-32 object-cover rounded-md mt-2"
                />
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Switch
                id="closed"
                checked={formData.closed}
                onCheckedChange={(checked) => setFormData({ ...formData, closed: checked })}
              />
              <Label htmlFor="closed">Closed</Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="submit">{isEdit ? 'Save Changes' : 'Create Topic'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}