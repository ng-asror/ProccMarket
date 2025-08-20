import AppLayout from '../../../layouts/app-layout';
import { type BreadcrumbItem } from '../../../types';
import { Head, usePage } from '@inertiajs/react';
import { UsersDataTable } from '../../../components/users-data-table';

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Dashboard',
    href: '/',
  },
  {
    title: 'Users',
    href: '/users',
  },
];

export default function UsersIndex() {
  const { users, roles, filters } = usePage().props;  
  
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Users Management" />
      <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
        <UsersDataTable 
          data={users} 
          roles={roles} 
          filters={filters} 
        />
      </div>
    </AppLayout>
  );
}