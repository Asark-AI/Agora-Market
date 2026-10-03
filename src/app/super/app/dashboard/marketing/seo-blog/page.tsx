
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/app/super/components/ui/card';
import { Button } from '@/app/super/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/super/components/ui/table';
import { Badge } from '@/app/super/components/ui/badge';
import { Skeleton } from '@/app/super/components/ui/skeleton';
import { getBlogPosts, type BlogPost } from '@/app/super/services/blog';
import { Search, Plus, BarChart, Clock, PenSquare } from 'lucide-react';
import { Input } from '@/app/super/components/ui/input';

export default function SeoBlogPage() {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const postsData = await getBlogPosts();
            setPosts(postsData);
            setLoading(false);
        };
        fetchData();
    }, []);
    
    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'Published': return 'default';
            case 'Draft': return 'secondary';
            case 'In Review': return 'outline';
            default: return 'secondary';
        }
    };
    
    const totalTraffic = posts.reduce((acc, p) => acc + p.analytics.views, 0);

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight">SEO & Blog Management</h1>
                    <p className="mt-2 text-muted-foreground">Drive organic traffic with content and SEO.</p>
                </div>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Create Post
                </Button>
            </div>

             <div className="grid gap-6 md:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium flex items-center justify-between">
                            Total Blog Traffic <BarChart className="h-4 w-4 text-muted-foreground" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{totalTraffic.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">+12% from last month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium flex items-center justify-between">
                           Top Performing Keyword <Search className="h-4 w-4 text-muted-foreground" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">"E-commerce in Ghana"</div>
                        <p className="text-xs text-muted-foreground">Position #2, 1.2k monthly searches</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium flex items-center justify-between">
                            Avg. Time on Page <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">2m 45s</div>
                        <p className="text-xs text-muted-foreground">-5s from last month</p>
                    </CardContent>
                </Card>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Blog Posts</CardTitle>
                            <CardDescription>Manage all your articles and content pieces.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             {loading ? (
                                <div className="space-y-2">
                                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Title</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Views</TableHead>
                                            <TableHead>Avg. Time</TableHead>
                                            <TableHead><span className="sr-only">Actions</span></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {posts.map((post) => (
                                            <TableRow key={post.id}>
                                                <TableCell className="font-medium">{post.title}</TableCell>
                                                <TableCell><Badge variant={getStatusVariant(post.status) as any}>{post.status}</Badge></TableCell>
                                                <TableCell>{post.analytics.views.toLocaleString()}</TableCell>
                                                <TableCell>{post.analytics.avgTime}</TableCell>
                                                <TableCell>
                                                     <Button variant="ghost" size="icon" className="h-8 w-8"><PenSquare className="h-4 w-4" /></Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </div>
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Keyword Research</CardTitle>
                            <CardDescription>Find new content opportunities.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-2">
                                <Input placeholder="Enter a keyword..." />
                                <Button><Search className="h-4 w-4" /></Button>
                            </div>
                            <div className="text-center text-muted-foreground p-8 text-sm">
                                <p>Keyword analysis will appear here.</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>SEO Checklist</CardTitle>
                            <CardDescription>Quick checks for new content.</CardDescription>
                        </CardHeader>
                        <CardContent className="text-sm space-y-3">
                            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded border" /> Use keyword in title</div>
                            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded border" /> Add meta description</div>
                            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded border" /> Optimize images (alt text)</div>
                            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded border" /> Add at least 2 internal links</div>
                        </CardContent>
                    </Card>
                </div>
            </div>

        </div>
    );
}
