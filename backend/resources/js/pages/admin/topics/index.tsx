import AppLayout from '../../../layouts/app-layout';
import { type BreadcrumbItem } from '../../../types';
import { Head, usePage } from '@inertiajs/react';
import { TopicsDataTable } from '../../../components/topics-data-table';

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Dashboard',
    href: '/',
  },
  {
    title: 'Forum Topics',
    href: '/topics',
  },
];

export default function TopicsIndex() {
  const { topics, filters, sections, users } = usePage().props;  
  
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Forum Topics Management" />
      <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
        <TopicsDataTable 
          data={topics}
          filters={filters}
          sections={sections}
          users={users}
        />
      </div>
    </AppLayout>
  );
}