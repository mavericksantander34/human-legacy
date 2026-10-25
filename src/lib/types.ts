export type Visibility = "public" | "unlisted" | "private";

export type Memorial = {
  id: string;
  owner_id: string;
  family_id: string | null;
  person_id: string | null;
  full_name: string;
  slug: string;
  birth_date: string | null;
  death_date: string | null;
  story: string | null;
  visibility: Visibility;
  created_at: string;
  updated_at: string;
};

export type FamilyMemberRole = "admin" | "contributor" | "viewer";
export type FamilyPersonStatus = "living" | "deceased" | "unknown";
export type FamilyRelationshipType =
  | "parent_of"
  | "adoptive_parent_of"
  | "partner_of"
  | "sibling_of"
  | "guardian_of"
  | "other";

export type Family = {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
};

export type FamilyMember = {
  family_id: string;
  user_id: string;
  role: FamilyMemberRole;
  added_by: string | null;
  created_at: string;
};

export type FamilyPerson = {
  id: string;
  family_id: string;
  full_name: string;
  birth_date: string | null;
  death_date: string | null;
  biography: string | null;
  status: FamilyPersonStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type FamilyRelationship = {
  id: string;
  family_id: string;
  person_id: string;
  related_person_id: string;
  relationship: FamilyRelationshipType;
  created_by: string;
  created_at: string;
};

export type FamilyOwnershipTransfer = {
  id: string;
  family_id: string;
  transferred_from: string;
  transferred_to: string;
  transferred_at: string;
};

export type MemorialMedia = {
  id: string;
  memorial_id: string;
  storage_path: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  is_public: boolean;
  created_at: string;
};
