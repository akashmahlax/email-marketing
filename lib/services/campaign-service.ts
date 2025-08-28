import { ObjectId } from "mongodb";
import client from "../db";
import { Campaign, CampaignRecipient } from "../models/campaign";
import * as subscriberService from "./subscriber-service";
import * as templateService from "./template-service";

const COLLECTION_NAME = "campaigns";
const RECIPIENT_COLLECTION_NAME = "campaign_recipients";

/**
 * Get campaigns with pagination and filtering
 */
export async function getCampaigns(page = 1, limit = 10, filter: Partial<Campaign> = {}) {
  const db = (await client).db();
  const skip = (page - 1) * limit;
  
  const campaigns = await db
    .collection<Campaign>(COLLECTION_NAME)
    .find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();
    
  const total = await db.collection(COLLECTION_NAME).countDocuments(filter);
  
  return {
    campaigns,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  };
}

/**
 * Get a campaign by ID
 */
export async function getCampaignById(id: string) {
  const db = (await client).db();
  return db.collection<Campaign>(COLLECTION_NAME).findOne({ _id: new ObjectId(id) });
}

/**
 * Create a new campaign
 */
export async function createCampaign(campaign: Omit<Campaign, "_id" | "createdAt" | "updatedAt" | "analytics">, userId: string) {
  const db = (await client).db();
  
  // Validate template exists
  const template = await templateService.getTemplateById(campaign.templateId.toString());
  if (!template) {
    throw new Error("Template not found");
  }
  
  // Validate subscriber lists exist
  for (const listId of campaign.listIds) {
    const list = await subscriberService.getListById(listId.toString());
    if (!list) {
      throw new Error(`Subscriber list with ID ${listId} not found`);
    }
  }
  
  const now = new Date();
  const newCampaign: Campaign = {
    ...campaign,
    createdBy: new ObjectId(userId),
    createdAt: now,
    updatedAt: now,
    trackOpens: campaign.trackOpens ?? true,
    trackClicks: campaign.trackClicks ?? true,
    analytics: {
      sent: 0,
      delivered: 0,
      opens: 0,
      uniqueOpens: 0,
      clicks: 0,
      uniqueClicks: 0,
      unsubscribes: 0,
      bounces: 0,
      complaints: 0,
      openRate: 0,
      clickRate: 0,
      clickToOpenRate: 0,
      unsubscribeRate: 0,
      bounceRate: 0,
      complaintRate: 0
    }
  };
  
  const result = await db.collection<Campaign>(COLLECTION_NAME).insertOne(newCampaign as any);
  return { ...newCampaign, _id: result.insertedId };
}

/**
 * Update a campaign
 */
export async function updateCampaign(id: string, update: Partial<Campaign>, userId: string) {
  const db = (await client).db();
  
  // Get the current campaign
  const currentCampaign = await getCampaignById(id);
  if (!currentCampaign) {
    throw new Error("Campaign not found");
  }
  
  // Don't allow updating certain fields for campaigns that are not in draft status
  if (currentCampaign.status !== "draft" && (
    update.templateId || 
    update.listIds || 
    update.subject || 
    update.fromName || 
    update.fromEmail
  )) {
    throw new Error("Cannot update core campaign details after it has been scheduled or sent");
  }
  
  // If updating template, validate it exists
  if (update.templateId) {
    const template = await templateService.getTemplateById(update.templateId.toString());
    if (!template) {
      throw new Error("Template not found");
    }
  }
  
  // If updating lists, validate they exist
  if (update.listIds) {
    for (const listId of update.listIds) {
      const list = await subscriberService.getListById(listId.toString());
      if (!list) {
        throw new Error(`Subscriber list with ID ${listId} not found`);
      }
    }
  }
  
  const now = new Date();
  const result = await db.collection<Campaign>(COLLECTION_NAME).updateOne(
    { _id: new ObjectId(id) },
    { 
      $set: {
        ...update,
        updatedAt: now
      } 
    }
  );
  
  if (result.matchedCount === 0) {
    throw new Error("Campaign not found");
  }
  
  return getCampaignById(id);
}

/**
 * Delete a campaign
 */
export async function deleteCampaign(id: string) {
  const db = (await client).db();
  
  // Get the current campaign
  const currentCampaign = await getCampaignById(id);
  if (!currentCampaign) {
    throw new Error("Campaign not found");
  }
  
  // Don't allow deleting campaigns that are sending or sent
  if (["sending", "sent"].includes(currentCampaign.status)) {
    throw new Error("Cannot delete a campaign that has been sent");
  }
  
  const result = await db.collection<Campaign>(COLLECTION_NAME).deleteOne({ _id: new ObjectId(id) });
  
  if (result.deletedCount === 0) {
    throw new Error("Campaign not found");
  }
  
  // Also delete any recipients
  await db.collection<CampaignRecipient>(RECIPIENT_COLLECTION_NAME).deleteMany({ campaignId: new ObjectId(id) });
  
  return { success: true };
}

