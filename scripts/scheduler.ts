
import { spawn } from 'child_process';

const CRON_ENDPOINT = 'http://localhost:3000/api/cron/run-tasks';

async function triggerCron() {
    try {
        console.log(`[${new Date().toLocaleTimeString()}] ⏳ Triggering cron task...`);
        const response = await fetch(CRON_ENDPOINT);
        const data = await response.json();

        if (response.ok) {
            console.log(`[${new Date().toLocaleTimeString()}] ✅ Cron executed:`, data);
        } else {
            console.error(`[${new Date().toLocaleTimeString()}] ❌ Cron failed:`, data);
        }
    } catch (error) {
        console.error(`[${new Date().toLocaleTimeString()}] ❌ Error triggering cron:`, error);
        console.log('Ensure your dev server is running on http://localhost:3000');
    }
}

console.log('🚀 Starting Local Cron Scheduler...');
console.log('   Will trigger /api/cron/run-tasks every minute.');

// Initial run
triggerCron();

// Schedule every minute
setInterval(triggerCron, 60 * 1000);
