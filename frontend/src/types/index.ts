// Core types for PicPocket application

// User and authentication types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: string;
  lastLoginAt: string;
  preferences: UserPreferences;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  notifications: NotificationPreferences;
  privacy: PrivacyPreferences;
  storage: StoragePreferences;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  backupReminders: boolean;
  sharingAlerts: boolean;
}

export interface PrivacyPreferences {
  locationServices: boolean;
  analytics: boolean;
  crashReporting: boolean;
  autoBackup: boolean;
}

export interface StoragePreferences {
  compressionLevel: number;
  thumbnailQuality: number;
  autoDeleteDuplicates: boolean;
  maxStorageSize: number;
}

// Photo and media types
export interface Photo {
  id: string;
  name: string;
  url: string;
  thumbnailUrl?: string;
  originalUrl?: string;
  size: number;
  type: string;
  width: number;
  height: number;
  createdAt: string;
  modifiedAt: string;
  takenAt?: string;
  tags: string[];
  caption?: string;
  description?: string;
  location?: Location;
  metadata?: PhotoMetadata;
  isFavorite: boolean;
  isArchived: boolean;
  albums: string[];
  backups: BackupInfo[];
  hash: string;
  orientation: number;
  colorSpace: string;
}

export interface PhotoMetadata {
  camera?: CameraInfo;
  gps?: GPSInfo;
  exif?: EXIFData;
  software?: string;
  copyright?: string;
}

export interface CameraInfo {
  make: string;
  model: string;
  lens?: string;
  focalLength?: number;
  aperture?: string;
  exposureTime?: string;
  iso?: number;
  flash?: boolean;
}

export interface GPSInfo {
  latitude: number;
  longitude: number;
  altitude?: number;
  precision?: number;
  address?: string;
}

export interface EXIFData {
  [key: string]: any;
  DateTimeOriginal?: string;
  Flash?: number;
  FocalLength?: number;
  ISO?: number;
  ExposureTime?: string;
  FNumber?: string;
}

export interface Location {
  name: string;
  address?: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  country?: string;
  city?: string;
}

// Album and organization types
export interface Album {
  id: string;
  name: string;
  description?: string;
  coverPhoto?: string;
  photos: string[];
  createdAt: string;
  modifiedAt: string;
  isShared: boolean;
  shareToken?: string;
  shareSettings?: ShareSettings;
  tags: string[];
  owner: string;
  collaborators: string[];
}

export interface ShareSettings {
  allowDownload: boolean;
  allowComments: boolean;
  allowUpload: boolean;
  expiresAt?: string;
  password?: string;
  viewCount: number;
}

// Storage and backup types
export interface StorageConnection {
  id: string;
  provider: StorageProvider;
  name: string;
  isConnected: boolean;
  lastSyncAt?: string;
  totalSpace: number;
  usedSpace: number;
  settings: StorageSettings;
}

export type StorageProvider = 'google-drive' | 'onedrive' | 'dropbox' | 'icloud' | 'local';

export interface StorageSettings {
  autoSync: boolean;
  syncInterval: number;
  compressionEnabled: boolean;
  excludeVideos: boolean;
  maxFileSize: number;
  folderPath?: string;
}

export interface BackupInfo {
  id: string;
  provider: StorageProvider;
  fileId: string;
  createdAt: string;
  size: number;
  status: BackupStatus;
  errorMessage?: string;
}

export type BackupStatus = 'pending' | 'in-progress' | 'completed' | 'failed' | 'cancelled';

// Search and filter types
export interface SearchFilters {
  query?: string;
  tags?: string[];
  dateRange?: DateRange;
  location?: string;
  camera?: string;
  isFavorite?: boolean;
  isArchived?: boolean;
  albums?: string[];
  sizeRange?: SizeRange;
  type?: string[];
}

export interface DateRange {
  start: string;
  end: string;
}

export interface SizeRange {
  min: number;
  max: number;
}

export interface SearchResult {
  photos: Photo[];
  total: number;
  facets: SearchFacets;
  suggestions?: string[];
}

export interface SearchFacets {
  tags: { [key: string]: number };
  albums: { [key: string]: number };
  cameras: { [key: string]: number };
  locations: { [key: string]: number };
  dates: { [key: string]: number };
}

// Component props types
export interface PhotoCardProps {
  photo: Photo;
  viewMode: 'grid' | 'list';
  onSelect: (photo: Photo) => void;
  onDelete: (photoId: string) => void;
  onEdit: (photo: Photo) => void;
  onToggleFavorite: (photoId: string) => void;
  onShare?: (photo: Photo) => void;
  isLoading?: boolean;
  showActions?: boolean;
  showMetadata?: boolean;
}

