'use client';

import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function GitHubPopupSuccess() {
    useEffect(() => {
        const notifyOpener = () => {
            if (window.opener) {
                // Send success message to the opener
                window.opener.postMessage('github-connected', window.location.origin);
                // Close the popup
                window.close();
            } else {
                // Fallback if somehow not opened as popup
                window.location.href = '/dashboard/settings?tab=integrations';
            }
        };

        notifyOpener();
    }, []);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground font-medium">Connecting to GitHub...</p>
                <p className="text-xs text-muted-foreground">This window should close automatically.</p>
            </div>
        </div>
    );
}
