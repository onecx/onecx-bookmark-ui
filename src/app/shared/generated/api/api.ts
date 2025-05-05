export * from './bookmarkExportImport.service';
import { BookmarkExportImport } from './bookmarkExportImport.service';
export * from './bookmarksInternal.service';
import { BookmarksInternal } from './bookmarksInternal.service';
export * from './imagesInternal.service';
import { ImagesInternal } from './imagesInternal.service';
export const APIS = [BookmarkExportImport, BookmarksInternal, ImagesInternal];
