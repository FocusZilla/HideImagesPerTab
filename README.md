Temporary user documentation: Similar to https://addons.mozilla.org/en-US/firefox/addon/tab-permissions (which is for old Firefox only).

manifest
"icons": {
  "48": "icons/bookmark-it.png",
  "96": "icons/bookmark-it@2x.png"
},

| **EVENT**                  | SOURCE   |         | MODIFY         |            |                 |             |     |
|:---------------------------|:---------|:--------|:---------------|:-----------|:----------------|:------------|:----|
|                            | default  | tab     | default button | tab button | default setting | tab setting | CSS |
| tabs.onCreated - new       | yes      |         | yes            | yes        |                 | yes         |     |
| tabs.onCreated - restored (*)  | yes      | yes     | yes            | yes        |                 |          |     |
| tabs.onActivated -new          | yes      |         | yes            | yes        |                 | yes         | yes |
| tabs.onActivated -restored (*) | yes      | yes     | yes            | yes        |                 |             | yes |
| tabs.tabUpdated            |          | yes     |                |            |                 |             | yes |
| tab button                 |          |         |                | yes        |                 | yes         | yes |
| default button             |          |         | yes            | (**)      | yes             |  (**)      | (**) |

 * `(*)` Detect whether the tab was restored: when onActivated, read the tab setting. If it is not undefined (i.e. true or false), then re-apply, rather than applying the current default.
 * `(**)` Apply default setting, and store it in the tab setting, if tab.url==='about:blank' - a newly opened tab.

For maintainer: If you change the above, also update scripts/background.js -> function apply().

Some websites disable this add-on. [addons.mozilla.org](addons.mozilla.org) is one of them - hence, don't test hide/show buttons on (the content of) [addons.mozilla.org](addons.mozilla.org).

# Exporting button images
Beware some LibreOffice versions are sick.
1:5.3.1-0ubuntu2 on Ubuntu 17.04 exported to SVG well, but 1:5.4.1-0ubuntu1 on Unbuntu 17.10 didn't.
 5.4.3.2 for Windows x64 exported well.
 
LibreOffice Draw > select all elements > menu File > Export > checkbox 'Selection' > as .svg.

TODO Are thees URLs unique per FF profile? See extension.getUrl(). moz-extension://39c46deb-10a1-40fc-b0d2-a4a603dc6981/popup.html

https://github.com/mozilla/web-ext/issues/932