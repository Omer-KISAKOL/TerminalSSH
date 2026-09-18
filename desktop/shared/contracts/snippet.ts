export interface Snippet {
  id: string
  name: string
  content: string
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface SaveSnippetRequest {
  id?: string
  name: string
  content: string
  sortOrder?: number
}

/** @deprecated Use Snippet */
export type ProfileSnippet = Snippet
