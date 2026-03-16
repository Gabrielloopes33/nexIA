// TEMPORARY: This file provides compatibility during migration to real API
// TODO: Remove this file and update all imports to use @/hooks/use-tags

import type { Tag, TagCategory } from './types/tag'

export const MOCK_TAGS: Tag[] = []

export const POPULAR_TAGS: Tag[] = []

export const TAGS_BY_CATEGORY: Record<TagCategory, Tag[]> = {
  status: [],
  utm: [],
  persona: [],
  comportamento: [],
  custom: [],
}

export function getTagById(id: string): Tag | undefined {
  return undefined
}

export function searchTags(query: string): Tag[] {
  return []
}
