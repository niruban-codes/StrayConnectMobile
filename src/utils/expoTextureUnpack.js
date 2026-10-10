// Expo GL lacks these browser-only unpack flags. For our raw RGBA DataTexture,
// false premultiplication and NONE color conversion already describe the bytes.
// Keep real unpack operations (and unsupported non-default requests) untouched.
export function configureDataTextureUnpack(gl) {
  const original = gl.pixelStorei;
  const compatible = (parameter, value) => {
    if (parameter === gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL && (value === false || value === 0)) return;
    if (parameter === gl.UNPACK_COLORSPACE_CONVERSION_WEBGL && value === gl.NONE) return;
    return original.call(gl, parameter, value);
  };
  gl.pixelStorei = compatible;
  return () => { if (gl.pixelStorei === compatible) gl.pixelStorei = original; };
}
