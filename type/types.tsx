export type UserType = {
  id: number
  name: string
  email: string
  credits: number | null
}

export type ProjectType = {
  id: number
  projectId: string
  device: string
  userInput: string
  createdOn: string | null
  projectName: string | null
  theme?: string | null
  screenShot?: string | null
  projectVisualDescription?: string | null
  config?: unknown
}

export type ScreenConfig = {
  id: number
  screenId: string
  screenName: string
  purpose: string
  screenDescription: string
  code?: string | null
  projectId?: string | null
}

export type SettingsDetail = Partial<ProjectType> & {
  projectId?: string
}

export type RefreshData = {
  method: 'screenConfig'
  date: number
}
