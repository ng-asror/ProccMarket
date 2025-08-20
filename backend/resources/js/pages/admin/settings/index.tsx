import AppLayout from '../../../layouts/app-layout';
import { type BreadcrumbItem } from '../../../types';
import { Head, usePage } from '@inertiajs/react';
import { SettingsPage } from '../../../components/settings-page';

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Dashboard',
    href: '/',
  },
  {
    title: 'Settings',
    href: '/config',
  },
];

export default function SettingsIndex() {
  const { settings } = usePage().props;  
  
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="System Settings" />
      <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
        <SettingsPage 
          settings={settings}
        />
      </div>
    </AppLayout>
  );
}