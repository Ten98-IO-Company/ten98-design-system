# Third-party notices

## Product UI reference captures

Vendor UI screenshots in the dated `docs/reviews/*/images/` folders are attributed comparison evidence. The corresponding reports identify their source pages, capture dates and whether they show a public application or an official captured screen. Vendor names, marks and UI remain their owners' property; the repository's MIT license does not relicense those captures. They are excluded from the installable library archive and are not used as product assets.

## ten98-campaign / ten98-discover application foundation

The compatibility app styles, SVG markup and semantic tokens are adapted from the shared Campaign/Discover source snapshot inspected on 19 October 2026. Discover retains its original repository copyright name, ten98-monitor. Their original copyrights and MIT license are retained below. Existing application DOM, icon names, native form behavior, and semantic token names are preserved to support migration without replacing application controllers.

The catalogue favicon also reuses Campaign's existing 98 mark asset.

Copyright (c) 2026 ten98-campaign contributors

Copyright (c) 2026 ten98-monitor contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Runtime dependencies

React and React DOM are peer dependencies under the MIT license. Development dependencies retain their own package licenses; the published library does not bundle their source.

## WAI-ARIA Authoring Practices: Editable Combobox With List Autocomplete

- Source: https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-autocomplete-list/
- Licence: W3C Software and Document License (https://www.w3.org/copyright/software-license-2023/)
- Retrieved: 2026-10-21
- Use: behaviour ported and adapted to React 19 + t98 tokens in the `Combobox` component (keyboard model, ARIA roles and `aria-activedescendant` handling). No W3C markup, styles or script text is bundled.
