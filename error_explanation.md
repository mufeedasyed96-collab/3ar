# Error Analysis: Navigation Timeout in Certificate Generation

## Error Details
**Error Message:** `Error: Internal server error: Navigation timeout of 60000 ms exceeded`  
**Location:** backend/mi3ar/miyar_backend/services/pdf.service.js (Puppeteer execution)

## Root Cause
The error occurs during the certificate PDF generation process. The system uses **Puppeteer** (a headless Chrome browser) to render an HTML template into a PDF file.

The process is configured to wait for the network to be "idle" (no more than 2 active connections) before generating the PDF, with a **60-second (60000 ms) timeout**.

The timeout is being triggered because the HTML template attempts to fetch **external resources** over the internet, and these requests are failing to complete within 60 seconds. This is likely due to:
1.  **Restricted Internet Access:** The server running the backend may have a firewall or network policy blocking access to external domains.
2.  **Slow/Unresponsive External Services:** The external services being called are timing out.

## Specific Blockers
Upon analyzing `pdf.service.js`, the following external dependencies were identified in the HTML template:

1.  **External QR Code API:**
    -   **Line 439:** `const qrCodeUrl = 'https://api.qrserver.com/v1/create-qr-code/...'`
    -   The template tries to load an image from `api.qrserver.com`. If this API is down, slow, or blocked by the server's network, Puppeteer will hang waiting for the image to load.

2.  **Google Fonts:**
    -   **Line 652:** `@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');`
    -   The CSS attempts to fetch the "Outfit" font from Google's servers. If `fonts.googleapis.com` is unreachable, the browser will wait for the stylesheet to load.

## Recommended Solution
To fix this permanently and make the system offline-capable/robust:

1.  **Generate QR Codes Locally:** Replace the external `api.qrserver.com` call with a local Node.js library like `qrcode` (npm install qrcode) to generate the QR code string as a Base64 Data URI directly in the code.
2.  **Embed or Replace Fonts:** Remove the Google Fonts import. Either use standard system fonts (e.g., Arial, sans-serif) or download the font files, place them in the `uploads/report_assets` folder, and embed them as Base64 in the CSS.

## Temporary Workaround
If changing the code is not immediately possible, ensuring the server has stable access to `api.qrserver.com` and `fonts.googleapis.com` will resolve the issue.
