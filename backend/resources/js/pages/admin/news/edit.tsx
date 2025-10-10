import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, ImageIcon, X } from 'lucide-react';
import { FormEventHandler, useRef, useState } from 'react';
import { BreadcrumbItem } from '@/types';
import { RichTextEditor } from '@/components/rich-text-editor';

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Dashboard',
    href: '/',
  },
  {
    title: 'News Management',
    href: '/news',
  },
  {
    title: 'Edit News',
    href: '#',
  },
];

interface Category {
    id: number;
    name: string;
}

interface News {
    id: number;
    title: string;
    description: string;
    category_id: number;
    status: string;
    image_url: string | null;
    image: string | null;
}

interface Props {
    news: News;
    categories: Category[];
}

export default function Edit({ news, categories }: Props) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [removeCurrentImage, setRemoveCurrentImage] = useState(false);
    
    const { data, setData, post, processing, errors } = useForm({
        title: news.title,
        description: news.description,
        category_id: news.category_id.toString(),
        status: news.status,
        image: null as File | null,
        _method: 'PUT',
    });

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('news.update', news.id), {
            forceFormData: true,
        });
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('image', file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewImage(reader.result as string);
            };
            reader.readAsDataURL(file);
            setRemoveCurrentImage(false);
        }
    };

    const removeImage = () => {
        setData('image', null);
        setPreviewImage(null);
        setRemoveCurrentImage(true);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const displayImage = previewImage || (!removeCurrentImage && news.image_url);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit News" />

            <div className="py-12">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
                    <div className="mb-6">
                        <Link href={route('news.index')}>
                            <Button variant="ghost" className="gap-2">
                                <ArrowLeft className="h-4 w-4" />
                                Back to News
                            </Button>
                        </Link>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-2xl">Edit News Article</CardTitle>
                            <CardDescription>Update the details of your news article.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Title */}
                                <div className="space-y-2">
                                    <Label htmlFor="title">Title *</Label>
                                    <Input
                                        id="title"
                                        value={data.title}
                                        onChange={e => setData('title', e.target.value)}
                                        placeholder="Enter news title"
                                        className={errors.title ? 'border-red-500' : ''}
                                    />
                                    {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
                                </div>

                                {/* Category */}
                                <div className="space-y-2">
                                    <Label htmlFor="category">Category *</Label>
                                    <Select value={data.category_id} onValueChange={value => setData('category_id', value)}>
                                        <SelectTrigger className={errors.category_id ? 'border-red-500' : ''}>
                                            <SelectValue placeholder="Select a category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map(category => (
                                                <SelectItem key={category.id} value={category.id.toString()}>
                                                    {category.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.category_id && <p className="text-sm text-red-500">{errors.category_id}</p>}
                                </div>

                                {/* Status */}
                                <div className="space-y-2">
                                    <Label htmlFor="status">Status *</Label>
                                    <Select value={data.status} onValueChange={value => setData('status', value)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="draft">Draft</SelectItem>
                                            <SelectItem value="published">Published</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.status && <p className="text-sm text-red-500">{errors.status}</p>}
                                </div>

                                {/* Image Upload */}
                                <div className="space-y-2">
                                    <Label htmlFor="image">Featured Image</Label>
                                    
                                    {displayImage && (
                                        <div className="relative inline-block">
                                            <img 
                                                src={displayImage} 
                                                alt="Preview" 
                                                className="w-full max-w-md h-48 object-cover rounded-lg border border-gray-300 dark:border-gray-700" 
                                            />
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                className="absolute top-2 right-2"
                                                onClick={removeImage}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                                {previewImage ? 'New image selected' : 'Current image'}
                                            </p>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-4">
                                        <Input
                                            id="image"
                                            type="file"
                                            ref={fileInputRef}
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className={`flex-1 ${errors.image ? 'border-red-500' : ''}`}
                                        />
                                        {!displayImage && (
                                            <div className="flex items-center justify-center w-24 h-24 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                                                <ImageIcon className="h-8 w-8 text-gray-400" />
                                            </div>
                                        )}
                                    </div>
                                    {errors.image && <p className="text-sm text-red-500">{errors.image}</p>}
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Upload a new image to replace the current one. Accepted formats: JPG, PNG, GIF (Max: 2MB)
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label>Description *</Label>
                                    <div className={`border rounded-md overflow-hidden ${errors.description ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'}`}>
                                        <RichTextEditor
                                            value={data.description}
                                            onChange={(value) => setData('description', value)}
                                        />
                                    </div>
                                    {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
                                </div>

                                {/* Form Actions */}
                                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <Link href={route('news.index')}>
                                        <Button type="button" variant="outline">
                                            Cancel
                                        </Button>
                                    </Link>
                                    <Button type="submit" disabled={processing}>
                                        {processing ? 'Updating...' : 'Update News'}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}