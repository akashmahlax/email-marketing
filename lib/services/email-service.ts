import { EmailTemplate } from "../models/template";
import { Subscriber } from "../models/subscriber";

export interface EmailProvider {
  name: string;
  sendEmail: (emailData: EmailData) => Promise<EmailResult>;
}

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
 * SendGrid Email Provider
 */
class SendGridProvider implements EmailProvider {
  name = "SendGrid";

  async sendEmail(emailData: EmailData): Promise<EmailResult> {
    try {
      const apiKey = process.env.SENDGRID_API_KEY;
      if (!apiKey) {
        throw new Error("SendGrid API key not configured");
      }

      const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [
            {
              to: [{ email: emailData.to }],
              subject: emailData.subject,
            },
          ],
          from: { email: emailData.from },
          content: [
            {
              type: "text/html",
              value: emailData.html || "",
            },
            {
              type: "text/plain",
              value: emailData.text || "",
            },
          ],
          reply_to: emailData.replyTo ? { email: emailData.replyTo } : undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`SendGrid API error: ${error}`);
      }

      const messageId = response.headers.get("x-message-id");
      return {
        success: true,
        messageId: messageId || undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

/**
 * Resend Email Provider
 */
class ResendProvider implements EmailProvider {
  name = "Resend";

  async sendEmail(emailData: EmailData): Promise<EmailResult> {
    try {
      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey) {
        throw new Error("Resend API key not configured");
      }

      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: emailData.from,
          to: [emailData.to],
          subject: emailData.subject,
          html: emailData.html,
          text: emailData.text,
          reply_to: emailData.replyTo,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Resend API error: ${JSON.stringify(error)}`);
      }

      const result = await response.json();
      return {
        success: true,
        messageId: result.id,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

/**
 * Mailgun Email Provider
 */
class MailgunProvider implements EmailProvider {
  name = "Mailgun";

  async sendEmail(emailData: EmailData): Promise<EmailResult> {
    try {
      const apiKey = process.env.MAILGUN_API_KEY;
      const domain = process.env.MAILGUN_DOMAIN;
      
      if (!apiKey || !domain) {
        throw new Error("Mailgun API key or domain not configured");
      }

      const formData = new FormData();
      formData.append("from", emailData.from);
      formData.append("to", emailData.to);
      formData.append("subject", emailData.subject);
      
      if (emailData.html) {
        formData.append("html", emailData.html);
      }
      
      if (emailData.text) {
        formData.append("text", emailData.text);
      }
      
      if (emailData.replyTo) {
        formData.append("h:Reply-To", emailData.replyTo);
      }

      const response = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
        method: "POST",
        headers: {
          "Authorization": `Basic ${btoa(`api:${apiKey}`)}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Mailgun API error: ${error}`);
      }

      const result = await response.json();
      return {
        success: true,
        messageId: result.id,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

/**
 * Get the configured email provider
 */
function getEmailProvider(): EmailProvider {
  // Check for SendGrid
  if (process.env.SENDGRID_API_KEY) {
    return new SendGridProvider();
  }
  
  // Check for Resend
  if (process.env.RESEND_API_KEY) {
    return new ResendProvider();
  }
  
  // Check for Mailgun
  if (process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN) {
    return new MailgunProvider();
  }
  
  throw new Error("No email provider configured. Please set up SendGrid, Resend, or Mailgun API keys.");
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
  const provider = getEmailProvider();
  return provider.sendEmail(emailData);
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
  const batchSize = 10;
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
    
    // Add a small delay between batches to avoid rate limits
    if (i + batchSize < subscribers.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return results;
}

/**
 * Test email configuration
 */
export async function testEmailConfiguration(): Promise<{ success: boolean; provider: string; error?: string }> {
  try {
    const provider = getEmailProvider();
    
    const testEmail: EmailData = {
      to: "test@example.com",
      from: process.env.SENDGRID_FROM_EMAIL || process.env.RESEND_FROM_EMAIL || process.env.MAILGUN_FROM_EMAIL || "test@example.com",
      subject: "Test Email",
      html: "<h1>Test Email</h1><p>This is a test email to verify your email configuration.</p>",
      text: "Test Email\n\nThis is a test email to verify your email configuration.",
    };

    const result = await provider.sendEmail(testEmail);
    
    return {
      success: result.success,
      provider: provider.name,
      error: result.error,
    };
  } catch (error) {
    return {
      success: false,
      provider: "Unknown",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
