
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle } from "lucide-react";

export function OnboardingChecklist() {
    const checklist = [
        { text: 'Create your first workspace', completed: true },
        { text: 'Deploy an AI agent', completed: true },
        { text: 'Configure data connectors', completed: false },
        { text: 'Set up approval workflows', completed: false },
    ];
    
    const completedCount = checklist.filter(item => item.completed).length;
    const progress = (completedCount / checklist.length) * 100;

    return (
        <Card className="lg:col-span-2 bg-card/60 backdrop-blur-sm">
            <CardHeader>
                <CardTitle>Getting Started</CardTitle>
                <CardDescription>The list below highlights the missing information we need to complete.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                    <Progress value={progress} className="h-2" />
                    <span className="text-sm font-medium text-muted-foreground">{Math.round(progress)}%</span>
                </div>
                <div className="space-y-3">
                    {checklist.map((item, index) => (
                        <div key={index} className="flex items-center gap-3">
                            {item.completed ? (
                                <CheckCircle2 className="size-5 text-green-500" />
                            ) : (
                                <Circle className="size-5 text-muted-foreground/50" />
                            )}
                            <span className="text-sm">{item.text}</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
