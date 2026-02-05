import { prisma } from './db';
import simpleGit from 'simple-git';
import { writeFileSync } from 'fs';
import { join } from 'path';
import moment from 'moment';

interface CommitPattern {
    week: number;
    day: number;
    selected: boolean;
}

export async function processCommitJob(jobId: string) {
    const job = await prisma.commitJob.findUnique({
        where: { id: jobId },
        include: {
            user: true,
        },
    });

    if (!job) {
        throw new Error('Job not found');
    }

    if (job.status !== 'PENDING') {
        throw new Error('Job is not pending');
    }

    try {
        const pattern = job.pattern as unknown as CommitPattern[];
        const selectedDays = pattern.filter((day) => day.selected);
        const commitCount = selectedDays.length;

        // Check Credits
        if (job.user.credits < commitCount) {
            throw new Error(`Insufficient credits. Required: ${commitCount}, Available: ${job.user.credits}`);
        }

        // Update status to running
        await prisma.commitJob.update({
            where: { id: jobId },
            data: { status: 'RUNNING' },
        });

        // Get user's GitHub access token from NextAuth account
        const account = await prisma.account.findFirst({
            where: {
                userId: job.userId,
                provider: 'github',
            },
        });

        if (!account?.access_token) {
            throw new Error('GitHub access token not found');
        }

        // Initialize git in a temporary directory
        const repoPath = join(process.cwd(), 'temp', `repo-${jobId}`);
        const git = simpleGit();

        // Create directory and initialize git
        const fs = require('fs');
        if (!fs.existsSync(repoPath)) {
            fs.mkdirSync(repoPath, { recursive: true });
        }

        process.chdir(repoPath);
        await git.init();
        await git.addConfig('user.name', job.user.name || 'GitFarm User');
        await git.addConfig('user.email', job.user.email);

        // Create commits for each selected day
        let completedCommits = 0;
        const filePath = join(repoPath, 'data.txt');

        for (const day of selectedDays) {
            // Calculate the date for this contribution
            const date = moment()
                .subtract(1, 'year')
                .add(day.week, 'weeks')
                .add(day.day, 'days')
                .format();

            // Write to file
            writeFileSync(filePath, date);

            // Set commit date environment variables
            process.env.GIT_COMMITTER_DATE = date;
            process.env.GIT_AUTHOR_DATE = date;

            // Add and commit
            await git.add([filePath]);
            await git.commit(date);

            completedCommits++;

            // Update progress
            await prisma.commitJob.update({
                where: { id: jobId },
                data: { completedCommits },
            });

            // Small delay to avoid overwhelming the system
            await new Promise((resolve) => setTimeout(resolve, 100));
        }

        // If repository URL is provided, push to it
        if (job.repositoryUrl) {
            const authenticatedUrl = job.repositoryUrl.replace(
                'https://',
                `https://${account.access_token}@`
            );
            await git.addRemote('origin', authenticatedUrl);
            await git.push('origin', 'main', ['--force']);
        }

        // Mark as completed
        await prisma.commitJob.update({
            where: { id: jobId },
            data: {
                status: 'COMPLETED',
                completedAt: new Date(),
            },
        });

        // Deduct Credits
        await prisma.user.update({
            where: { id: job.userId },
            data: {
                credits: { decrement: completedCommits }
            }
        });

        // Cleanup
        fs.rmSync(repoPath, { recursive: true, force: true });

        return { success: true, completedCommits };
    } catch (error) {
        console.error('Error processing commit job:', error);

        await prisma.commitJob.update({
            where: { id: jobId },
            data: {
                status: 'FAILED',
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
            },
        });

        throw error;
    }
}
