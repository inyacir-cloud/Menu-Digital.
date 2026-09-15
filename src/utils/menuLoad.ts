export type RemoteLoadResult = {
  remoteReady: boolean;
  isLoading: boolean;
  storageError: string | null;
};

export function resolveRemoteLoad(input: {
  remote: unknown;
  error: Error | null;
}): RemoteLoadResult {
  const { remote, error } = input;

  if (error || !remote || typeof remote !== 'object') {
    return {
      remoteReady: false,
      isLoading: false,
      storageError: 'No se pudo cargar el menú online; se está usando la copia local.',
    };
  }

  return {
    remoteReady: true,
    isLoading: false,
    storageError: null,
  };
}
