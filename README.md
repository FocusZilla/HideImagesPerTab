Temporary user documentation: Similar to https://addons.mozilla.org/en-US/firefox/addon/tab-permissions (which is for old Firefox only).

manifest
"icons": {
  "48": "icons/bookmark-it.png",
  "96": "icons/bookmark-it@2x.png"
},

| **EVENT**                  | SOURCE   |         | MODIFY         |            |                 |             |     |
|:---------------------------|:---------|:--------|:---------------|:-----------|:----------------|:------------|:----|
|                            | default  | tab     | default button | tab button | default setting | tab setting | CSS |
| tabs.onCreated             | yes      |         | yes            | yes        |                 | (*)         |     |
| tabs.onActivated -new (**) | yes      |         | yes            | yes        |                 | [x]         | [x] |
| tabs.onActivated -restored | yes      | yes     | yes            | yes        |                 |             | [x] |
| tabs.tabUpdated            |          | yes     |                |            |                 |             | [x] |
| tab button                 |          | yes     |                | yes        |                 | [x]         | [x] |
| default button             | yes      |         | yes            | (***)      | yes             |  (***)      | (***) |

 * `(*)` Don't set tab setting, if this fired for a restored tab (see `(**)`). Test. If so, keep  the existing tab's setting.
 * `(**)` Detect whether the tab was restored: when onActivated, read the tab setting. If it is not undefined (i.e. true or false), then re-apply, rather than applying the current default.
 * `(***)` Apply default CSS, and store it in the tab setting, if tab.url==='about:blank' - a newly opened tab.

# Exporting button images
LibreOffice Draw > select all elements > menu File > Export > checkbox 'Selection' > as .svg.

TODO Are thses URLs unique per FF profile? See extension.getUrl(). moz-extension://39c46deb-10a1-40fc-b0d2-a4a603dc6981/popup.html