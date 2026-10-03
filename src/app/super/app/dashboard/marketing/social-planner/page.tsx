
'use client';

import { useState, useEffect } from 'react';
import { Plus, MoreVertical, ThumbsUp, MessageSquare, Share2 } from 'lucide-react';
import { Button } from '@/app/super/components/ui/button';
import { Calendar } from '@/app/super/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/super/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/super/components/ui/tabs';
import { getSocialPosts, SocialPost } from '@/app/super/services/social-posts';
import { Badge } from '@/app/super/components/ui/badge';
import Image from 'next/image';

// A simple component to render social media icons
const SocialIcon = ({ platform }: { platform: string }) => {
    // In a real app, you'd use actual icons
    const initials = platform.substring(0, 2).toUpperCase();
    const colors: { [key: string]: string } = {
        'Facebook': 'bg-blue-600',
        'Instagram': 'bg-pink-500',
        'TikTok': 'bg-black',
        'X/Twitter': 'bg-gray-800'
    }
    return <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${colors[platform] || 'bg-gray-500'}`}>{initials}</div>
}

export default function SocialPlannerPage() {
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [posts, setPosts] = useState<SocialPost[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPosts = async () => {
            const data = await getSocialPosts();
            setPosts(data);
            setLoading(false);
        };
        fetchPosts();
    }, []);

    const filteredPosts = posts.filter(post => {
        const postDate = new Date(post.scheduledDate);
        return date && postDate.toDateString() === date.toDateString();
    });

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'Published': return 'default';
            case 'Scheduled': return 'secondary';
            case 'Needs Approval': return 'outline';
            case 'Draft': return 'destructive';
            default: return 'secondary';
        }
    };


    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight">Social Media Planner</h1>
                    <p className="mt-2 text-muted-foreground">Schedule, manage, and analyze your social media content.</p>
                </div>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Schedule Post
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <Card>
                        <CardContent className="p-2">
                             <Calendar
                                mode="single"
                                selected={date}
                                onSelect={setDate}
                                className="rounded-md"
                            />
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-2">
                    <Tabs defaultValue="day">
                        <TabsList className="mb-4">
                            <TabsTrigger value="day">Day</TabsTrigger>
                            <TabsTrigger value="week">Week</TabsTrigger>
                            <TabsTrigger value="month">Month</TabsTrigger>
                        </TabsList>
                        <TabsContent value="day">
                            <Card>
                                <CardHeader>
                                    <CardTitle>
                                        Posts for {date ? date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : 'today'}
                                    </CardTitle>
                                    <CardDescription>{filteredPosts.length} posts scheduled.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {filteredPosts.length > 0 ? filteredPosts.map(post => (
                                        <Card key={post.id} className="overflow-hidden">
                                            <div className="p-4 border-b">
                                               <div className="flex justify-between items-start">
                                                    <div className="flex items-center gap-3">
                                                        <SocialIcon platform={post.platform} />
                                                        <div>
                                                            <p className="font-semibold">{post.platform}</p>
                                                            <p className="text-sm text-muted-foreground">Scheduled for {new Date(post.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                        </div>
                                                    </div>
                                                    <Badge variant={getStatusVariant(post.status) as any}>{post.status}</Badge>
                                               </div>
                                            </div>
                                             <CardContent className="p-4 space-y-4">
                                                <p className="text-sm">{post.content}</p>
                                                {post.image && (
                                                    <div className="relative aspect-video rounded-lg overflow-hidden">
                                                        <Image src={post.image.src} alt="Post image" fill style={{ objectFit: 'cover' }} data-ai-hint={post.image.hint} />
                                                    </div>
                                                )}
                                                <div className="flex justify-between items-center text-muted-foreground text-sm">
                                                    <div className="flex gap-4">
                                                        <div className="flex items-center gap-1"><ThumbsUp className="h-4 w-4" /> {post.analytics.likes}</div>
                                                        <div className="flex items-center gap-1"><MessageSquare className="h-4 w-4" /> {post.analytics.comments}</div>
                                                        <div className="flex items-center gap-1"><Share2 className="h-4 w-4" /> {post.analytics.shares}</div>
                                                    </div>
                                                    <Button variant="ghost" size="sm">View Post</Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )) : (
                                        <div className="text-center py-12 text-muted-foreground">
                                            <p>No posts scheduled for this day.</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}

