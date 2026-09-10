export const IPC_EVENTS = {
  GIT: {
    STATUS: 'git:status',
    ADD: 'git:add',
    RESET: 'git:reset',
    REVERT_CHANGES: 'git:revertChanges',
    COMMIT: 'git:commit',
    PUSH: 'git:push',
    PULL: 'git:pull',
    UNPUSHED_COUNT: 'git:unpushedCount',
    BRANCH: 'git:branch',
    DIFF: 'git:diff',
    CHECKOUT: 'git:checkout',
    REFRESH: 'git:refresh'
    ,WORKTREE_LIST: 'git:worktreeList'
    ,WORKTREE_ADD: 'git:worktreeAdd'
    ,WORKTREE_REMOVE: 'git:worktreeRemove'
  },
  WINDOW: {
    MINIMIZE: 'window:minimize',
    MAXIMIZE: 'window:maximize',
    CLOSE: 'window:close'
  },
  FILESYSTEM: {
    READ_DIRECTORY: 'filesystem:readDirectory',
    OPEN_IN_FILE_MANAGER: 'filesystem:openInFileManager'
  },
  LAUNCHER: { GET_APPLICATIONS: 'launcher:getApplications', OPEN_PATH: 'launcher:openPath' },
    SETTINGS: {
    GET: 'settings:get',
    SAVE: 'settings:save',
    SELECT_EXECUTABLE: 'settings:selectExecutable'
  }
} as const
