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
    hostVerifyRequest: 'ssh:host-verify-request',
    hostVerifyRespond: 'ssh:host-verify-respond',
  },
  auth: {
    register: 'auth:register',
    login: 'auth:login',
    logout: 'auth:logout',
    refresh: 'auth:refresh',
    getSession: 'auth:get-session',
  },
  profiles: {
    list: 'profiles:list',
    save: 'profiles:save',
    remove: 'profiles:remove',
    sync: 'profiles:sync',
    listLocalOnly: 'profiles:list-local-only',
    importLocal: 'profiles:import-local',
  },
  sftp: {
    connect: 'sftp:connect',
    listDir: 'sftp:list-dir',
    upload: 'sftp:upload',
    download: 'sftp:download',
    disconnect: 'sftp:disconnect',
    status: 'sftp:status',
  },
  files: {
    selectPrivateKey: 'files:select-private-key',
    getHomeDir: 'files:get-home-dir',
    listLocalDir: 'files:list-local-dir',
  },
} as const
