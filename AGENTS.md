# Shared architecture

Read the installed `node_modules/@ten98/runtime/README.md` and `architecture.json` before changing common stack versions or dependencies. The maintained source is [ten98-code-system](https://github.com/Ten98-IO-Company/ten98-code-system).

This repository owns React presentation. Common server mechanisms belong in @ten98/runtime; application controllers remain app-owned. Run the architecture, type, test and build checks for changes, plus relevant browser checks for UI behavior. Preserve unrelated edits and immutable releases.

# Documentation

Write documentation to the [wiki](https://github.com/Ten98-IO-Company/ten98-design-system/wiki), not `docs/`; keep inline code comments in code. The package README stays short: it is what agents read offline from `node_modules/@ten98/ui`.

Same feature, same experience: the same features across both apps should look the same and work the same. Shared pieces land here first; before approving a change, check how both Campaign and Discover use it (https://github.com/Ten98-IO-Company/ten98-design-system/wiki/Development#same-feature-same-experience).
