import { ObjectId } from "mongodb";

export interface Subscriber {
  _id?: ObjectId;
  email: string;
  firstName?: string;
  lastName?: string;
  status: "active" | "unsubscribed" | "bounced" | "complained";
  tags?: string[];
  customFields?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  lastEmailSentAt?: Date;
  lastOpenedAt?: Date;
  lastClickedAt?: Date;
  source?: string;
  ipAddress?: string;
  userAgent?: string;
  unsubscribedAt?: Date;
  unsubscribeReason?: string;
}

export interface SubscriberList {
  _id?: ObjectId;
  name: string;
  description?: string;
  subscribers: ObjectId[];
  subscriberCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriberListWithId extends SubscriberList {
  _id: ObjectId;
  subscriberCount: number;
}

export interface SubscriberStats {
  totalSubscribers: number;
  activeSubscribers: number;
  unsubscribedSubscribers: number;
  bouncedSubscribers: number;
  complainedSubscribers: number;
  openRate: number;
  clickRate: number;
  growthRate: number;
}