/**
 * Schedule a campaign for sending
 */
export async function scheduleCampaign(id: string, scheduledAt: Date) {
  const db = (await client).db();
  
  // Get the current campaign
  const currentCampaign = await getCampaignById(id);
  if (!currentCampaign) {
    throw new Error("Campaign not found");
  }
  
  // Only draft campaigns can be scheduled
  if (currentCampaign.status !== "draft") {
    throw new Error(`Cannot schedule a campaign with status: ${currentCampaign.status}`);
  }
  
  // Ensure scheduled time is in the future
  if (scheduledAt <= new Date()) {
    throw new Error("Scheduled time must be in the future");
  }
  
  const now = new Date();
  const result = await db.collection<Campaign>(COLLECTION_NAME).updateOne(
    { _id: new ObjectId(id) },
    { 
      $set: {
        status: "scheduled",
        scheduledAt,
        updatedAt: now
      } 
    }
  );
  
  if (result.matchedCount === 0) {
    throw new Error("Campaign not found");
  }
  
  // Queue the campaign for sending at the scheduled time
  // This would typically involve a job queue like Bull or a serverless function
  // For now, we'll just return the updated campaign
  
  return getCampaignById(id);
}

/**
 * Cancel a scheduled campaign
 */
export async function cancelCampaign(id: string) {
  const db = (await client).db();
  
  // Get the current campaign
  const currentCampaign = await getCampaignById(id);
  if (!currentCampaign) {
    throw new Error("Campaign not found");
  }
  
  // Only scheduled campaigns can be cancelled
  if (currentCampaign.status !== "scheduled") {
    throw new Error(`Cannot cancel a campaign with status: ${currentCampaign.status}`);
  }
  
  const now = new Date();
  const result = await db.collection<Campaign>(COLLECTION_NAME).updateOne(
    { _id: new ObjectId(id) },
    { 
      $set: {
        status: "cancelled",
        updatedAt: now
      } 
    }
  );
  
  if (result.matchedCount === 0) {
    throw new Error("Campaign not found");
  }
  
  return getCampaignById(id);
}

/**
 * Send a campaign immediately
 */
export async function sendCampaign(id: string) {
  const db = (await client).db();
  
  // Get the current campaign
  const currentCampaign = await getCampaignById(id);
  if (!currentCampaign) {
    throw new Error("Campaign not found");
  }
  
  // Only draft or scheduled campaigns can be sent
  if (!['draft', 'scheduled'].includes(currentCampaign.status)) {
    throw new Error(`Cannot send a campaign with status: ${currentCampaign.status}`);
  }
  
  const now = new Date();
  const result = await db.collection<Campaign>(COLLECTION_NAME).updateOne(
    { _id: new ObjectId(id) },
    { 
      $set: {
        status: "sending",
        sentAt: now,
        updatedAt: now
      } 
    }
  );
  
  if (result.matchedCount === 0) {
    throw new Error("Campaign not found");
  }
  
  // In a real implementation, this would trigger the email sending process
  // For now, we'll simulate it by creating recipient records
  await createCampaignRecipients(id);
  
  return getCampaignById(id);
}

/**
 * Create recipient records for a campaign
 */
async function createCampaignRecipients(campaignId: string) {
  const db = (await client).db();
  
  // Get the campaign
  const campaign = await getCampaignById(campaignId);
  if (!campaign) {
    throw new Error("Campaign not found");
  }
  
  // Get all subscribers from the campaign's lists
  const subscriberIds = new Set<string>();
  for (const listId of campaign.listIds) {
    const { subscribers } = await subscriberService.getSubscribersByList(listId.toString(), 1, 1000);
    for (const subscriber of subscribers) {
      if (subscriber._id && subscriber.status === "active") {
        subscriberIds.add(subscriber._id.toString());
      }
    }
  }
  
  // Create recipient records
  const recipients: CampaignRecipient[] = [];
  const now = new Date();
  
  for (const subscriberId of subscriberIds) {
    const subscriber = await subscriberService.getSubscriberById(subscriberId);
    if (subscriber && subscriber.status === "active") {
      recipients.push({
        campaignId: new ObjectId(campaignId),
        subscriberId: new ObjectId(subscriberId),
        email: subscriber.email,
        status: "queued",
        sentAt: now
      });
    }
  }
  
  if (recipients.length > 0) {
    await db.collection<CampaignRecipient>(RECIPIENT_COLLECTION_NAME).insertMany(recipients as any);
  }
  
  // Update campaign analytics
  await db.collection<Campaign>(COLLECTION_NAME).updateOne(
    { _id: new ObjectId(campaignId) },
    { 
      $set: {
        "analytics.sent": recipients.length,
        updatedAt: now
      } 
    }
  );
  
  // In a real implementation, this would trigger the actual sending of emails
  // For now, we'll just mark the campaign as sent
  setTimeout(async () => {
    await db.collection<Campaign>(COLLECTION_NAME).updateOne(
      { _id: new ObjectId(campaignId) },
      { 
        $set: {
          status: "sent",
          completedAt: new Date(),
          updatedAt: new Date()
        } 
      }
    );
  }, 5000); // Simulate 5 second delay for sending
  
  return recipients;
}

