import AppLayout from '../../../layouts/app-layout';
import { type BreadcrumbItem } from '../../../types';
import { Head, usePage } from '@inertiajs/react';
import { WithdrawalsDataTable } from '../../../components/withdrawal-detail';

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Dashboard',
    href: '/',
  },
  {
    title: 'Withdrawals',
    href: '/withdrawals',
  },
];


export default function WithdrawalIndex() {
  const { withdrawals, stats, filters } = usePage().props;  
  
  
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Withdrawals Management" />
      <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
        <WithdrawalsDataTable 
          data={withdrawals} 
          stats={stats} 
          filters={filters}
        />
      </div>
    </AppLayout>
  );
}