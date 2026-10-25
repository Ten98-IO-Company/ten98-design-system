/**
 * Saves data as a file with the FileSaver.js (MIT, Eli Grey) approach: a Blob, an object URL and a download anchor
 * clicked programmatically, with the URL revoked afterwards so the Blob can be released.
 */
export function saveFile(name: string, data: BlobPart | Blob, type = 'application/octet-stream') {
  const url = URL.createObjectURL(data instanceof Blob ? data : new Blob([data], { type }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.rel = 'noopener';
  anchor.hidden = true;
  // Some browsers ignore downloads from detached anchors, so attach it for the click, as FileSaver.js does.
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4e4);
}