/**
 * Get campaign recipients
 */
export async function getCampaignRecipients(campaignId: string, page = 1, limit = 10, filter: Partial<CampaignRecipient> = {}) {
  const db = (await client).db();
  const skip = (page - 1) * limit;
  
  const combinedFilter = {
    ...filter,
    campaignId: new ObjectId(campaignId)
  };
  
  const recipients = await db
    .collection<CampaignRecipient>(RECIPIENT_COLLECTION_NAME)
    .find(combinedFilter)
    .sort({ sentAt: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();
    
  const total = await db.collection(RECIPIENT_COLLECTION_NAME).countDocuments(combinedFilter);
  
  return {
    recipients,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  };
}

/**
 * Track email open
 */
export async function trackOpen(campaignId: string, subscriberId: string) {
  const db = (await client).db();
  
  // Update recipient record
  const now = new Date();
  await db.collection<CampaignRecipient>(RECIPIENT_COLLECTION_NAME).updateOne(
    { 
      campaignId: new ObjectId(campaignId),
      subscriberId: new ObjectId(subscriberId)
    },
    { 
      $set: {
        status: "opened",
        openedAt: now
      },
      $inc: { opens: 1 }
    }
  );
  
  // Update campaign analytics
  await db.collection<Campaign>(COLLECTION_NAME).updateOne(
    { _id: new ObjectId(campaignId) },
    { 
      $inc: {
        "analytics.opens": 1,
        "analytics.uniqueOpens": 1
      },
      $set: {
        updatedAt: now
      }
    }
  );
  
  // Recalculate rates
  await updateCampaignRates(campaignId);
  
  return { success: true };
}

/**
 * Track email click
 */
export async function trackClick(campaignId: string, subscriberId: string) {
  const db = (await client).db();
  
  // Update recipient record
  const now = new Date();
  await db.collection<CampaignRecipient>(RECIPIENT_COLLECTION_NAME).updateOne(
    { 
      campaignId: new ObjectId(campaignId),
      subscriberId: new ObjectId(subscriberId)
    },
    { 
      $set: {
        status: "clicked",
        clickedAt: now
      },
      $inc: { clicks: 1 }
    }
  );
  
  // Update campaign analytics
  await db.collection<Campaign>(COLLECTION_NAME).updateOne(
    { _id: new ObjectId(campaignId) },
    { 
      $inc: {
        "analytics.clicks": 1,
        "analytics.uniqueClicks": 1
      },
      $set: {
        updatedAt: now
      }
    }
  );
  
  // Recalculate rates
  await updateCampaignRates(campaignId);
  
  return { success: true };
}

/**
 * Update campaign analytics rates
 */
async function updateCampaignRates(campaignId: string) {
  const db = (await client).db();
  
  // Get the campaign
  const campaign = await getCampaignById(campaignId);
  if (!campaign || !campaign.analytics) {
    return;
  }
  
  const analytics = campaign.analytics;
  const sent = analytics.sent || 0;
  
  if (sent === 0) {
    return;
  }
  
  // Calculate rates
  const openRate = (analytics.uniqueOpens / sent) * 100;
  const clickRate = (analytics.uniqueClicks / sent) * 100;
  const clickToOpenRate = analytics.uniqueOpens > 0 ? (analytics.uniqueClicks / analytics.uniqueOpens) * 100 : 0;
  const unsubscribeRate = (analytics.unsubscribes / sent) * 100;
  const bounceRate = (analytics.bounces / sent) * 100;
  const complaintRate = (analytics.complaints / sent) * 100;
  
  // Update campaign
  await db.collection<Campaign>(COLLECTION_NAME).updateOne(
    { _id: new ObjectId(campaignId) },
    { 
      $set: {
        "analytics.openRate": openRate,
        "analytics.clickRate": clickRate,
        "analytics.clickToOpenRate": clickToOpenRate,
        "analytics.unsubscribeRate": unsubscribeRate,
        "analytics.bounceRate": bounceRate,
        "analytics.complaintRate": complaintRate,
        updatedAt: new Date()
      }
    }
  );
}