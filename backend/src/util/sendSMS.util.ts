import env from "../config/env.js";

type SMSParams = {
    recipient: string;
    sender_id: string;
    message: string;
    schedule_time?: string;
};

type SMSResponse = {
    status: string;
    message: string;
    data?: {
        uid: string;
        to: string;
        from: string;
        message: string;
        status: string;
        cost: string;
        sms_count: number;
    };
};

const TEXTLK_API_URL = "https://app.text.lk/api/v3/sms/send";
const TEXTLK_SENDER_ID = env.TEXTLK_SENDER_ID;

export const sendSMS = async ({ recipient, sender_id, message, schedule_time }: SMSParams): Promise<SMSResponse> => {
    try {
        const payload: {
            recipient: string;
            sender_id: string;
            type: string;
            message: string;
            schedule_time?: string;
        } = {
            recipient,
            sender_id,
            type: "plain",
            message,
        };

        if (schedule_time) {
            payload.schedule_time = schedule_time;
        }

        const response = await fetch(TEXTLK_API_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${env.TEXTLK_API_KEY}`,
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            body: JSON.stringify(payload),
        });

        const data: SMSResponse = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to send SMS");
        }

        // Log SMS details for tracking
        console.log(`SMS sent successfully:`, {
            uid: data.data?.uid,
            to: data.data?.to,
            status: data.data?.status,
            cost: data.data?.cost
        });

        return data;
    } catch (error) {
        console.error("SMS sending error:", error);
        throw new Error(`SMS sending failed: ${(error as Error).message}`);
    }
};

/**
 * Send welcome SMS to new users
 */
export const sendWelcomeSMS = async (phoneNumber: string, userName: string) => {
    try {
        const message = `Welcome to ZFit, ${userName}! Your account has been created successfully. Please check your email to set your password.`;

        const result = await sendSMS({
            recipient: phoneNumber,
            sender_id: TEXTLK_SENDER_ID,
            message,
        });

        console.log('Welcome SMS sent successfully:', result.data?.uid);
        return { success: true, messageId: result.data?.uid };
    } catch (error) {
        console.error('Failed to send welcome SMS:', error);
        throw new Error(`Failed to send welcome SMS: ${(error as Error).message}`);
    }
};

/**
 * Send password reset SMS
 */
export const sendPasswordResetSMS = async (phoneNumber: string, resetUrl: string) => {
    try {
        const message = `ZFit Password Reset: Click this link to reset your password: ${resetUrl}`;

        const result = await sendSMS({
            recipient: phoneNumber,
            sender_id: TEXTLK_SENDER_ID,
            message,
        });

        console.log('Password reset SMS sent successfully:', result.data?.uid);
        return { success: true, messageId: result.data?.uid };
    } catch (error) {
        console.error('Failed to send password reset SMS:', error);
        throw new Error(`Failed to send password reset SMS: ${(error as Error).message}`);
    }
};

/**
 * Send membership expiry reminder SMS
 */
export const sendMembershipExpiryReminderSMS = async (phoneNumber: string, userName: string, daysLeft: number) => {
    try {
        const message = `Hi ${userName}, your ZFit membership expires in ${daysLeft} day${daysLeft > 1 ? 's' : ''}. Please renew to continue enjoying our services.`;

        const result = await sendSMS({
            recipient: phoneNumber,
            sender_id: TEXTLK_SENDER_ID,
            message,
        });

        console.log('Membership expiry reminder SMS sent successfully:', result.data?.uid);
        return { success: true, messageId: result.data?.uid };
    } catch (error) {
        console.error('Failed to send membership expiry reminder SMS:', error);
        throw new Error(`Failed to send membership expiry reminder SMS: ${(error as Error).message}`);
    }
};

/**
 * Send class booking confirmation SMS
 */
export const sendClassBookingConfirmationSMS = async (phoneNumber: string, userName: string, className: string, dateTime: string) => {
    try {
        const message = `Hi ${userName}, your booking for ${className} on ${dateTime} has been confirmed. See you there! - ZFit`;

        const result = await sendSMS({
            recipient: phoneNumber,
            sender_id: TEXTLK_SENDER_ID,
            message,
        });

        console.log('Class booking confirmation SMS sent successfully:', result.data?.uid);
        return { success: true, messageId: result.data?.uid };
    } catch (error) {
        console.error('Failed to send class booking confirmation SMS:', error);
        throw new Error(`Failed to send class booking confirmation SMS: ${(error as Error).message}`);
    }
};

/**
 * Send payment reminder SMS
 */
export const sendPaymentReminderSMS = async (phoneNumber: string, userName: string, amount: number, dueDate: string) => {
    try {
        const message = `Hi ${userName}, your ZFit payment of LKR ${amount} is due on ${dueDate}. Please make your payment to avoid service interruption.`;

        const result = await sendSMS({
            recipient: phoneNumber,
            sender_id: TEXTLK_SENDER_ID,
            message,
        });

        console.log('Payment reminder SMS sent successfully:', result.data?.uid);
        return { success: true, messageId: result.data?.uid };
    } catch (error) {
        console.error('Failed to send payment reminder SMS:', error);
        throw new Error(`Failed to send payment reminder SMS: ${(error as Error).message}`);
    }
};