export type RepositoryNodeKind = 'file' | 'directory'

export interface RepositoryNode {
  name: string
  relativePath: string
  kind: RepositoryNodeKind
  mayHaveChildren: boolean
}

export type ApplicationId = 'vscode' | 'rider' | 'visual-studio'

export interface SupportedApplication {
  id: ApplicationId
  name: string
}

export interface LaunchRequest {
  repositoryRoot: string
  relativePath: string
  kind: RepositoryNodeKind
  applicationId: ApplicationId
}
