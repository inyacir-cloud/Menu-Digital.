import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveRemoteLoad } from './menuLoad.ts';

test('falls back to local menu when the remote load hangs or errors', () => {
  assert.deepEqual(resolveRemoteLoad({ remote: null, error: new Error('timeout') }), {
    remoteReady: false,
    isLoading: false,
    storageError: 'No se pudo cargar el menú online; se está usando la copia local.',
  });

  assert.deepEqual(resolveRemoteLoad({ remote: { ok: true }, error: null }), {
    remoteReady: true,
    isLoading: false,
    storageError: null,
  });
});
