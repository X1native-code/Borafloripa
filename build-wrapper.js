const fs = require('fs');

// Guardar referencias a las funciones originales
const originalReadlink = fs.readlink;
const originalReadlinkSync = fs.readlinkSync;
const originalPromisesReadlink = fs.promises ? fs.promises.readlink : null;

// En exFAT en Windows, readlink sobre archivos normales lanza EISDIR de forma errónea.
// Interceptamos la llamada para devolver el error EINVAL estándar de Node.js
// indicando que el elemento no es un enlace simbólico.
const patchError = (path) => {
  const err = new Error(`EINVAL: invalid argument, readlink '${path}'`);
  err.code = 'EINVAL';
  err.errno = -4071; // Código de error EINVAL estándar en Windows
  err.syscall = 'readlink';
  err.path = path;
  return err;
};

fs.readlink = function(path, options, callback) {
  const cb = typeof options === 'function' ? options : callback;
  process.nextTick(() => cb(patchError(path)));
};

fs.readlinkSync = function(path, options) {
  throw patchError(path);
};

if (fs.promises && fs.promises.readlink) {
  fs.promises.readlink = function(path, options) {
    return Promise.reject(patchError(path));
  };
}

// Ejecutar Next.js
require('next/dist/bin/next');
