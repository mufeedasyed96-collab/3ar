const fs = require('fs');
const pdfExtractor = require('pdf-parse');
const { createWorker } = require('tesseract.js');
const { createCanvas, Image } = require('canvas');
const pdfjs = require('pdfjs-dist/legacy/build/pdf.js');

/**
 * Extracts text from a PDF file.
 * @param {string} filePath 
 * @returns {Promise<string>}
 */
async function extractTextFromPDF(filePath) {
    if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
    }
    const dataBuffer = fs.readFileSync(filePath);
    try {
        let data;
        if (typeof pdfExtractor === 'function') {
            data = await pdfExtractor(dataBuffer);
        } else {
            // Fallback or handle as error to trigger OCR
            throw new Error('pdf-parse is not a function');
        }
        // If extracted text is very short, it might be a scanned PDF
        if (!data.text || data.text.trim().length < 50) {
            console.log("PDF text extraction yielded little text, attempting OCR via Image conversion...");
            return await performOCRFromPDF(filePath);
        }
        return data.text;
    } catch (error) {
        console.error("Error parsing PDF text, attempting OCR via Image conversion:", error.message);
        return await performOCRFromPDF(filePath);
    }
}

/**
 * Converts the first page of a PDF to an image and performs OCR.
 * @param {string} filePath 
 * @returns {Promise<string>}
 */
async function performOCRFromPDF(filePath) {
    const data = new Uint8Array(fs.readFileSync(filePath));
    const loadingTask = pdfjs.getDocument({
        data,
        useSystemFonts: true,
        disableFontFace: true,
    });

    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better OCR
    const canvas = createCanvas(viewport.width, viewport.height);
    const context = canvas.getContext('2d');

    await page.render({
        canvasContext: context,
        viewport: viewport,
    }).promise;

    const buffer = canvas.toBuffer('image/png');

    const worker = await createWorker('eng');
    const { data: { text } } = await worker.recognize(buffer);
    await worker.terminate();

    return text;
}

/**
 * Performs OCR on an image.
 * @param {string} filePath 
 * @returns {Promise<string>}
 */
async function performOCR(filePath) {
    const buffer = fs.readFileSync(filePath);
    const worker = await createWorker('eng');
    const { data: { text } } = await worker.recognize(buffer);
    await worker.terminate();
    return text;
}

module.exports = {
    extractTextFromPDF,
    performOCR
};
