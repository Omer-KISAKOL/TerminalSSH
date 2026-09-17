export const IPC_CHANNELS = {
  app: {
    getVersion: 'app:get-version',
  },
  ssh: {
    connect: 'ssh:connect',
    write: 'ssh:write',
    resize: 'ssh:resize',
    disconnect: 'ssh:disconnect',
    data: 'ssh:data',
    status: 'ssh:status',
  },
} as const
