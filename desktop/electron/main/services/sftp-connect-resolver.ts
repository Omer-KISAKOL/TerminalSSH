import type { ConnectRequest } from '@shared/contracts/ssh'
import type { SftpConnectRequest } from '@shared/contracts/sftp'

import { resolveConnectRequest } from './connect-resolver'

export async function resolveSftpConnectRequest(
  request: SftpConnectRequest,
): Promise<ConnectRequest> {
  const baseRequest: ConnectRequest = {
    profileId: request.profileId,
    host: request.host,
    port: request.port,
    username: request.username,
    authType: request.authType,
    password: request.password,
    privateKeyPath: request.privateKeyPath,
    passphrase: request.passphrase,
    cols: 80,
    rows: 24,
  }

  return resolveConnectRequest(baseRequest)
}
