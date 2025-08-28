import { ObjectId } from "mongodb";

export interface EmailTemplate {
  _id?: ObjectId;
  name: string;
  description?: string;
  subject: string;
  preheader?: string;
  content: string;
  htmlContent?: string;
  textContent?: string;
  createdBy: ObjectId;
  createdAt: Date;
  updatedAt: Date;
  category?: string;
  tags?: string[];
  isArchived: boolean;
  thumbnail?: string;
  version: number;
  previousVersions?: ObjectId[];
}

export interface TemplateCategory {
  _id?: ObjectId;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateVariable {
  name: string;
  defaultValue?: string;
  description?: string;
}