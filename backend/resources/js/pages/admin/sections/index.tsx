import * as React from 'react';
import { IconSearch } from '@tabler/icons-react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage, router } from '@inertiajs/react';
import { Input } from '@/components/ui/input';
import { DraggableTree } from '@/components/draggable-tree';
import { SectionDialog } from '@/components/section-dialog-updated';
import { Section, Role } from '@/types/section-types';

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Dashboard',
    href: '/',
  },
  {
    title: 'Forum Sections',
    href: '/admin/sections',
  },
];

type PageProps = {
  sections: Section[];
  allSections: any[];
  roles: Role[];
  filters: {
    search?: string;
  };
};

export default function SectionsIndex() {
  const { sections, allSections, roles, filters } = usePage<PageProps>().props;
  const [search, setSearch] = React.useState(filters.search || '');

  // Debounced search
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      router.get(
        route('admin.sections.index'),
        { search },
        {
          preserveState: true,
          replace: true,
        }
      );
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [search]);

  const refreshData = () => {
    router.reload();
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Forum Sections Management" />
      <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4 lg:p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              Forum Sections
            </h2>
            <p className="text-muted-foreground">
              Manage forum sections and organize them hierarchically
            </p>
          </div>
          <SectionDialog
            onUpdate={refreshData}
            roles={roles}
            allSections={allSections}
          />
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search sections..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Instructions */}
        <div className="rounded-lg border bg-muted/50 p-4">
          <h3 className="font-semibold mb-2">How to organize sections:</h3>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Drag and drop sections to reorder them</li>
            <li>Drop a section inside another to make it a subsection</li>
            <li>Drop before or after a section to change its position</li>
            <li>Deleting a parent section will delete all its subsections</li>
            <li>Only SVG images are supported for section icons</li>
          </ul>
        </div>

        {/* Draggable Tree */}
        <div className="rounded-lg border bg-card p-6">
          <DraggableTree
            sections={sections}
            roles={roles}
            allSections={allSections}
            onUpdate={refreshData}
          />
        </div>
      </div>
    </AppLayout>
  );
}