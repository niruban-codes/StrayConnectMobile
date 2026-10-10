import test from 'node:test';
import assert from 'node:assert/strict';
import { configureDataTextureUnpack } from '../src/utils/expoTextureUnpack.js';

test('Expo data textures skip only browser unpack no-ops and preserve native operations', () => {
  const calls = [];
  const gl = { NONE: 0, UNPACK_PREMULTIPLY_ALPHA_WEBGL: 37441, UNPACK_COLORSPACE_CONVERSION_WEBGL: 37443,
    pixelStorei(parameter, value) { assert.equal(this, gl); calls.push([parameter, value]); } };
  const original = gl.pixelStorei;
  const restore = configureDataTextureUnpack(gl);
  gl.pixelStorei(37441, false);
  gl.pixelStorei(37443, 0);
  assert.deepEqual(calls, []);
  gl.pixelStorei(3317, 4); // Native alignment.
  gl.pixelStorei(37440, true); // Expo's supported vertical flip.
  gl.pixelStorei(37441, true); // Never swallow a requested conversion.
  gl.pixelStorei(37443, 37444);
  assert.deepEqual(calls, [[3317, 4], [37440, true], [37441, true], [37443, 37444]]);
  restore();
  assert.equal(gl.pixelStorei, original);
});
