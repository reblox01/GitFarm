'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CollapsibleInvitations({ children, count }: { children: React.ReactNode, count: number }) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <Card className="md:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                    <CardTitle>Pending Invitations</CardTitle>
                    <CardDescription>Invited users who haven't accepted yet ({count}).</CardDescription>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="h-8 w-8 p-0"
                >
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
            </CardHeader>
            {isExpanded && (
                <CardContent>
                    {children}
                </CardContent>
            )}
        </Card>
    );
}
