import * as React from 'react';
import { IconSearch, IconX, IconChevronRight } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

type Section = {
  id: number;
  name: string;
  parent_id: number | null;
};

type ParentSectionSelectorProps = {
  value: number | null;
  onChange: (value: number | null) => void;
  allSections: Section[];
  excludeId?: number;
  disabled?: boolean;
  root_level?: boolean;
};

export function ParentSectionSelector({
  value,
  onChange,
  allSections,
  excludeId,
  disabled = false,
  root_level = false
}: ParentSectionSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');

  // Filter sections
  const filteredSections = React.useMemo(() => {
    let sections = allSections.filter((s) => s.id !== excludeId);
    
    if (searchQuery) {
      sections = sections.filter((s) =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return sections;
  }, [allSections, excludeId, searchQuery]);

  // Build tree structure
  const buildTree = (sections: Section[], parentId: number | null = null): any[] => {
    return sections
      .filter((s) => s.parent_id === parentId)
      .map((section) => ({
        ...section,
        children: buildTree(sections, section.id),
      }));
  };

  const sectionTree = React.useMemo(
    () => buildTree(filteredSections),
    [filteredSections]
  );

  // Find selected section
  const selectedSection = allSections.find((s) => s.id === value);

  // Get breadcrumb path
  const getBreadcrumbPath = (sectionId: number | null): string => {
    if (!sectionId) return 'None (Root Level)';
    
    const path: string[] = [];
    let currentId: number | null = sectionId;
    
    while (currentId) {
      const section = allSections.find((s) => s.id === currentId);
      if (section) {
        path.unshift(section.name);
        currentId = section.parent_id;
      } else {
        break;
      }
    }
    
    return path.join(' › ') || 'Unknown';
  };

  // Render tree item
  const TreeItem = ({
    section,
    level = 0,
  }: {
    section: any;
    level?: number;
  }) => (
    <div>
      <button
        type="button"
        onClick={() => {
          onChange(section.id);
          setOpen(false);
          setSearchQuery('');
        }}
        className={cn(
          'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent',
          value === section.id && 'bg-accent'
        )}
        style={{ paddingLeft: `${level * 1.5 + 0.5}rem` }}
      >
        {section.children?.length > 0 && (
          <IconChevronRight className="h-3 w-3 text-muted-foreground" />
        )}
        <span className="flex-1 text-left">{section.name}</span>
      </button>
      {section.children?.map((child: any) => (
        <TreeItem key={child.id} section={child} level={level + 1} />
      ))}
    </div>
  );

  return (
    <div className="space-y-2">
      <Label>Parent Section</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled}
          >
            <span className="truncate">
              {getBreadcrumbPath(value)}
            </span>
            {value && (
              <IconX
                className="ml-2 h-4 w-4 shrink-0 opacity-50"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(null);
                }}
              />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <div className="flex items-center border-b px-3">
            <IconSearch className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Input
              placeholder="Search sections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
          <ScrollArea className="h-[300px]">
            <div className="p-2">
              <button
                type="button"
                onClick={() => {
                  onChange(null);
                  setOpen(false);
                  setSearchQuery('');
                }}
                className={cn(
                  'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent',
                  value === null && 'bg-accent'
                )}
              >
                <span className="flex-1 text-left font-medium">
                  None (Root Level)
                </span>
              </button>
              <div className="my-2 border-t" />
              {sectionTree.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  No sections found
                </div>
              ) : (
                sectionTree.map((section) => (
                  <TreeItem key={section.id} section={section} />
                ))
              )}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
      {value && (
        <p className="text-xs text-muted-foreground">
          Full path: {getBreadcrumbPath(value)}
        </p>
      )}
    </div>
  );
}