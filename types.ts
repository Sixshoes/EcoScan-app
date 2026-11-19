export interface ImageAsset {
  id: string;
  storagePath: string;
  downloadUrl: string;
  sha256?: string;
  refCount: number;
  status: 'active' | 'pending_delete' | 'deleted';
  deleteAfter?: number; // timestamp
  createdAt: number;
  updatedAt: number;
}

export type SyncStatus = 'local' | 'firebase' | 'notion';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface BusinessCardData {
  id: string;
  prefix: string;
  firstName: string;
  lastName: string;
  title: string;
  company: string;
  department: string;
  industry: string;
  country: string;
  email: string;
  phone: string;
  fax: string;
  subject: string;
  source: string;
  website: string;
  address: string;
  notes: string;
  tags?: string[];
  category: 'employer' | 'academic' | 'staff' | 'other';
  reasoning: string; // Internal classification logic
  summary: string;   // Public facing introduction
  scannedAt: number;
  originalFileName?: string;
  originalFileSize?: number;
  syncStatus: SyncStatus;   // Explicit sync status (local, firebase, notion)
  syncedToNotion?: boolean; // Keep for backward compatibility/migration
  notionUnsyncedChanges?: boolean; // Local edits pending Notion push
  imageUrl?: string;        // Public URL of the front card image
  imageId?: string;         // Reference to front ImageAsset
  rotation?: number;
  backImageUrl?: string;    // Public URL of the back card image
  backImageId?: string;     // Reference to back ImageAsset
  backRotation?: number;
  physicalCount?: number;   // Number of physical paper cards
  translations?: {
    title?: string;
    company?: string;
    department?: string;
    industry?: string;
    subject?: string;
    country?: string;
  };
}

export interface ProcessingTask {
  id: string;
  fileName: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  error?: string;
  base64?: string;
  batchIndex: number;
  previewUrl?: string;
}

export type ScanStatus = 'idle' | 'busy' | 'error';

export type ExportMode = 
  | 'json' 
  | 'excel' 
  | 'vcard' 
  | 'zip' 
  | 'employer' 
  | 'academic' 
  | 'staff' 
  | 'all' 
  | 'single' 
  | 'full_backup' 
  | 'all_clean' 
  | 'all_original' 
  | 'csv'
  | 'selected_qs'
  | 'selected_employer'
  | 'selected_academic'
  | 'selected_staff'
  | 'selected_csv'
  | 'qs_ready_all';

export type SearchSortOption = 'name_asc' | 'name_desc' | 'company_asc' | 'date_desc' | 'date_asc';

export interface SearchPageState {
  query: string;
  sortBy: SearchSortOption;
  isGrouped: boolean;
  filterHasEmail: boolean;
  filterHasPhone: boolean;
  filterHasBackImage?: boolean;
  filterCategory: 'all' | 'employer' | 'academic' | 'staff' | 'other';
  filterCountry: string;
  filterTag?: string;
  filterSource?: string;
}

export interface FollowUpEmailDraft {
  subject: string;
  body: string;
}

export type DualSideRelationType =
  | 'bilingual_mirror'
  | 'dual_role_same_person'
  | 'different_entity';

export type DualSideResolutionStrategy =
  | 'auto'
  | 'merge_concurrent'
  | 'split_into_two'
  | 'keep_image_only';

export interface BackSideExtractedFields {
  prefix?: string;
  firstName?: string;
  lastName?: string;
  title?: string;
  company?: string;
  department?: string;
  industry?: string;
  country?: string;
  email?: string;
  subject?: string;
  phone?: string;
  fax?: string;
  website?: string;
  address?: string;
  notes?: string;
  translations?: {
    title?: string;
    company?: string;
    department?: string;
    industry?: string;
    subject?: string;
    country?: string;
  };
}

export interface BackSideExtractionResult {
  relationType: DualSideRelationType;
  hasDifferentTitle: boolean;
  hasDifferentOrg: boolean;
  hasDifferentPerson: boolean;
  conflictSummary?: string;
  recommendedBackRotation?: number;
  backOnly: BackSideExtractedFields;
  mergedSuggestion?: BackSideExtractedFields;
}

export interface DualSideConflictItem {
  card: BusinessCardData;
  extraction: BackSideExtractionResult;
  conflictReason: string;
  isDifferentPerson: boolean;
  isDifferentOrg: boolean;
}

