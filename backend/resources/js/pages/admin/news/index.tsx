import { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ChevronDown, ChevronUp, Plus, Edit, Trash2, Eye, MessageSquare, ThumbsUp, Share2, Search, X } from 'lucide-react';
import { useForm } from '@inertiajs/react';
import { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Dashboard',
    href: '/',
  },
  {
    title: 'News Management',
    href: '/news',
  },
];

interface Category {
    id: number;
    name: string;
    news_count: number;
}

interface News {
    id: number;
    title: string;
    description: string;
    image_url: string | null;
    status: string;
    created_at: string;
    category: Category;
    user: { name: string };
    comments_count: number;
    likes_count: number;
    views_count: number;
    shares_count: number;
}

interface Props {
    categories: Category[];
    news: {
        data: News[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        links: { url: string | null; label: string; active: boolean }[];
    };
    selectedCategory: number | null;
    filters: {
        search: string | null;
        status: string | null;
    };
}

export default function Index({ categories, news, selectedCategory, filters }: Props) {
    const [openCategories, setOpenCategories] = useState<number[]>([]);
    const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: number | null; type: 'news' | 'category' }>({ open: false, id: null, type: 'news' });
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');

    const categoryForm = useForm({ name: '' });

    const toggleCategory = (categoryId: number) => {
        const isCurrentlyOpen = openCategories.includes(categoryId);
        
        if (isCurrentlyOpen) {
            setOpenCategories([]);
        } else {
            setOpenCategories([categoryId]);
            router.get(route('news.index'), { category: categoryId }, { preserveState: true });
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('news.index'), { 
            search: searchQuery,
            status: statusFilter || undefined,
        }, { 
            preserveState: true,
            replace: true,
        });
    };

    const handleStatusChange = (value: string) => {
        value = value === 'all' ? '' : value;
        setStatusFilter(value);
        router.get(route('news.index'), { 
            search: searchQuery || undefined,
            status: value || undefined,
        }, { 
            preserveState: true,
            replace: true,
        });
    };

    const clearFilters = () => {
        setSearchQuery('');
        setStatusFilter('');
        router.get(route('news.index'), {}, { preserveState: true });
    };

