import AppLayout from '../../../layouts/app-layout';
import { type BreadcrumbItem } from '../../../types';
import { Head, usePage } from '@inertiajs/react';
import { SectionsDataTable } from '../../../components/sections-data-table';

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Dashboard',
    href: '/',
  },
  {
    title: 'Forum Sections',
    href: '/sections',
  },
];

export default function SectionsIndex() {
  const { sections, filters, roles } = usePage().props;  
  
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Forum Sections Management" />
      <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
        <SectionsDataTable 
          data={sections}
          filters={filters}
          roles={roles}
        />
      </div>
    </AppLayout>
  );
}