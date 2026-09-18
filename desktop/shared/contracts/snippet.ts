export interface ProfileSnippet {
  id: string
  profileId: string
  name: string
  content: string
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface SaveSnippetRequest {
  id?: string
  profileId: string
  name: string
  content: string
  sortOrder?: number
}
