// Catalogue demonstration of the IsolatedPlayerFrame protocol v1; a real app supplies its own player (for example rrweb).
// Bundled with ?worker&url into one classic script, because it runs inside the isolated frame from a plain <script src>.
const token = (document.currentScript as HTMLScriptElement | null)?.dataset.ten98Token ?? '';
addEventListener('message', (event: MessageEvent) => {
  if (event.source !== parent || event.data?.type !== 'ten98-player-connect' || event.ports.length !== 1) return;
  const port = event.ports[0];
  const root = document.getElementById('ten98-player-root')!;
  root.style.cssText = 'font:16px system-ui;padding:16px;color:#252435';
  let timer: ReturnType<typeof setInterval> | undefined;
  let time = 0;
  const show = (playing: boolean) => {
    port.postMessage({ type: 'tick', time, playing });
    root.textContent = `${playing ? 'Playing' : 'Paused at'} ${(time / 1000).toFixed(1)} s of 10 s`;
  };
  port.onmessage = ({ data: command }) => {
    if (command.type === 'init') { root.textContent = `Ready: ${command.payload.label}`; port.postMessage({ type: 'ready', duration: 10000 }); }
    else if (command.type === 'play') {
      time = command.offset; clearInterval(timer);
      timer = setInterval(() => { time = Math.min(10000, time + 250); show(time < 10000); if (time >= 10000) { clearInterval(timer); port.postMessage({ type: 'ended' }); } }, 250);
    } else if (command.type === 'pause') { time = command.offset; clearInterval(timer); show(false); }
    else if (command.type === 'destroy') { clearInterval(timer); port.close(); }
  };
  port.start();
  port.postMessage({ type: 'hello', token });
});
