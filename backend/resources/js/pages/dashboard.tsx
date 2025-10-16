import { BannerCarousel } from '@/components/banner-carousel';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

interface Banner {
  id: number
  title: string
  description: string | null
  image_url: string
  link: string | null
}

interface HomePageProps {
  banners: Banner[]
}

export default function Dashboard() {
    const { banners } = usePage<HomePageProps>().props

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">

                {banners && banners.length > 0 && (
                    <section className="w-full">
                    <BannerCarousel banners={banners} autoPlayInterval={5000} />
                    </section>
                )}
            </div>
        </AppLayout>
    );
}
