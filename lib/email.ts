import { Resend } from 'resend';
import { prisma } from '@/lib/db';

// Initialize Resend with API key
// If key is missing, operations will fail gracefully or log to console in dev
const resend = new Resend(process.env.RESEND_API_KEY);

const EMAIL_FROM = process.env.EMAIL_FROM || 'GitFarm <noreply@gitfarm.dev>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://gitfarm.vercel.app';

export async function sendVerificationEmail(email: string, token: string, name: string = 'User') {
    const settings = await prisma.siteSettings.findFirst();
    const appName = settings?.appName || 'GitFarm';
    const verificationUrl = `${APP_URL}/verify-email/${token}`;

    if (!process.env.RESEND_API_KEY) {
        console.log('⚠️ RESEND_API_KEY not found. Logging email instead:');
        console.log(`To: ${email}`);
        console.log(`Subject: Verify your ${appName} account`);
        console.log(`Link: ${verificationUrl}`);
        return { success: true, simulated: true };
    }

    try {
        const data = await resend.emails.send({
            from: EMAIL_FROM,
            to: email,
            subject: `Verify your ${appName} account`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <title>Verify your ${appName} account</title>
                    <style>
                        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { text-align: center; margin-bottom: 30px; }
                        .logo { font-size: 24px; font-weight: bold; color: #16a34a; text-decoration: none; }
                        .content { background: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                        .button { display: inline-block; padding: 12px 24px; background-color: #16a34a; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
                        .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
                    </style>
                </head>
                <body style="background-color: #f9fafb;">
                    <div class="container">
                        <div class="header">
                            <a href="${APP_URL}" class="logo">${appName}</a>
                        </div>
                        <div class="content">
                            <h2>Welcome to ${appName}, ${name}!</h2>
                            <p>Thanks for getting started. Please verify your email address to unlock your free credits and start automating your GitHub contributions.</p>
                            <div style="text-align: center;">
                                <a href="${verificationUrl}" class="button">Verify Email Address</a>
                            </div>
                            <p>or copy and paste this link into your browser:</p>
                            <p style="color: #666; word-break: break-all;">${verificationUrl}</p>
                        </div>
                        <div class="footer">
                            <p>© ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        });

        return { success: true, data };
    } catch (error) {
        console.error('Failed to send verification email:', error);
        return { success: false, error };
    }
}

export async function sendInvitationEmail(email: string, token: string, inviterName: string, role: string, inviterEmail?: string) {
    const settings = await prisma.siteSettings.findFirst();
    const appName = settings?.appName || 'GitFarm';
    const inviteUrl = `${APP_URL}/accept-invite/${token}`;

    if (!process.env.RESEND_API_KEY) {
        console.log('⚠️ RESEND_API_KEY not found. Logging email instead:');
        console.log(`To: ${email}`);
        console.log(`Subject: Invitation to join ${appName} as ${role}`);
        console.log(`Link: ${inviteUrl}`);
        return { success: true, simulated: true };
    }

    try {
        const result = await resend.emails.send({
            from: EMAIL_FROM,
            to: email,
            bcc: inviterEmail, // Send copy to inviter as requested
            subject: `You've been invited to join ${appName} as ${role === 'ADMIN' ? 'an Administrator' : 'a User'}`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <style>
                        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { text-align: center; margin-bottom: 30px; }
                        .logo { font-size: 24px; font-weight: bold; color: #16a34a; text-decoration: none; }
                        .content { background: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                        .button { display: inline-block; padding: 12px 24px; background-color: #16a34a; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
                    </style>
                </head>
                <body style="background-color: #f9fafb;">
                    <div class="container">
                        <div class="header">
                            <a href="${APP_URL}" class="logo">${appName}</a>
                        </div>
                        <div class="content">
                            <h2>Invitation to join ${appName}</h2>
                            <p>${inviterName} has invited you to join ${appName} as ${role === 'ADMIN' ? 'an Administrator' : 'a User'}.</p>
                            <div style="text-align: center;">
                                <a href="${inviteUrl}" class="button">Accept Invitation</a>
                            </div>
                            <p>This link will expire in 7 days.</p>
                        </div>
                    </div>
                </div>
            `
        });

        if (result.error) {
            console.error('❌ Resend Error:', result.error);
            return { success: false, error: result.error };
        }

        console.log(`✅ Invitation email sent to ${email} via Resend. ID: ${result.data?.id}`);
        return { success: true, data: result.data };
    } catch (error) {
        console.error('💥 Failed to send invitation email:', error);
        return { success: false, error };
    }
}

export async function sendPasswordResetEmail(email: string, token: string) {
    const settings = await prisma.siteSettings.findFirst();
    const appName = settings?.appName || 'GitFarm';
    const resetLink = `${APP_URL}/reset-password/${token}`;

    if (!process.env.RESEND_API_KEY) {
        console.log('⚠️ RESEND_API_KEY not found. Logging email instead:');
        console.log(`To: ${email}`);
        console.log(`Subject: Reset your password - ${appName}`);
        console.log(`Link: ${resetLink}`);
        return { success: true, simulated: true };
    }

    try {
        await resend.emails.send({
            from: EMAIL_FROM,
            to: email,
            subject: `Reset your password - ${appName}`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <style>
                        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { text-align: center; margin-bottom: 30px; }
                        .logo { font-size: 24px; font-weight: bold; color: #16a34a; text-decoration: none; }
                        .content { background: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                        .button { display: inline-block; padding: 12px 24px; background-color: #16a34a; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
                    </style>
                </head>
                <body style="background-color: #f9fafb;">
                    <div class="container">
                        <div class="header">
                            <a href="${APP_URL}" class="logo">${appName}</a>
                        </div>
                        <div class="content">
                            <h2>Reset your password</h2>
                            <p>You requested to reset your password for your ${appName} account.</p>
                            <div style="text-align: center;">
                                <a href="${resetLink}" class="button">Reset Password</a>
                            </div>
                            <p>This link will expire in 1 hour.</p>
                            <p style="color: #666; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        });
        return { success: true };
    } catch (error) {
        console.error('Error sending password reset email:', error);
        return { error: 'Failed to send password reset email' };
    }
}