export interface PhotoGalleryProps {
  photos: Photo[];
  loading: boolean;
  viewMode: 'grid' | 'list';
  sortBy: SortOption;
  filters: SearchFilters;
  selectedPhotos: string[];
  onSelect: (photo: Photo) => void;
  onSelectMultiple: (photoIds: string[]) => void;
  onDelete: (photoIds: string[]) => void;
  onEdit: (photo: Photo) => void;
  onShare: (photos: Photo[]) => void;
  onToggleFavorite: (photoId: string) => void;
  onViewModeChange: (mode: 'grid' | 'list') => void;
  onSortChange: (sort: SortOption) => void;
  onFiltersChange: (filters: SearchFilters) => void;
}

export interface SortOption {
  field: keyof Photo;
  direction: 'asc' | 'desc';
  label: string;
}

// Hook return types
export interface UsePhotosReturn {
  photos: Photo[];
  loading: boolean;
  error: Error | null;
  addPhoto: (photo: Omit<Photo, 'id' | 'createdAt' | 'modifiedAt'>) => Promise<Photo>;
  updatePhoto: (id: string, updates: Partial<Photo>) => Promise<Photo>;
  deletePhoto: (id: string) => Promise<void>;
  getPhoto: (id: string) => Promise<Photo | null>;
  searchPhotos: (filters: SearchFilters) => Promise<SearchResult>;
  importPhotos: (files: File[]) => Promise<Photo[]>;
  exportPhotos: (photoIds: string[], format: ExportFormat) => Promise<Blob>;
}

export interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  error: Error | null;
  tokenExpired: boolean;
  signIn: (email: string, password: string) => Promise<User>;
  signUp: (email: string, password: string, name: string) => Promise<User>;
  signOut: () => Promise<void>;
  continueLocally: () => Promise<User>;
  refreshToken: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<User>;
  updatePreferences: (preferences: Partial<UserPreferences>) => Promise<User>;
}

// API types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
  pagination?: PaginationInfo;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  statusCode: number;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Performance monitoring types
export interface PerformanceMetric {
  type: string;
  data: Record<string, any>;
  timestamp: number;
  url: string;
  userAgent: string;
}

export interface ResourceMetrics {
  count: number;
  totalSize: number;
  totalDuration: number;
  averageDuration: number;
}

export interface PerformanceSummary {
  navigation: any;
  resources: Record<string, ResourceMetrics>;
  paint: Record<string, number>;
  longTasks: any[];
  components: any[];
  interactions: any[];
  images: any[];
  errors: any[];
}

// Utility types
export type ExportFormat = 'jpg' | 'png' | 'webp' | 'zip';
export type ViewMode = 'grid' | 'list' | 'masonry' | 'carousel';
export type Theme = 'light' | 'dark' | 'auto';
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// Event types
export interface PhotoEvent {
  type: 'add' | 'update' | 'delete' | 'favorite' | 'archive';
  photoId: string;
  timestamp: string;
  data?: any;
}

export interface UserEvent {
  type: 'login' | 'logout' | 'signup' | 'profile-update' | 'preferences-update';
  userId: string;
  timestamp: string;
  data?: any;
}

// Error types
export class AppError extends Error {
  constructor(
    message: string,
    public code: string = 'UNKNOWN_ERROR',
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, field?: string) {
    super(message, 'VALIDATION_ERROR', 400, { field });
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 'AUTHENTICATION_ERROR', 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 'AUTHORIZATION_ERROR', 403);
    this.name = 'AuthorizationError';
  }
}

export class NetworkError extends AppError {
  constructor(message: string = 'Network error occurred') {
    super(message, 'NETWORK_ERROR', 0);
    this.name = 'NetworkError';
  }
}

export class StorageError extends AppError {
  constructor(message: string, operation?: string) {
    super(message, 'STORAGE_ERROR', 500, { operation });
    this.name = 'StorageError';
  }
}

// Configuration types
export interface AppConfig {
  apiBaseUrl: string;
  maxFileSize: number;
  supportedFormats: string[];
  defaultCompressionLevel: number;
  defaultThumbnailQuality: number;
  autoBackupInterval: number;
  searchDebounceMs: number;
  maxSearchResults: number;
  enableAnalytics: boolean;
  enableCrashReporting: boolean;
}

export interface GoogleAuthConfig {
  clientId: string;
  scope: string;
  discoveryDocs: string[];
}

// Component context types
export interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  systemTheme: Theme;
}

export interface ErrorContextType {
  error: Error | null;
  setError: (error: Error | null) => void;
  clearError: () => void;
  reportError: (error: Error, context?: any) => void;
}

// React types for compatibility
declare global {
  namespace React {
    interface RefObject<T> {
      current: T | null;
    }
  }
}