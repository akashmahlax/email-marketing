import { ObjectId } from "mongodb";

export interface Campaign {
  _id?: ObjectId;
  name: string;
  description?: string;
  subject: string;
  preheader?: string;
  fromName: string;
  fromEmail: string;
  replyTo?: string;
  templateId: ObjectId;
  listIds: ObjectId[];
  status: "draft" | "scheduled" | "sending" | "sent" | "paused" | "cancelled";
  scheduledAt?: Date;
  sentAt?: Date;
  completedAt?: Date;
  createdBy: ObjectId;
  createdAt: Date;
  updatedAt: Date;
  tags?: string[];
  trackOpens: boolean;
  trackClicks: boolean;
  analytics?: CampaignAnalytics;
  sentCount?: number;
  deliveredCount?: number;
  openCount?: number;
  clickCount?: number;
}

export interface CampaignWithId extends Campaign {
  _id: ObjectId;
  sentCount: number;
  deliveredCount: number;
  openCount: number;
  clickCount: number;
}

export interface CampaignAnalytics {
  sent: number;
  delivered: number;
  opens: number;
  uniqueOpens: number;
  clicks: number;
  uniqueClicks: number;
  unsubscribes: number;
  bounces: number;
  complaints: number;
  openRate: number;
  clickRate: number;
  clickToOpenRate: number;
  unsubscribeRate: number;
  bounceRate: number;
  complaintRate: number;
}

export interface CampaignRecipient {
  _id?: ObjectId;
  campaignId: ObjectId;
  subscriberId: ObjectId;
  email: string;
  status: "queued" | "sent" | "delivered" | "opened" | "clicked" | "bounced" | "complained" | "unsubscribed";
  sentAt?: Date;
  deliveredAt?: Date;
  openedAt?: Date;
  clickedAt?: Date;
  bouncedAt?: Date;
  complainedAt?: Date;
  unsubscribedAt?: Date;
  opens?: number;
  clicks?: number;
}