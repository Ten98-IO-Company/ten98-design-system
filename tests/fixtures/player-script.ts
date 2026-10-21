// A minimal protocol-v1 player for the IsolatedPlayerFrame tests. ?mode=ok | wrong-token | silent | chatty.
// Imported with ?worker&url so the test build emits it as one classic script.
(function () {
  var script = document.currentScript as HTMLScriptElement;
  var mode = new URL(script.src).searchParams.get('mode') || 'ok';
  var token = script.dataset.ten98Token ?? '';
  addEventListener('message', function (event: MessageEvent) {
    if (event.source !== parent || !event.data || event.data.type !== 'ten98-player-connect' || event.ports.length !== 1) return;
    var port = event.ports[0];
    // Network access must be blocked by the document's CSP; the test watches for this request.
    fetch('/tests/probe-player-' + mode + '.json').catch(function () {});
    if (mode === 'silent') return;
    port.onmessage = function (message: MessageEvent) {
      var command = message.data;
      if (command.type === 'init') {
        document.getElementById('ten98-player-root')!.textContent = 'Payload ' + JSON.stringify(command.payload);
        port.postMessage({ type: 'ready', duration: 1000 });
        if (mode === 'chatty') port.postMessage({ type: 'navigate', href: 'https://evil.example/' });
      } else if (command.type === 'play') port.postMessage({ type: 'tick', time: command.offset, playing: true });
      else if (command.type === 'destroy') port.close();
    };
    port.start();
    port.postMessage({ type: 'hello', token: mode === 'wrong-token' ? 'forged' : token });
  });
})();