    const handleCategorySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        categoryForm.post(route('categories.store'), {
            onSuccess: () => {
                categoryForm.reset();
                setCategoryDialogOpen(false);
            },
        });
    };

    const handleDelete = () => {
        if (deleteDialog.id) {
            if (deleteDialog.type === 'news') {
                router.delete(route('news.destroy', deleteDialog.id), {
                    preserveState: true,
                    preserveScroll: true,
                });
            } else {
                router.delete(route('categories.destroy', deleteDialog.id));
            }
        }
        setDeleteDialog({ open: false, id: null, type: 'news' });
    };

    const hasActiveFilters = filters.search || filters.status;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="News Management" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
                        <h1 className="text-3xl py-2 font-bold text-gray-900 dark:text-gray-100">News Management</h1>
                        <div className="flex gap-3">
                            <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" className="gap-2">
                                        <Plus className="h-4 w-4" />
                                        Add Category
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <form onSubmit={handleCategorySubmit}>
                                        <DialogHeader>
                                            <DialogTitle>Create New Category</DialogTitle>
                                            <DialogDescription>Add a new category for organizing news articles.</DialogDescription>
                                        </DialogHeader>
                                        <div className="grid gap-4 py-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="name">Category Name</Label>
                                                <Input
                                                    id="name"
                                                    value={categoryForm.data.name}
                                                    onChange={e => categoryForm.setData('name', e.target.value)}
                                                    placeholder="Enter category name"
                                                />
                                                {categoryForm.errors.name && (
                                                    <p className="text-sm text-red-500">{categoryForm.errors.name}</p>
                                                )}
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button type="submit" disabled={categoryForm.processing}>
                                                Create Category
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>

                            <Link href={route('news.create')}>
                                <Button className="gap-2">
                                    <Plus className="h-4 w-4" />
                                    Add News
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Search and Filter Section */}
                    <Card className="mb-6">
                        <CardContent>
                            <form onSubmit={handleSearch} className="flex flex-col gap-4 sm:flex-row sm:items-end">
                                <div className="flex-1">
                                    <Label htmlFor="search">Search</Label>
                                    <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="search"
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        placeholder="Search by title or description..."
                                        className="pl-10"
                                    />
                                    </div>
                                </div>

                                <div className="w-full sm:w-48">
                                    <Label htmlFor="status">Status</Label>
                                    <Select value={statusFilter} onValueChange={handleStatusChange}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="draft">Draft</SelectItem>
                                        <SelectItem value="published">Published</SelectItem>
                                    </SelectContent>
                                    </Select>
                                </div>

                                <Button type="submit" className="w-full sm:w-auto">Search</Button>

                                {hasActiveFilters && (
                                    <Button type="button" variant="outline" onClick={clearFilters} className="w-full sm:w-auto">
                                    <X className="h-4 w-4 mr-2" />
                                    Clear
                                    </Button>
                                )}
                            </form>
                        </CardContent>
                    </Card>

                    {/* Results when searching */}
                    {hasActiveFilters && (
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                                    Search Results ({news.total} found)
                                </h2>
                            </div>
                            
                            {news.data.length > 0 ? (
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {news.data.map(item => (
                                        <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                                            {item.image_url && (
                                                <img src={item.image_url} alt={item.title} className="w-full h-48 object-cover" />
                                            )}
                                            <CardHeader>
                                                <div className="flex items-start justify-between gap-2">
                                                    <CardTitle className="text-lg line-clamp-2">{item.title}</CardTitle>
                                                    <Badge variant={item.status === 'published' ? 'default' : 'secondary'}>
                                                        {item.status}
                                                    </Badge>
                                                </div>
                                                <CardDescription className="line-clamp-3" dangerouslySetInnerHTML={{ __html: item.description }} />
                                                <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                                    Category: {item.category.name}
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="flex gap-4 text-sm text-gray-500 dark:text-gray-400">
                                                    <span className="flex items-center gap-1">
                                                        <Eye className="h-4 w-4" />
                                                        {item.views_count}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <MessageSquare className="h-4 w-4" />
                                                        {item.comments_count}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <ThumbsUp className="h-4 w-4" />
                                                        {item.likes_count}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Share2 className="h-4 w-4" />
                                                        {item.shares_count}
                                                    </span>
                                                </div>
                                            </CardContent>
                                            <CardFooter className="flex justify-between gap-2">
                                                <Link href={route('news.edit', item.id)} className="flex-1">
                                                    <Button variant="outline" size="sm" className="w-full gap-2">
                                                        <Edit className="h-4 w-4" />
                                                        Edit
                                                    </Button>
                                                </Link>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="gap-2 text-red-500 hover:text-red-700"
                                                    onClick={() => setDeleteDialog({ open: true, id: item.id, type: 'news' })}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                    Delete
                                                </Button>
                                            </CardFooter>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <Card>
                                    <CardContent className="py-12 text-center text-gray-500 dark:text-gray-400">
                                        No results found for your search.
                                    </CardContent>
                                </Card>
                            )}

                            {news.last_page > 1 && (
                                <div className="flex justify-center gap-2 mt-6">
                                    {news.links.map((link, index) => {
                                        if (!link.url) {
                                            return (
                                                <Button
                                                    key={index}
                                                    variant="outline"
                                                    size="sm"
                                                    disabled
                                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                                />
                                            );
                                        }
                                        
                                        const url = new URL(link.url);
                                        const page = url.searchParams.get('page');
                                        
                                        return (
                                            <Button
                                                key={index}
                                                variant={link.active ? 'default' : 'outline'}
                                                size="sm"
                                                onClick={() => router.get(
                                                    route('news.index'),
                                                    { 
                                                        search: searchQuery || undefined,
                                                        status: statusFilter || undefined,
                                                        page: page 
                                                    },
                                                    { preserveState: true }
                                                )}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Categories View - only show when not searching */}
                    {!hasActiveFilters && (
                        <div className="space-y-4">
                            {categories.map(category => (
                                <Card key={category.id} className="overflow-hidden">
                                    <Collapsible
                                        open={openCategories.includes(category.id)}
                                        onOpenChange={() => toggleCategory(category.id)}
                                    >
                                        <CollapsibleTrigger className="w-full">
                                            <CardHeader className="flex flex-row items-center justify-between cursor-pointer transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <CardTitle className="text-xl">{category.name}</CardTitle>
                                                    <Badge variant="secondary">{category.news_count} articles</Badge>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setDeleteDialog({ open: true, id: category.id, type: 'category' });
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                    </div>
                                                    {openCategories.includes(category.id) ? (
                                                        <ChevronUp className="h-5 w-5" />
                                                    ) : (
                                                        <ChevronDown className="h-5 w-5" />
                                                    )}
                                                </div>
                                            </CardHeader>
                                        </CollapsibleTrigger>

                                        <CollapsibleContent>
                                            <CardContent className="pt-0">
                                                {selectedCategory == category.id && news.data.length > 0 ? (
                                                    <>
                                                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                                            {news.data.map(item => (
                                                                <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                                                                    {item.image_url && (
                                                                        <img src={item.image_url} alt={item.title} className="w-full h-48 object-cover" />
                                                                    )}
                                                                    <CardHeader>
                                                                        <div className="flex items-start justify-between gap-2">
                                                                            <CardTitle className="text-lg line-clamp-2">{item.title}</CardTitle>
                                                                            <Badge variant={item.status === 'published' ? 'default' : 'secondary'}>
                                                                                {item.status}
                                                                            </Badge>
                                                                        </div>
                                                                        <CardDescription className="line-clamp-3" dangerouslySetInnerHTML={{ __html: item.description }} />
                                                                    </CardHeader>
                                                                    <CardContent>
                                                                        <div className="flex gap-4 text-sm text-gray-500 dark:text-gray-400">
                                                                            <span className="flex items-center gap-1">
                                                                                <Eye className="h-4 w-4" />
                                                                                {item.views_count}
                                                                            </span>
                                                                            <span className="flex items-center gap-1">
                                                                                <MessageSquare className="h-4 w-4" />
                                                                                {item.comments_count}
                                                                            </span>
                                                                            <span className="flex items-center gap-1">
                                                                                <ThumbsUp className="h-4 w-4" />
                                                                                {item.likes_count}
                                                                            </span>
                                                                            <span className="flex items-center gap-1">
                                                                                <Share2 className="h-4 w-4" />
                                                                                {item.shares_count}
                                                                            </span>
                                                                        </div>
                                                                    </CardContent>
                                                                    <CardFooter className="flex justify-between gap-2">
                                                                        <Link href={route('news.edit', item.id)} className="flex-1">
                                                                            <Button variant="outline" size="sm" className="w-full gap-2">
                                                                                <Edit className="h-4 w-4" />
                                                                                Edit
                                                                            </Button>
                                                                        </Link>
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            className="gap-2 text-red-500 hover:text-red-700"
                                                                            onClick={() => setDeleteDialog({ open: true, id: item.id, type: 'news' })}
                                                                        >
                                                                            <Trash2 className="h-4 w-4" />
                                                                            Delete
                                                                        </Button>
                                                                    </CardFooter>
                                                                </Card>
                                                            ))}
                                                        </div>

                                                        {news.last_page > 1 && (
                                                            <div className="flex justify-center gap-2 mt-6">
                                                                {news.links.map((link, index) => {
                                                                    if (!link.url) {
                                                                        return (
                                                                            <Button
                                                                                key={index}
                                                                                variant="outline"
                                                                                size="sm"
                                                                                disabled
                                                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                                                            />
                                                                        );
                                                                    }
                                                                    
                                                                    const url = new URL(link.url);
                                                                    const page = url.searchParams.get('page');
                                                                    
                                                                    return (
                                                                        <Button
                                                                            key={index}
                                                                            variant={link.active ? 'default' : 'outline'}
                                                                            size="sm"
                                                                            onClick={() => router.get(
                                                                                route('news.index'),
                                                                                { category: selectedCategory, page: page },
                                                                                { preserveState: true }
                                                                            )}
                                                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                                                        />
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </>
                                                ) : (
                                                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                                                        No news articles in this category yet.
                                                    </p>
                                                )}
                                            </CardContent>
                                        </CollapsibleContent>
                                    </Collapsible>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the {deleteDialog.type}.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}