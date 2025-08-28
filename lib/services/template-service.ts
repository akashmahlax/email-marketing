import { ObjectId } from "mongodb";
import client from "../db";
import { EmailTemplate, TemplateCategory } from "../models/template";

const COLLECTION_NAME = "email_templates";
const CATEGORY_COLLECTION_NAME = "template_categories";

export async function getTemplates(page = 1, limit = 10, filter: Partial<EmailTemplate> = {}) {
  const db = (await client).db();
  const skip = (page - 1) * limit;
  
  const templates = await db
    .collection<EmailTemplate>(COLLECTION_NAME)
    .find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();
    
  const total = await db.collection(COLLECTION_NAME).countDocuments(filter);
  
  return {
    templates,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  };
}

export async function getTemplateById(id: string) {
  const db = (await client).db();
  return db.collection<EmailTemplate>(COLLECTION_NAME).findOne({ _id: new ObjectId(id) });
}

export async function createTemplate(template: Omit<EmailTemplate, "_id" | "createdAt" | "updatedAt" | "version" | "isArchived">, userId: string) {
  const db = (await client).db();
  
  const now = new Date();
  const newTemplate: EmailTemplate = {
    ...template,
    createdBy: new ObjectId(userId),
    createdAt: now,
    updatedAt: now,
    version: 1,
    isArchived: false
  };
  
  const result = await db.collection<EmailTemplate>(COLLECTION_NAME).insertOne(newTemplate as any);
  return { ...newTemplate, _id: result.insertedId };
}

export async function updateTemplate(id: string, update: Partial<EmailTemplate>, userId: string) {
  const db = (await client).db();
  
  // Get the current template
  const currentTemplate = await getTemplateById(id);
  if (!currentTemplate) {
    throw new Error("Template not found");
  }
  
  // Create a new version if content is being updated
  let versionUpdate = {};
  if (update.content || update.htmlContent || update.textContent) {
    // Store the current version
    const previousVersions = currentTemplate.previousVersions || [];
    previousVersions.push(currentTemplate._id!);
    
    versionUpdate = {
      version: currentTemplate.version + 1,
      previousVersions
    };
  }
  
  const now = new Date();
  const result = await db.collection<EmailTemplate>(COLLECTION_NAME).updateOne(
    { _id: new ObjectId(id) },
    { 
      $set: {
        ...update,
        ...versionUpdate,
        updatedAt: now
      } 
    }
  );
  
  if (result.matchedCount === 0) {
    throw new Error("Template not found");
  }
  
  return getTemplateById(id);
}

export async function deleteTemplate(id: string) {
  const db = (await client).db();
  
  // Soft delete by archiving
  const result = await db.collection<EmailTemplate>(COLLECTION_NAME).updateOne(
    { _id: new ObjectId(id) },
    { 
      $set: {
        isArchived: true,
        updatedAt: new Date()
      } 
    }
  );
  
  if (result.matchedCount === 0) {
    throw new Error("Template not found");
  }
  
  return { success: true };
}

export async function hardDeleteTemplate(id: string) {
  const db = (await client).db();
  const result = await db.collection<EmailTemplate>(COLLECTION_NAME).deleteOne({ _id: new ObjectId(id) });
  
  if (result.deletedCount === 0) {
    throw new Error("Template not found");
  }
  
  return { success: true };
}

export async function getTemplateVersion(id: string, version: number) {
  const db = (await client).db();
  
  // Get the current template
  const currentTemplate = await getTemplateById(id);
  if (!currentTemplate) {
    throw new Error("Template not found");
  }
  
  // If requesting the current version
  if (currentTemplate.version === version) {
    return currentTemplate;
  }
  
  // If requesting an older version
  if (version < currentTemplate.version && currentTemplate.previousVersions) {
    const versionIndex = currentTemplate.version - version - 1;
    if (versionIndex >= 0 && versionIndex < currentTemplate.previousVersions.length) {
      const versionId = currentTemplate.previousVersions[versionIndex];
      return db.collection<EmailTemplate>(COLLECTION_NAME).findOne({ _id: versionId });
    }
  }
  
  throw new Error("Template version not found");
}

// Template Categories
export async function getCategories(page = 1, limit = 10) {
  const db = (await client).db();
  const skip = (page - 1) * limit;
  
  const categories = await db
    .collection<TemplateCategory>(CATEGORY_COLLECTION_NAME)
    .find({})
    .sort({ name: 1 })
    .skip(skip)
    .limit(limit)
    .toArray();
    
  const total = await db.collection(CATEGORY_COLLECTION_NAME).countDocuments();
  
  return {
    categories,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  };
}

export async function getCategoryById(id: string) {
  const db = (await client).db();
  return db.collection<TemplateCategory>(CATEGORY_COLLECTION_NAME).findOne({ _id: new ObjectId(id) });
}

export async function createCategory(category: Omit<TemplateCategory, "_id" | "createdAt" | "updatedAt">) {
  const db = (await client).db();
  
  const now = new Date();
  const newCategory: TemplateCategory = {
    ...category,
    createdAt: now,
    updatedAt: now
  };
  
  const result = await db.collection<TemplateCategory>(CATEGORY_COLLECTION_NAME).insertOne(newCategory as any);
  return { ...newCategory, _id: result.insertedId };
}

export async function updateCategory(id: string, update: Partial<TemplateCategory>) {
  const db = (await client).db();
  
  const now = new Date();
  const result = await db.collection<TemplateCategory>(CATEGORY_COLLECTION_NAME).updateOne(
    { _id: new ObjectId(id) },
    { 
      $set: {
        ...update,
        updatedAt: now
      } 
    }
  );
  
  if (result.matchedCount === 0) {
    throw new Error("Category not found");
  }
  
  return getCategoryById(id);
}

export async function deleteCategory(id: string) {
  const db = (await client).db();
  const result = await db.collection<TemplateCategory>(CATEGORY_COLLECTION_NAME).deleteOne({ _id: new ObjectId(id) });
  
  if (result.deletedCount === 0) {
    throw new Error("Category not found");
  }
  
  return { success: true };
}