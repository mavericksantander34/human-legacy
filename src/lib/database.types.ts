import type {
  Family,
  FamilyMember,
  FamilyMemberRole,
  FamilyOwnershipTransfer,
  FamilyPerson,
  FamilyPersonStatus,
  FamilyRelationship,
  FamilyRelationshipType,
  Memorial,
  MemorialMedia,
  Visibility,
} from "@/lib/types";

type Table<Row, Insert, Update = Partial<Insert>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      memorials: Table<
        Memorial,
        Omit<
          Memorial,
          "id" | "created_at" | "updated_at" | "family_id" | "person_id"
        > & {
          id?: string;
          family_id?: string | null;
          person_id?: string | null;
          created_at?: string;
          updated_at?: string;
        }
      >;
      memorial_media: Table<
        MemorialMedia,
        Omit<MemorialMedia, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        }
      >;
      families: Table<
        Family,
        Omit<Family, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        }
      >;
      family_members: Table<
        FamilyMember,
        Omit<FamilyMember, "created_at"> & { created_at?: string }
      >;
      family_people: Table<
        FamilyPerson,
        Omit<FamilyPerson, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        }
      >;
      family_relationships: Table<
        FamilyRelationship,
        Omit<FamilyRelationship, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        }
      >;
      family_ownership_transfers: Table<
        FamilyOwnershipTransfer,
        Omit<FamilyOwnershipTransfer, "id" | "transferred_at"> & {
          id?: string;
          transferred_at?: string;
        },
        never
      >;
    };
    Views: Record<string, never>;
    Functions: {
      is_family_member: {
        Args: { target_family_id: string };
        Returns: boolean;
      };
      can_edit_family: {
        Args: { target_family_id: string };
        Returns: boolean;
      };
      can_manage_family: {
        Args: { target_family_id: string };
        Returns: boolean;
      };
      is_family_collaborator: {
        Args: { target_family_id: string; target_user_id: string };
        Returns: boolean;
      };
    };
    Enums: {
      memorial_visibility: Visibility;
      family_member_role: FamilyMemberRole;
      family_person_status: FamilyPersonStatus;
      family_relationship_type: FamilyRelationshipType;
    };
    CompositeTypes: Record<string, never>;
  };
};
