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
  LAUNCHER: { GET_APPLICATIONS: 'launcher:getApplications', OPEN_PATH: 'launcher:openPath' }
} as const
