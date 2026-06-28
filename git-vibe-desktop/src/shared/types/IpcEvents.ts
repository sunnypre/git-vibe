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
  }
} as const
