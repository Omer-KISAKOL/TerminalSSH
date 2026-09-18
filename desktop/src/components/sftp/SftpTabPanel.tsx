import { useCallback, useEffect, useMemo, useState } from 'react'

import type { PublicServerProfile } from '@shared/contracts/profile'
import type { FileEntry } from '@shared/contracts/sftp'
import type { ConnectionFormValues } from '@shared/contracts/ssh'
import type { SftpWorkspaceTab } from '@shared/contracts/workspace'

import { getParentPath, joinLocalPath, joinPath } from '@/lib/paths'
import { publicProfileToFormValues, validateConnectionForm } from '@/lib/connection-form'
import {
  TRANSFER_DRAG_MIME,
  encodeTransferDragPayload,
  getTransferableEntries,
  isTransferableEntry,
  selectEntry,
  type FilePaneSide,
  type TransferDragPayload,
} from '@/lib/file-selection'
import { toUserErrorMessage } from '@/lib/user-error'

import { FileContextMenu, type FileContextMenuAction } from './FileContextMenu'
import { FilePane } from './FilePane'
import { SftpHostPicker } from './SftpHostPicker'

type SftpTabPanelProps = {
  tab: SftpWorkspaceTab
  isActive: boolean
  profiles: PublicServerProfile[]
  profilesLoading: boolean
  connectDisabled: boolean
  onConnect: (values: ConnectionFormValues) => Promise<void>
  onLocalPathChange: (path: string) => void
  onRemotePathChange: (path: string) => void
}

type ContextMenuState = {
  side: FilePaneSide
  x: number
  y: number
  entries: FileEntry[]
} | null

function isConnected(tab: SftpWorkspaceTab): boolean {
  return tab.status === 'connected' && Boolean(tab.sessionId)
}

