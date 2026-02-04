import { ContributionGrid } from '@/components/contribution-grid';

export default function EditorPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Contribution Editor</h1>
                <p className="text-muted-foreground mt-2">
                    Design your GitHub contribution pattern
                </p>
            </div>

            <ContributionGrid />
        </div>
    );
}
