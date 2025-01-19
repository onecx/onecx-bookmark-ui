/**
 * onecx-bookmark-bff
 * Backend-For-Frontend (BFF) service for onecx bookmark. With this API you can manage bookmarks in your portal.
 *
 * Contact: tkit_dev@1000kit.org
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
import { BookmarkScope } from './bookmarkScope';


export interface UpdateBookmark { 
    modificationCount: number;
    displayName: string;
    position: number;
    id: string;
    endpointName?: string;
    endpointParameters?: { [key: string]: string; };
    scope?: BookmarkScope;
    query?: string;
    hash?: string;
    userId?: string;
}



