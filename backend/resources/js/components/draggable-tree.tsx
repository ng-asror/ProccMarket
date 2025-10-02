import * as React from 'react';
import {
  IconChevronDown,
  IconChevronRight,
  IconDotsVertical,
  IconGripVertical,
  IconTrash,
  IconEdit,
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { router } from '@inertiajs/react';
import { Section, Role } from '@/types/section-types';
import { SectionDialog } from './section-dialog-updated';
import { cn } from '@/lib/utils';

type DraggableTreeProps = {
  sections: Section[];
  roles: Role[];
  allSections: any[];
  onUpdate: () => void;
};

type TreeItemProps = {
  section: Section;
  level: number;
  roles: Role[];
  allSections: any[];
  onUpdate: () => void;
  onDragStart: (section: Section) => void;
  onDragOver: (e: React.DragEvent, section: Section | null) => void;
  onDrop: (e: React.DragEvent, targetSection: Section | null) => void;
  isDragging: boolean;
};

function TreeItem({
  section,
  level,
  roles,
  allSections,
  onUpdate,
  onDragStart,
  onDragOver,
  onDrop,
  isDragging,
}: TreeItemProps) {
  const [isExpanded, setIsExpanded] = React.useState(true);
  const hasChildren = section.children && section.children.length > 0;

  const handleDelete = () => {
    const childrenCount = section.children?.length || 0;
    const topicsCount = section.topics_count || 0;

    let message = 'Are you sure you want to delete this section?';
    if (childrenCount > 0) {
      message += ` This will also delete ${childrenCount} subsection${childrenCount > 1 ? 's' : ''}.`;
    }
    if (topicsCount > 0) {
      toast.error(
        `Cannot delete section with topics. Please remove all ${topicsCount} topics first.`
      );
      return;
    }

    if (confirm(message)) {
      router.delete(route('admin.sections.destroy', section.id), {
        onSuccess: () => {
          toast.success('Section deleted successfully');
          onUpdate();
        },
        onError: (errors) => {
          const errorMessages = Object.values(errors).flat();
          toast.error(errorMessages[0] || 'Failed to delete section');
        },
      });
    }
  };

  return (
    <div>
      <div
        draggable
        onDragStart={(e) => {
          e.dataTransfer.effectAllowed = 'move';
          onDragStart(section);
        }}
        onDragOver={(e) => onDragOver(e, section)}
        onDrop={(e) => onDrop(e, section)}
        className={cn(
          'group flex items-center gap-2 rounded-md border bg-card p-2 mb-2 hover:bg-accent/50 transition-colors',
          isDragging && 'opacity-50'
        )}
        style={{ marginLeft: `${level * 2}rem` }}
      >
        <div className="flex items-center gap-1 flex-shrink-0">
          <IconGripVertical className="h-4 w-4 text-muted-foreground cursor-grab active:cursor-grabbing" />
          {hasChildren && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <IconChevronDown className="h-4 w-4" />
              ) : (
                <IconChevronRight className="h-4 w-4" />
              )}
            </Button>
          )}
          {!hasChildren && <div className="w-6" />}
        </div>

        {section.image_url && (
          <img
            src={section.image_url}
            alt={section.name}
            className="h-8 w-8 object-contain rounded"
          />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{section.name}</span>
            {section.access_price > 0 && (
              <Badge variant="secondary" className="text-xs">
                ${section.access_price}
              </Badge>
            )}
          </div>
          {section.description && (
            <p className="text-sm text-muted-foreground truncate">
              {section.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {section.topics_count !== undefined && (
            <Badge variant="outline" className="text-xs">
              {section.topics_count} topics
            </Badge>
          )}
          {section.users_count !== undefined && (
            <Badge variant="outline" className="text-xs">
              {section.users_count} users
            </Badge>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <IconDotsVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <SectionDialog
                section={section}
                onUpdate={onUpdate}
                isEdit={true}
                roles={roles}
                allSections={allSections}
              />
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-red-600"
              >
                <IconTrash className="mr-2 h-4 w-4" />
                Delete Section
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div>
          {section.children?.map((child) => (
            <TreeItem
              key={child.id}
              section={child}
              level={level + 1}
              roles={roles}
              allSections={allSections}
              onUpdate={onUpdate}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDrop={onDrop}
              isDragging={isDragging}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function DraggableTree({
  sections,
  roles,
  allSections,
  onUpdate,
}: DraggableTreeProps) {
  const [draggedSection, setDraggedSection] = React.useState<Section | null>(
    null
  );
  const [dropTarget, setDropTarget] = React.useState<{
    section: Section | null;
    position: 'before' | 'after' | 'inside';
  } | null>(null);

  const handleDragStart = (section: Section) => {
    setDraggedSection(section);
  };

  const handleDragOver = (e: React.DragEvent, section: Section | null) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!draggedSection || draggedSection.id === section?.id) return;

    // Determine drop position based on mouse position
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const y = e.clientY - rect.top;
    const height = rect.height;

    let position: 'before' | 'after' | 'inside' = 'inside';
    
    if (y < height * 0.25) {
      position = 'before';
    } else if (y > height * 0.75) {
      position = 'after';
    }

    setDropTarget({ section, position });
  };

  const handleDrop = (e: React.DragEvent, targetSection: Section | null) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedSection) return;

    // Prevent dropping on itself or its descendants
    if (targetSection && isDescendant(draggedSection, targetSection)) {
      toast.error('Cannot move a section into its own subsection');
      setDraggedSection(null);
      setDropTarget(null);
      return;
    }

    // Calculate new position and parent
    let newParentId: number | null = null;
    let newPosition = 0;

    if (!targetSection) {
      // Dropped in root area
      newParentId = null;
      newPosition = sections.length;
    } else if (dropTarget?.position === 'inside') {
      // Dropped inside a section
      newParentId = targetSection.id;
      newPosition = targetSection.children?.length || 0;
    } else {
      // Dropped before/after a section
      newParentId = targetSection.parent_id;
      const siblings = getSiblings(sections, newParentId);
      const targetIndex = siblings.findIndex((s) => s.id === targetSection.id);
      newPosition =
        dropTarget?.position === 'before' ? targetIndex : targetIndex + 1;
    }

    // Update section position
    updateSectionPosition(draggedSection.id, newParentId, newPosition);

    setDraggedSection(null);
    setDropTarget(null);
  };

  const isDescendant = (parent: Section, child: Section): boolean => {
    if (parent.id === child.id) return true;
    if (!parent.children) return false;
    return parent.children.some((c) => isDescendant(c, child));
  };

  const getSiblings = (
    sectionsList: Section[],
    parentId: number | null
  ): Section[] => {
    const findSiblings = (sections: Section[]): Section[] => {
      const result: Section[] = [];
      for (const section of sections) {
        if (section.parent_id === parentId) {
          result.push(section);
        }
        if (section.children) {
          result.push(...findSiblings(section.children));
        }
      }
      return result;
    };
    return findSiblings(sectionsList);
  };

  const updateSectionPosition = (
    sectionId: number,
    newParentId: number | null,
    newPosition: number
  ) => {
    // Flatten all sections
    const allSectionsList = flattenSections(sections);
    
    // Reorder sections
    const updatedSections = allSectionsList.map((s) => {
      if (s.id === sectionId) {
        return { ...s, parent_id: newParentId, position: newPosition };
      }
      // Adjust positions of siblings
      if (s.parent_id === newParentId && s.id !== sectionId) {
        if (s.position >= newPosition) {
          return { ...s, position: s.position + 1 };
        }
      }
      return s;
    });

    // Send update to server
    const sectionsData = updatedSections.map((s) => ({
      id: s.id,
      parent_id: s.parent_id,
      position: s.position,
    }));

    router.post(
      route('admin.sections.update-positions'),
      { sections: sectionsData },
      {
        onSuccess: () => {
          toast.success('Section moved successfully');
          onUpdate();
        },
        onError: () => {
          toast.error('Failed to update section position');
        },
      }
    );
  };

  const flattenSections = (sectionsList: Section[]): Section[] => {
    const result: Section[] = [];
    const flatten = (sections: Section[]) => {
      for (const section of sections) {
        result.push(section);
        if (section.children) {
          flatten(section.children);
        }
      }
    };
    flatten(sectionsList);
    return result;
  };

  return (
    <div
      className="space-y-2"
      onDragOver={(e) => handleDragOver(e, null)}
      onDrop={(e) => handleDrop(e, null)}
    >
      {sections.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No sections found. Create your first section to get started.
        </div>
      ) : (
        sections.map((section) => (
          <TreeItem
            key={section.id}
            section={section}
            level={0}
            roles={roles}
            allSections={allSections}
            onUpdate={onUpdate}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            isDragging={draggedSection?.id === section.id}
          />
        ))
      )}
    </div>
  );
}