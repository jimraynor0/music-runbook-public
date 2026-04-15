import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Email message options
 */
export interface EmailMessage {
  /** Recipient email address(es) - can be string or array */
  to: string | string[];
  /** Email subject line */
  subject: string;
  /** Plain text email body (optional if html is provided) */
  text?: string;
  /** HTML email body (optional if text is provided) */
  html?: string;
  /** CC recipients (optional) */
  cc?: string | string[];
  /** BCC recipients (optional) */
  bcc?: string | string[];
  /** Reply-to address (optional) */
  replyTo?: string;
  /** Custom from address (optional, uses extension default if not provided) */
  from?: string;
}

/**
 * Event notification email template data
 */
export interface EventNotificationData {
  eventName: string;
  eventDate: string;
  notices: Array<{
    title: string;
    body: string;
  }>;
}

/**
 * Send an email using Firebase Trigger Email extension
 *
 * This function adds a document to the 'mail' collection in Firestore.
 * The Firebase extension automatically processes it and sends the email via SendGrid.
 *
 * @param emailData - Email message configuration
 * @returns Promise with the document ID of the email record
 *
 * @example
 * ```typescript
 * await sendEmail({
 *   to: 'parent@example.com',
 *   subject: 'New Event Added',
 *   html: '<h1>Band Concert</h1><p>December 15, 2025</p>'
 * });
 * ```
 */
export const sendEmail = async (emailData: EmailMessage): Promise<string> => {
  try {
    const mailCollection = collection(db, 'mail');

    // Create email document that the extension will process
    const emailDoc = {
      to: emailData.to,
      message: {
        subject: emailData.subject,
        text: emailData.text,
        html: emailData.html,
      },
      ...(emailData.cc && { cc: emailData.cc }),
      ...(emailData.bcc && { bcc: emailData.bcc }),
      ...(emailData.replyTo && { replyTo: emailData.replyTo }),
      ...(emailData.from && { from: emailData.from }),
    };

    const docRef = await addDoc(mailCollection, emailDoc);
    console.log('Email queued for sending with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error queuing email:', error);
    throw error;
  }
};

/**
 * Send event notification email to multiple recipients
 *
 * @param recipients - Array of email addresses
 * @param eventData - Event information for the email
 * @returns Promise with the document ID
 *
 * @example
 * ```typescript
 * await sendEventNotification(
 *   ['parent1@example.com', 'parent2@example.com'],
 *   {
 *     eventName: 'Band Concert',
 *     eventDate: 'December 15, 2025',
 *     notices: [
 *       { title: 'Dress Code', body: 'Please wear black pants and white shirt' },
 *       { title: 'Arrival Time', body: 'Arrive 30 minutes early' }
 *     ]
 *   }
 * );
 * ```
 */
export const sendEventNotification = async (
  recipients: string[],
  eventData: EventNotificationData
): Promise<string> => {
  const noticesHtml = eventData.notices
    .map(
      (notice) => `
      <div style="margin-bottom: 20px;">
        <h3 style="color: #333; margin-bottom: 10px;">${notice.title}</h3>
        <div>${notice.body}</div>
      </div>
    `
    )
    .join('');

  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #f8f9fa; border-left: 4px solid #007bff; padding: 20px; margin-bottom: 20px;">
        <h1 style="margin: 0; color: #007bff;">New Event: ${eventData.eventName}</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px; color: #666;">
          <strong>Date:</strong> ${eventData.eventDate}
        </p>
      </div>

      <div style="margin-bottom: 30px;">
        <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">Event Notices</h2>
        ${noticesHtml}
      </div>

      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-top: 30px;">
        <p style="margin: 0; font-size: 14px; color: #666;">
          For more information, please visit the Music Runbook portal.
        </p>
      </div>
    </body>
    </html>
  `;

  const textBody = `
New Event: ${eventData.eventName}
Date: ${eventData.eventDate}

Event Notices:
${eventData.notices.map((notice) => `\n${notice.title}\n${notice.body}\n`).join('\n')}

For more information, please visit the Music Runbook portal.
  `;

  return sendEmail({
    to: recipients,
    subject: `New Event: ${eventData.eventName}`,
    html: htmlBody,
    text: textBody,
  });
};

/**
 * Send a test email to verify the setup
 *
 * @param toEmail - Recipient email address for testing
 * @returns Promise with the document ID
 */
export const sendTestEmail = async (toEmail: string): Promise<string> => {
  return sendEmail({
    to: toEmail,
    subject: 'Test Email - Music Runbook',
    html: `
      <h1>Test Email</h1>
      <p>If you're seeing this, your email setup is working correctly!</p>
      <p><strong>Music Runbook</strong> email system is ready to use.</p>
    `,
    text: "Test Email\n\nIf you're seeing this, your email setup is working correctly!\n\nMusic Runbook email system is ready to use.",
  });
};