export function SftpTabPanel({
  tab,
  isActive,
  profiles,
  profilesLoading,
  connectDisabled,
  onConnect,
  onLocalPathChange,
  onRemotePathChange,
}: SftpTabPanelProps) {
  const [localEntries, setLocalEntries] = useState<FileEntry[]>([])
  const [remoteEntries, setRemoteEntries] = useState<FileEntry[]>([])
  const [localLoading, setLocalLoading] = useState(false)
  const [remoteLoading, setRemoteLoading] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [remoteError, setRemoteError] = useState<string | null>(null)
  const [selectedLocalPaths, setSelectedLocalPaths] = useState<Set<string>>(new Set())
  const [selectedRemotePaths, setSelectedRemotePaths] = useState<Set<string>>(new Set())
  const [localAnchorPath, setLocalAnchorPath] = useState<string | null>(null)
  const [remoteAnchorPath, setRemoteAnchorPath] = useState<string | null>(null)
  const [transferMessage, setTransferMessage] = useState<string | null>(null)
  const [transferring, setTransferring] = useState(false)
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(null)
  const [activeDropPane, setActiveDropPane] = useState<FilePaneSide | null>(null)

  const connected = isConnected(tab)

  const selectedLocalFiles = useMemo(
    () => getTransferableEntries(localEntries, selectedLocalPaths),
    [localEntries, selectedLocalPaths],
  )

  const selectedRemoteFiles = useMemo(
    () => getTransferableEntries(remoteEntries, selectedRemotePaths),
    [remoteEntries, selectedRemotePaths],
  )

  const loadLocal = useCallback(async (directoryPath: string) => {
    setLocalLoading(true)
    setLocalError(null)

    try {
      const entries = await window.desktopApi.files.listLocalDir(directoryPath)
      setLocalEntries(entries)
    } catch (error) {
      setLocalError(toUserErrorMessage(error, 'Yerel dizin okunamadı.'))
      setLocalEntries([])
    } finally {
      setLocalLoading(false)
    }
  }, [])

  const loadRemote = useCallback(async (sessionId: string, directoryPath: string) => {
    setRemoteLoading(true)
    setRemoteError(null)

    try {
      const entries = await window.desktopApi.sftp.listDir(sessionId, directoryPath)
      setRemoteEntries(entries)
    } catch (error) {
      setRemoteError(toUserErrorMessage(error, 'Uzak dizin okunamadı.'))
      setRemoteEntries([])
    } finally {
      setRemoteLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isActive || !tab.localPath) {
      return
    }

    void loadLocal(tab.localPath)
    setSelectedLocalPaths(new Set())
    setLocalAnchorPath(null)
  }, [isActive, loadLocal, tab.localPath])

  useEffect(() => {
    if (!isActive || !connected || !tab.sessionId) {
      return
    }

    void loadRemote(tab.sessionId, tab.remotePath)
    setSelectedRemotePaths(new Set())
    setRemoteAnchorPath(null)
  }, [connected, isActive, loadRemote, tab.remotePath, tab.sessionId])

  const uploadFiles = useCallback(
    async (files: FileEntry[]) => {
      if (!tab.sessionId || files.length === 0) {
        return
      }

      setTransferring(true)
      setTransferMessage(null)

      const uploaded: string[] = []
      const failed: string[] = []

      for (const file of files) {
        const remoteTarget = joinPath(tab.remotePath, file.name)

        try {
          await window.desktopApi.sftp.upload(tab.sessionId, file.path, remoteTarget)
          uploaded.push(file.name)
        } catch {
          failed.push(file.name)
        }
      }

      if (uploaded.length > 0) {
        await loadRemote(tab.sessionId, tab.remotePath)
      }

      if (failed.length === 0) {
        setTransferMessage(
          uploaded.length === 1
            ? `${uploaded[0]} yüklendi.`
            : `${uploaded.length} dosya yüklendi.`,
        )
      } else if (uploaded.length === 0) {
        setTransferMessage('Dosyalar yüklenemedi.')
      } else {
        setTransferMessage(`${uploaded.length} dosya yüklendi, ${failed.length} dosya başarısız.`)
      }

      setTransferring(false)
    },
    [loadRemote, tab.remotePath, tab.sessionId],
  )

  const downloadFiles = useCallback(
    async (files: FileEntry[]) => {
      if (!tab.sessionId || files.length === 0) {
        return
      }

      setTransferring(true)
      setTransferMessage(null)

      const downloaded: string[] = []
      const failed: string[] = []

      for (const file of files) {
        const localTarget = joinLocalPath(tab.localPath, file.name)

        try {
          await window.desktopApi.sftp.download(tab.sessionId, file.path, localTarget)
          downloaded.push(file.name)
        } catch {
          failed.push(file.name)
        }
      }

      if (downloaded.length > 0) {
        await loadLocal(tab.localPath)
      }

      if (failed.length === 0) {
        setTransferMessage(
          downloaded.length === 1
            ? `${downloaded[0]} indirildi.`
            : `${downloaded.length} dosya indirildi.`,
        )
      } else if (downloaded.length === 0) {
        setTransferMessage('Dosyalar indirilemedi.')
      } else {
        setTransferMessage(
          `${downloaded.length} dosya indirildi, ${failed.length} dosya başarısız.`,
        )
      }

      setTransferring(false)
    },
    [loadLocal, tab.localPath, tab.sessionId],
  )

  const handleConnectProfile = async (profile: PublicServerProfile) => {
    const values = publicProfileToFormValues(profile)
    const validationError = validateConnectionForm(values)

    if (validationError) {
      setRemoteError(validationError)
      return
    }

    await onConnect(values)
  }

  const handleLocalSelect = (
    entry: FileEntry,
    modifiers: { ctrlKey: boolean; metaKey: boolean; shiftKey: boolean },
  ) => {
    const next = selectEntry(localEntries, entry, selectedLocalPaths, localAnchorPath, modifiers)
    setSelectedLocalPaths(next.selectedPaths)
    setLocalAnchorPath(next.anchorPath)
  }

  const handleRemoteSelect = (
    entry: FileEntry,
    modifiers: { ctrlKey: boolean; metaKey: boolean; shiftKey: boolean },
  ) => {
    const next = selectEntry(remoteEntries, entry, selectedRemotePaths, remoteAnchorPath, modifiers)
    setSelectedRemotePaths(next.selectedPaths)
    setRemoteAnchorPath(next.anchorPath)
  }

  const resolveContextEntries = (side: FilePaneSide, entry: FileEntry | null): FileEntry[] => {
    const entries = side === 'local' ? localEntries : remoteEntries
    const selectedPaths = side === 'local' ? selectedLocalPaths : selectedRemotePaths

    if (entry && selectedPaths.has(entry.path)) {
      return entries.filter((item) => selectedPaths.has(item.path))
    }

    return entry ? [entry] : []
  }

  const openContextMenu = (side: FilePaneSide, event: React.MouseEvent, entry: FileEntry | null) => {
    const paneEntries = side === 'local' ? localEntries : remoteEntries
    const selectedPaths = side === 'local' ? selectedLocalPaths : selectedRemotePaths
    let menuEntries: FileEntry[]

    if (entry && !selectedPaths.has(entry.path)) {
      if (side === 'local') {
        setSelectedLocalPaths(new Set([entry.path]))
        setLocalAnchorPath(entry.path)
      } else {
        setSelectedRemotePaths(new Set([entry.path]))
        setRemoteAnchorPath(entry.path)
      }

      menuEntries = [entry]
    } else {
      menuEntries = resolveContextEntries(side, entry)
    }

    setContextMenu({
      side,
      x: event.clientX,
      y: event.clientY,
      entries: menuEntries.length > 0 ? menuEntries : paneEntries.filter((item) => selectedPaths.has(item.path)),
    })
  }

  const handleContextAction = (action: FileContextMenuAction) => {
    if (!contextMenu) {
      return
    }

    const transferable = contextMenu.entries.filter(
      (entry) => entry.kind === 'file' || entry.kind === 'symlink',
    )

    if (action === 'open') {
      const directory = contextMenu.entries.find((entry) => entry.kind === 'directory')

      if (directory) {
        if (contextMenu.side === 'local') {
          onLocalPathChange(directory.path)
        } else {
          onRemotePathChange(directory.path)
        }
      }
    } else if (action === 'upload') {
      void uploadFiles(transferable)
    } else if (action === 'download') {
      void downloadFiles(transferable)
    }

    setContextMenu(null)
  }

  const handleDragStartTransfer = (
    side: FilePaneSide,
    entry: FileEntry,
    event: React.DragEvent,
  ) => {
    const entries = side === 'local' ? localEntries : remoteEntries
    const selectedPaths = side === 'local' ? selectedLocalPaths : selectedRemotePaths
    const selectedFiles = getTransferableEntries(entries, selectedPaths)
    const files =
      selectedFiles.some((item) => item.path === entry.path) && selectedFiles.length > 0
        ? selectedFiles
        : isTransferableEntry(entry)
          ? [entry]
          : []

    if (files.length === 0) {
      event.preventDefault()
      return
    }

    const payload: TransferDragPayload = {
      sourcePane: side,
      paths: files.map((file) => file.path),
    }

    event.dataTransfer.effectAllowed = 'copy'
    event.dataTransfer.setData(TRANSFER_DRAG_MIME, encodeTransferDragPayload(payload))
  }

  const handleDropTransfer = (targetSide: FilePaneSide, payload: TransferDragPayload) => {
    setActiveDropPane(null)

    if (payload.sourcePane === targetSide) {
      return
    }

    const sourceEntries = payload.sourcePane === 'local' ? localEntries : remoteEntries
    const files = sourceEntries.filter(
      (entry) => payload.paths.includes(entry.path) && (entry.kind === 'file' || entry.kind === 'symlink'),
    )

    if (files.length === 0) {
      return
    }

    if (targetSide === 'remote') {
      void uploadFiles(files)
      return
    }

    void downloadFiles(files)
  }

  if (!isActive) {
    return null
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {transferMessage ? (
        <p className="border-b border-border bg-surface-raised px-4 py-2 text-sm text-text-muted">
          {transferMessage}
        </p>
      ) : null}

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 p-3 lg:grid-cols-2">
        <FilePane
          side="local"
          title="Yerel"
          path={tab.localPath}
          entries={localEntries}
          selectedPaths={selectedLocalPaths}
          loading={localLoading}
          error={localError}
          dropActive={activeDropPane === 'local'}
          onNavigate={onLocalPathChange}
          onSelect={handleLocalSelect}
          onContextMenu={(event, entry) => openContextMenu('local', event, entry)}
          onDragStartTransfer={(entry, event) => handleDragStartTransfer('local', entry, event)}
          onDropTransfer={(payload) => handleDropTransfer('local', payload)}
          onDragEnterPane={() => setActiveDropPane('local')}
          onDragLeavePane={() => setActiveDropPane((current) => (current === 'local' ? null : current))}
          onGoUp={() => onLocalPathChange(getParentPath(tab.localPath))}
          actionLabel={
            selectedLocalFiles.length > 1 ? `Yükle → (${selectedLocalFiles.length})` : 'Yükle →'
          }
          actionDisabled={!connected || selectedLocalFiles.length === 0 || transferring}
          onAction={() => void uploadFiles(selectedLocalFiles)}
        />

        {connected && tab.sessionId ? (
          <FilePane
            side="remote"
            title="Uzak"
            path={tab.remotePath}
            entries={remoteEntries}
            selectedPaths={selectedRemotePaths}
            loading={remoteLoading}
            error={remoteError ?? tab.errorMessage}
            dropActive={activeDropPane === 'remote'}
            onNavigate={onRemotePathChange}
            onSelect={handleRemoteSelect}
            onContextMenu={(event, entry) => openContextMenu('remote', event, entry)}
            onDragStartTransfer={(entry, event) => handleDragStartTransfer('remote', entry, event)}
            onDropTransfer={(payload) => handleDropTransfer('remote', payload)}
            onDragEnterPane={() => setActiveDropPane('remote')}
            onDragLeavePane={() =>
              setActiveDropPane((current) => (current === 'remote' ? null : current))
            }
            onGoUp={() => onRemotePathChange(getParentPath(tab.remotePath))}
            actionLabel={
              selectedRemoteFiles.length > 1
                ? `← İndir (${selectedRemoteFiles.length})`
                : '← İndir'
            }
            actionDisabled={selectedRemoteFiles.length === 0 || transferring}
            onAction={() => void downloadFiles(selectedRemoteFiles)}
          />
        ) : (
          <SftpHostPicker
            profiles={profiles}
            loading={profilesLoading}
            disabled={connectDisabled}
            onConnectProfile={(profile) => void handleConnectProfile(profile)}
          />
        )}
      </div>

      {contextMenu ? (
        <FileContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          entries={contextMenu.entries}
          canUpload={contextMenu.side === 'local' && connected}
          canDownload={contextMenu.side === 'remote' && connected}
          onAction={handleContextAction}
          onClose={() => setContextMenu(null)}
        />
      ) : null}
    </div>
  )
}
