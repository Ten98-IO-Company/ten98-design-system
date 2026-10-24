# Third-party notices

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

## WAI-ARIA Authoring Practices: Tabs

- Source: https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
- Licence: W3C Software and Document License (https://www.w3.org/copyright/software-license-2023/)
- Retrieved: 2026-10-21
- Use: the `Tabs` keyboard model (automatic activation, arrow wrapping, Home/End) and tab/tabpanel roles; disabled tabs are skipped. No W3C markup, styles or script text is bundled.

## WCAG Technique G1: Skip link

- Source: https://www.w3.org/WAI/WCAG22/Techniques/general/G1
- Licence: W3C Software and Document License (https://www.w3.org/copyright/software-license-2023/)
- Retrieved: 2026-10-21
- Use: the `AppShell` skip-link behaviour (first focusable link, visible on focus, moves focus to `main`). The default navigation is cancelled so the URL hash is preserved. No W3C text is bundled.

## WAI-ARIA Authoring Practices: Grid and Date Picker Dialog

- Source: https://www.w3.org/WAI/ARIA/apg/patterns/grid/ and https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/datepicker-dialog/
- Licence: W3C Software and Document License (https://www.w3.org/copyright/software-license-2023/)
- Retrieved: 2026-10-21
- Use: the `CalendarMonth` keyboard model (roving tab stop, arrow, Home/End and PageUp/PageDown navigation, column headers with full weekday names) and grid roles. No W3C markup, styles or script text is bundled.

## Lucide icons

- Source: https://lucide.dev (package `lucide-static` 0.468.0, https://github.com/lucide-icons/lucide)
- Licence: ISC. Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022 as part of Feather (MIT); all other copyright (c) for Lucide are held by Lucide Contributors 2022.
- Use: path data of the `send`, `calendar`, `target`, `link`, `image` icons, `billboard` (Lucide `presentation`) and `chart` (Lucide `chart-column`) in the `Icon` component. `rect` and `circle` elements were converted to equivalent path commands; stroke width and the `Icon` component are our own.

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.

## d3-array, d3-scale and d3-shape

- Source: https://github.com/d3/d3-array (v3.2.4, `src/ticks.js`), https://github.com/d3/d3-scale (v4.0.2, `src/linear.js`, `src/band.js`), https://github.com/d3/d3-shape (v3.2.0, `src/arc.js`, `src/offset/diverging.js`, `src/line.js`)
- Licence: ISC. Copyright 2010-2023 Mike Bostock.
- Use: pure functions ported to strict TypeScript in the internal chart geometry module (`ticks`, `tickIncrement`, nice domain, linear and band scales, diverging stack offset, the line `defined` gap rule and a reduced arc path). No d3 package is installed or bundled; each ported function names its upstream file and tag.

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.

## Radix Colors

- Source: https://github.com/radix-ui/colors (slate scale)
- Licence: MIT. Copyright (c) 2022 WorkOS.
- Use: three colour values in `tokens.css`: light `--t98-control-border` (slate 9, #8B8D98) and `--t98-muted` (slate 11, #60646C), and dark `--t98-text` (slate dark 12, #EDEEF0). The rest of the grey ramp, and the token names and structure, are our own.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## Inter typeface

- Source: Inter 4.001, https://github.com/rsms/inter at commit 66647c0bb (the version string in both font files: "Version 4.001;git-66647c0bb"). Built by Google Fonts (build v20, 2025-09-10, https://github.com/google/fonts/tree/main/ofl/inter) and packaged by Fontsource as `@fontsource-variable/inter` 5.3.0 (https://fontsource.org/fonts/inter; npm integrity sha512-OupL48va4JNofb97w6NYeF9S7W/kHNKM0Er8Dem5nqi4jeOLrVJDoE8tZEpnMJmtkvNbB1EIPPwHcdkF6b1oUA==).
- Licence: SIL Open Font License 1.1. Copyright 2016 The Inter Project Authors (https://github.com/rsms/inter).
- Use: two unmodified variable-weight WOFF2 subsets, `inter-latin-wght-normal.woff2` and `inter-latin-ext-wght-normal.woff2`, shipped in `dist/fonts/` with `OFL.txt`. The `@font-face` rules in `tokens.css` are ours; they reuse Fontsource's unicode ranges. The font is not sold on its own, and the Reserved Font Name is not used for any modified version.

```text
Copyright 2016 The Inter Project Authors (https://github.com/rsms/inter) Inter-Italic[opsz,wght].ttf: Copyright 2016 The Inter Project Authors (https://github.com/rsms/inter)

This Font Software is licensed under the SIL Open Font License, Version 1.1.
This license is copied below, and is also available with a FAQ at:
http://scripts.sil.org/OFL


-----------------------------------------------------------
SIL OPEN FONT LICENSE Version 1.1 - 26 February 2007
-----------------------------------------------------------

PREAMBLE
The goals of the Open Font License (OFL) are to stimulate worldwide
development of collaborative font projects, to support the font creation
efforts of academic and linguistic communities, and to provide a free and
open framework in which fonts may be shared and improved in partnership
with others.

The OFL allows the licensed fonts to be used, studied, modified and
redistributed freely as long as they are not sold by themselves. The
fonts, including any derivative works, can be bundled, embedded,
redistributed and/or sold with any software provided that any reserved
names are not used by derivative works. The fonts and derivatives,
however, cannot be released under any other type of license. The
requirement for fonts to remain under this license does not apply
to any document created using the fonts or their derivatives.

DEFINITIONS
"Font Software" refers to the set of files released by the Copyright
Holder(s) under this license and clearly marked as such. This may
include source files, build scripts and documentation.

"Reserved Font Name" refers to any names specified as such after the
copyright statement(s).

"Original Version" refers to the collection of Font Software components as
distributed by the Copyright Holder(s).

"Modified Version" refers to any derivative made by adding to, deleting,
or substituting -- in part or in whole -- any of the components of the
Original Version, by changing formats or by porting the Font Software to a
new environment.

"Author" refers to any designer, engineer, programmer, technical
writer or other person who contributed to the Font Software.

PERMISSION & CONDITIONS
Permission is hereby granted, free of charge, to any person obtaining
a copy of the Font Software, to use, study, copy, merge, embed, modify,
redistribute, and sell modified and unmodified copies of the Font
Software, subject to the following conditions:

1) Neither the Font Software nor any of its individual components,
in Original or Modified Versions, may be sold by itself.

2) Original or Modified Versions of the Font Software may be bundled,
redistributed and/or sold with any software, provided that each copy
contains the above copyright notice and this license. These can be
included either as stand-alone text files, human-readable headers or
in the appropriate machine-readable metadata fields within text or
binary files as long as those fields can be easily viewed by the user.

3) No Modified Version of the Font Software may use the Reserved Font
Name(s) unless explicit written permission is granted by the corresponding
Copyright Holder. This restriction only applies to the primary font name as
presented to the users.

4) The name(s) of the Copyright Holder(s) or the Author(s) of the Font
Software shall not be used to promote, endorse or advertise any
Modified Version, except to acknowledge the contribution(s) of the
Copyright Holder(s) and the Author(s) or with their explicit written
permission.

5) The Font Software, modified or unmodified, in part or in whole,
must be distributed entirely under this license, and must not be
distributed under any other license. The requirement for fonts to
remain under this license does not apply to any document created
using the Font Software.

TERMINATION
This license becomes null and void if any of the above conditions are
not met.

DISCLAIMER
THE FONT SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO ANY WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT
OF COPYRIGHT, PATENT, TRADEMARK, OR OTHER RIGHT. IN NO EVENT SHALL THE
COPYRIGHT HOLDER BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
INCLUDING ANY GENERAL, SPECIAL, INDIRECT, INCIDENTAL, OR CONSEQUENTIAL
DAMAGES, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF THE USE OR INABILITY TO USE THE FONT SOFTWARE OR FROM
OTHER DEALINGS IN THE FONT SOFTWARE.
```

## Behaviour references (no code copied)

- react-aria `useComboBox` (Adobe, Apache-2.0, https://github.com/adobe/react-spectrum): async loading behaviour for `Combobox` and `MultiCombobox` (the typed text is reported, app-filtered options are shown as supplied, and loading keeps prior options visible).
- Downshift `useMultipleSelection` (MIT, https://github.com/downshift-js/downshift): `MultiCombobox` picks keep the list open, Backspace in an empty input removes the last pick, and picks are removable tags.
- d3-axis (ISC) and the Recharts/visx `preserveStartEnd` tick interval (MIT): `TimeSeriesChart` x-axis label thinning that always keeps the first and last labels.
