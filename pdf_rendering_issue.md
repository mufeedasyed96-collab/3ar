# Why PDF Content May Appear "Cut Off" or "Half Page"

If your generated PDF is showing only half of the content (either cut off vertically or squashed horizontally), it is likely due to one of the following reasons relating to how Puppeteer (Chrome Headless) handles page scaling and dimensions.

## 1. CSS Height Restriction vs. Content Overflow
**The Problem:**
The CSS contains this class:
```css
.page {
    height: 297mm; /* Fixed A4 height */
    overflow: hidden; /* Clips anything that exceeds this height */
    ...
}
```
**Reason:** If the dynamic data (e.g., the table of disciplines) creates content that is taller than `297mm` (minus padding), the `overflow: hidden` property will simply **cut off** the rest of the content, making the page look "half empty" or cut in the middle.

## 2. Default Viewport Mismatch
**The Problem:**
Puppeteer launches with a default viewport (usually 800x600) if not specified.
**Reason:** When rendering the PDF, if the browser thinks the window is only 600px tall, it might layout the content differently or trigger scrollbars (which don't print), causing layout shifts. For A4 printing, the viewport should ideally match A4 dimensions (~794px width).

## 3. DPI / Scale Factor
**The Problem:**
HTML `210mm` might not map 1:1 to the PDF `A4` format if the scale is off.
**Reason:** Browsers behave differently regarding DPI (96 vs 72 vs higher). Sometimes the content renders "small" (taking up only half the width) because the browser thinks the paper is huge compared to the pixels defined.

---

## Recommended Fixes (Applied)

To resolve this, we should:

1.  **Set the Viewport Explicitly:** Force Puppeteer to "see" a full A4 page.
2.  **Use Print Media Styles:** Tell the browser explicitly via CSS that this is an A4 page.
3.  **Adjust PDF Options:** Use `preferCSSPageSize: true` to respect the CSS dimensions exactly.
4.  **Remove Hidden Overflow:** Allow content to flow (or ensure it fits).

I will now apply these fixes to your `pdf.service.js`.
