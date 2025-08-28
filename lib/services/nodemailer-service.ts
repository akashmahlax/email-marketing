import nodemailer from 'nodemailer';
import { EmailTemplate } from "../models/template";
import { Subscriber } from "../models/subscriber";

export interface EmailData {
  to: string;
  from: string;
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface EmailTemplateData {
  template: EmailTemplate;
  subscriber: Subscriber;
  variables?: Record<string, string>;
}

/**
 * Create Nodemailer transporter based on environment configuration
 */
function createTransporter() {
  // SMTP Configuration
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Gmail Configuration
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }

  // Outlook/Hotmail Configuration
  if (process.env.OUTLOOK_USER && process.env.OUTLOOK_PASSWORD) {
    return nodemailer.createTransport({
      service: 'outlook',
      auth: {
        user: process.env.OUTLOOK_USER,
        pass: process.env.OUTLOOK_PASSWORD,
      },
    });
  }

  // Yahoo Configuration
  if (process.env.YAHOO_USER && process.env.YAHOO_APP_PASSWORD) {
    return nodemailer.createTransport({
      service: 'yahoo',
      auth: {
        user: process.env.YAHOO_USER,
        pass: process.env.YAHOO_APP_PASSWORD,
      },
    });
  }

  // Default to Gmail with app password (most common)
  if (process.env.GMAIL_USER) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASSWORD,
      },
    });
  }

  throw new Error("No email configuration found. Please set up SMTP, Gmail, Outlook, or Yahoo credentials.");
}

/**
 * Process email template with variables
 */
function processTemplate(template: EmailTemplate, subscriber: Subscriber, variables?: Record<string, string>): { html: string; text: string } {
  let html = template.htmlContent || template.content || "";
  let text = template.textContent || "";

  // Default variables
  const defaultVariables = {
    firstName: subscriber.firstName || "",
    lastName: subscriber.lastName || "",
    email: subscriber.email,
    fullName: `${subscriber.firstName || ""} ${subscriber.lastName || ""}`.trim(),
    unsubscribeUrl: `${process.env.NEXTAUTH_URL}/unsubscribe?email=${encodeURIComponent(subscriber.email)}`,
  };

  // Merge with custom variables
  const allVariables = { ...defaultVariables, ...variables };

  // Replace variables in template
  for (const [key, value] of Object.entries(allVariables)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, "gi");
    html = html.replace(regex, value);
    text = text.replace(regex, value);
  }

  return { html, text };
}

/**
 * Send a single email
 */
export async function sendEmail(emailData: EmailData): Promise<EmailResult> {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: emailData.from,
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text,
      replyTo: emailData.replyTo,
    };

    const info = await transporter.sendMail(mailOptions);
    
    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send an email using a template
 */
export async function sendTemplatedEmail(
  templateData: EmailTemplateData,
  fromEmail: string,
  replyTo?: string
): Promise<EmailResult> {
  const { html, text } = processTemplate(
    templateData.template,
    templateData.subscriber,
    templateData.variables
  );

  const emailData: EmailData = {
    to: templateData.subscriber.email,
    from: fromEmail,
    subject: templateData.template.subject,
    html,
    text,
    replyTo,
  };

  return sendEmail(emailData);
}

/**
 * Send campaign emails to multiple subscribers
 */
export async function sendCampaignEmails(
  campaignId: string,
  template: EmailTemplate,
  subscribers: Subscriber[],
  fromEmail: string,
  replyTo?: string
): Promise<{ success: number; failed: number; errors: string[] }> {
  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[],
  };

  // Send emails in batches to avoid rate limits
  const batchSize = 5; // Smaller batch size for SMTP
  for (let i = 0; i < subscribers.length; i += batchSize) {
    const batch = subscribers.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async (subscriber) => {
      try {
        const result = await sendTemplatedEmail(
          { template, subscriber },
          fromEmail,
          replyTo
        );
        
        if (result.success) {
          results.success++;
        } else {
          results.failed++;
          results.errors.push(`Failed to send to ${subscriber.email}: ${result.error}`);
        }
      } catch (error) {
        results.failed++;
        results.errors.push(`Error sending to ${subscriber.email}: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    });

    await Promise.all(batchPromises);
    
    // Add a delay between batches to avoid rate limits
    if (i + batchSize < subscribers.length) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  return results;
}

/**
 * Test email configuration
 */
export async function testEmailConfiguration(): Promise<{ success: boolean; provider: string; error?: string }> {
  try {
    const transporter = createTransporter();
    
    const testEmail = {
      from: process.env.GMAIL_USER || process.env.OUTLOOK_USER || process.env.YAHOO_USER || process.env.SMTP_USER || "test@example.com",
      to: "test@example.com",
      subject: "Test Email",
      html: "<h1>Test Email</h1><p>This is a test email to verify your email configuration.</p>",
      text: "Test Email\n\nThis is a test email to verify your email configuration.",
    };

    const info = await transporter.sendMail(testEmail);
    
    return {
      success: true,
      provider: "Nodemailer",
      error: undefined,
    };
  } catch (error) {
    return {
      success: false,
      provider: "Nodemailer",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get email provider info
 */
export function getEmailProviderInfo(): { provider: string; config: Record<string, string> } {
  if (process.env.SMTP_HOST) {
    return {
      provider: "SMTP",
      config: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || "587",
        user: process.env.SMTP_USER || "",
      }
    };
  }
  
  if (process.env.GMAIL_USER) {
    return {
      provider: "Gmail",
      config: {
        user: process.env.GMAIL_USER,
      }
    };
  }
  
  if (process.env.OUTLOOK_USER) {
    return {
      provider: "Outlook",
      config: {
        user: process.env.OUTLOOK_USER,
      }
    };
  }
  
  if (process.env.YAHOO_USER) {
    return {
      provider: "Yahoo",
      config: {
        user: process.env.YAHOO_USER,
      }
    };
  }
  
  return {
    provider: "None",
    config: {}
  };
}
