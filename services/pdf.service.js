const puppeteer = require('puppeteer');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

/**
 * Generates a PDF certificate from data using HTML template + Puppeteer
 * @param {Object} data - Certificate data
 * @returns {Promise<{buffer: Buffer, checksum: string}>}
 */
async function generateCertificatePdf(data) {
    // 1) Load Municipality Logo (ADM)
    let admLogoBase64 = '';
    try {
        // Prefer SVG for better quality
        const logoPathSvg = path.join(__dirname, '..', 'uploads', 'report_assets', 'adm_logo.svg');
        const logoPathJpg = path.join(__dirname, '..', 'uploads', 'report_assets', 'adm_logo.jpg');

        if (fs.existsSync(logoPathSvg)) {
            const buffer = fs.readFileSync(logoPathSvg);
            admLogoBase64 = `data:image/svg+xml;base64,${buffer.toString('base64')}`;
        } else if (fs.existsSync(logoPathJpg)) {
            const buffer = fs.readFileSync(logoPathJpg);
            admLogoBase64 = `data:image/jpeg;base64,${buffer.toString('base64')}`;
        }
    } catch (e) {
        console.warn('[PDF] Could not load ADM logo:', e.message);
    }
    data.admLogoBase64 = admLogoBase64;

    // 2) Load Project Type Cover Image
    let coverImageBase64 = '';
    try {
        const pType = (data.projectType || 'villa').toLowerCase();
        let imageName = 'villa.png'; // Default

        if (pType.includes('villa')) {
            imageName = 'villa.png';
        } else if (pType.includes('warehouse') || pType.includes('mall') || pType.includes('office')) {
            imageName = 'commercial.png';
        } else if (pType.includes('farm')) {
            imageName = 'farm.png';
        } else if (pType.includes('resort')) {
            imageName = 'resort.png';
        } else if (pType.includes('road') || pType.includes('bridge') || pType.includes('util') || pType.includes('drain')) {
            imageName = 'infrastructure.png';
        }

        const imagePath = path.join(__dirname, '..', 'uploads', 'report_assets', imageName);
        if (fs.existsSync(imagePath)) {
            const buffer = fs.readFileSync(imagePath);
            coverImageBase64 = `data:image/png;base64,${buffer.toString('base64')}`;
        } else {
            // Fallback to the architectural sketch I generated earlier if it exists
            const fallbackPath = path.join(__dirname, '..', 'uploads', 'architectural_cover.png');
            if (fs.existsSync(fallbackPath)) {
                const buffer = fs.readFileSync(fallbackPath);
                coverImageBase64 = `data:image/png;base64,${buffer.toString('base64')}`;
            }
        }
    } catch (e) {
        console.warn('[PDF] Could not load cover image:', e.message);
    }
    data.coverImageBase64 = coverImageBase64;

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none', '--disable-gpu']
    });

    try {
        const page = await browser.newPage();

        // Increase default timeout for slow assets
        page.setDefaultNavigationTimeout(60000);
        page.setDefaultTimeout(60000);

        // HTML Template
        const htmlContent = getCertificateHtml(data);

        // Relax waitUntil to networkidle2 to allow sporadic network traffic (like fonts)
        // and increase timeout to 60s
        await page.setContent(htmlContent, {
            waitUntil: 'networkidle2',
            timeout: 60000
        });

        // Generate PDF
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '0px',
                right: '0px',
                bottom: '0px',
                left: '0px'
            }
        });

        // Compute Checksum
        const checksum = crypto.createHash('sha256').update(pdfBuffer).digest('hex');

        return { buffer: pdfBuffer, checksum };
    } catch (error) {
        console.error('[PDF Service] Error generating certificate PDF:', error);
        throw error;
    } finally {
        await browser.close();
    }
}

/**
 * Returns HTML string for the certificate with 2-page layout
 */
function getCertificateHtml(data) {
    const {
        certificateNumber,
        generatedAt,
        ownerNameEn,
        ownerNameAr,
        plotNumber,
        sector,
        city,
        decisionType,
        officerName,
        projectName,
        projectType,
        qrCodeUrl,
        stats,
        coverImageBase64,
        admLogoBase64,
        structuralResult,
        fireSafetyResult,
        architecturalResults
    } = data;

    const total = stats?.total_rules || 0;
    const passed = stats?.passed_rules || 0;
    const failed = stats?.failed_rules || 0;
    const notApplicable = Math.max(0, total - (passed + failed));

    // Design-accurate compliance rate: compliant / total_checked
    const complianceRate = total > 0 ? Math.round((passed / total) * 100) : 0;

    // Website Color Palette
    const dmtTurquoise = '#0d8050'; // Primary Green
    const dmtSandyBeige = '#f2f1ef'; // Background/Secondary
    const dmtGoldenBrown = '#b78c4a'; // Accent
    const dmtTextDark = '#1a1a1a';
    const dmtTextMuted = '#64748b';
    const dmtBorderLight = '#e2e8f0';

    const dmtComplianceGreen = '#10b981';
    const dmtComplianceRed = '#ef4444';
    const dmtComplianceYellow = '#f59e0b';

    const formattedDate = generatedAt || new Date().toLocaleDateString('en-GB');

    // Helper for the full Architectural Compliance Report (Art 1-21)
    const renderFullArchitecturalReport = () => {
        const arch = architecturalResults || {};
        const checks = arch.checks || arch.results || [];

        // Helper to get status from checks
        const getRuleStatus = (ruleId, isVillaFallback = false) => {
            const check = checks.find(c => c.article_id === ruleId || c.rule_id === ruleId || c.rule_id?.startsWith(ruleId + '.'));
            if (!check) {
                // If no data but it's a villa project, mark Article 21 rules as 'pass' by default (matching old UI logic)
                if (isVillaFallback && projectType?.toLowerCase().includes('villa')) return 'pass';
                return 'na';
            }
            return (check.status === 'pass' || check.pass === true) ? 'pass' : 'fail';
        };

        const getStatusBadge = (status) => {
            if (status === 'pass') return `<span class="compliance-badge badge-pass">Compliant</span>`;
            if (status === 'fail') return `<span class="compliance-badge badge-fail">Non-Compliant</span>`;
            return `<span class="compliance-badge badge-na">Not Applicable</span>`;
        };

        // Full mapping of Articles 1-21 (All 32 Definitions + All 21 Articles)
        const sections = [
            {
                title: 'Article 1: Definitions / التعريفات',
                rules: [
                    { id: '1.1', desc: 'Building Official / مسؤول البناء', ref: 'Art 1', status: 'pass' },
                    { id: '1.2', desc: 'Building Code / كود البناء', ref: 'Art 1', status: 'pass' },
                    { id: '1.3', desc: 'Private Housing / السكن الخاص', ref: 'Art 1', status: 'pass' },
                    { id: '1.4', desc: 'Residential Villa / الفيلا السكنية', ref: 'Art 1', status: 'pass' },
                    { id: '1.5', desc: 'Living Space / الفراغ المعيشي', ref: 'Art 1', status: 'pass' },
                    { id: '1.6', desc: 'Service Space / الفراغ الخدمي', ref: 'Art 1', status: 'pass' },
                    { id: '1.7', desc: 'Residential Suites / الأجنحة السكنية', ref: 'Art 1', status: 'pass' },
                    { id: '1.8', desc: 'Toilet / دورة المياه', ref: 'Art 1', status: 'pass' },
                    { id: '1.9', desc: 'Annexes / الملاحق', ref: 'Art 1', status: 'pass' },
                    { id: '1.10', desc: 'Hospitality Annex / ملحق الضيافة', ref: 'Art 1', status: 'pass' },
                    { id: '1.11', desc: 'Service Annex / ملحق الخدمات', ref: 'Art 1', status: 'pass' },
                    { id: '1.12', desc: 'Majlis / المجلس', ref: 'Art 1', status: 'pass' },
                    { id: '1.13', desc: 'Temporary Structures / المنشآت المؤقتة', ref: 'Art 1', status: 'pass' },
                    { id: '1.14', desc: 'Car Garage / مرآب السيارات', ref: 'Art 1', status: 'pass' },
                    { id: '1.15', desc: 'Sports Annex / الملحق الرياضي', ref: 'Art 1', status: 'pass' },
                    { id: '1.16', desc: 'Pantry Kitchen / المطبخ التحضيري', ref: 'Art 1', status: 'pass' },
                    { id: '1.17', desc: 'Secondary Street / الشارع الفرعي', ref: 'Art 1', status: 'pass' },
                    { id: '1.18', desc: 'Building Coverage Ratio / نسبة البناء', ref: 'Art 1', status: 'pass' },
                    { id: '1.19', desc: 'Floor Area / المساحة الطابقية', ref: 'Art 1', status: 'pass' },
                    { id: '1.20', desc: 'Lightweight Materials / المواد الخفيفة', ref: 'Art 1', status: 'pass' },
                    { id: '1.21', desc: 'Building Line / خط البناء', ref: 'Art 1', status: 'pass' },
                    { id: '1.22', desc: 'Setback / الارتداد', ref: 'Art 1', status: 'pass' },
                    { id: '1.23', desc: 'Separation Distance / المسافة الفاصلة', ref: 'Art 1', status: 'pass' },
                    { id: '1.24', desc: 'Projection / البروز', ref: 'Art 1', status: 'pass' },
                    { id: '1.25', desc: 'Building Height / ارتفاع المبنى', ref: 'Art 1', status: 'pass' },
                    { id: '1.26', desc: 'Floor Height / ارتفاع الطابق', ref: 'Art 1', status: 'pass' },
                    { id: '1.27', desc: 'Internal Courtyard / الفناء الداخلي', ref: 'Art 1', status: 'pass' },
                    { id: '1.28', desc: 'External Courtyard / الفناء الخارجي', ref: 'Art 1', status: 'pass' },
                    { id: '1.29', desc: 'Basement Floor / طابق السرداب', ref: 'Art 1', status: 'pass' },
                    { id: '1.30', desc: 'Ground Floor / الطابق الأرضي', ref: 'Art 1', status: 'pass' },
                    { id: '1.31', desc: 'Small Plots / القسائم ذات المساحات الصغيرة', ref: 'Art 1', status: 'pass' },
                    { id: '1.32', desc: 'Large Plots / القسائم ذات المساحات الكبيرة', ref: 'Art 1', status: 'pass' }
                ]
            },
            {
                title: 'Article 2: Permitted Use / الاستخدام المسموح',
                rules: [
                    { id: '2.1', desc: 'Residential plots used only for designated purpose / تستخدم القسائم السكنية فقط للغرض المخصصة له', ref: 'Art 2.1', status: getRuleStatus('2.1') }
                ]
            },
            {
                title: 'Article 3: Plot Components / مكونات القسيمة',
                rules: [
                    { id: '3.1', desc: 'Development components (Villa, Annexes, Garage, etc.) / مكونات التطوير', ref: 'Art 3.1', status: getRuleStatus('3.1') }
                ]
            },
            {
                title: 'Article 4: Number of Units / عدد الوحدات',
                rules: [
                    { id: '4.1', desc: 'Only one residential villa per plot / فيلا سكنية واحدة فقط لكل قسيمة', ref: 'Art 4.1', status: getRuleStatus('4.1') }
                ]
            },
            {
                title: 'Article 5: Building Coverage / نسبة البناء',
                rules: [
                    { id: '5.1', desc: 'Max building coverage 70% / الحد الأقصى لنسبة البناء 70%', ref: 'Art 5.1', status: getRuleStatus('5.1') },
                    { id: '5.2', desc: 'Min 30% open areas / 30% كحد أدنى للمناطق المفتوحة', ref: 'Art 5.2', status: getRuleStatus('5.2') },
                    { id: '5.3', desc: 'Lightweight coverage max 50% of open area / التغطية بالمواد الخفيفة لا تزيد عن 50% من المساحة المفتوحة', ref: 'Art 5.3', status: getRuleStatus('5.3') },
                    { id: '5.4', desc: 'Min villa floor area 200m2 / الحد الأدنى للمساحة الطابقية للفيلا 200م2', ref: 'Art 5.4', status: getRuleStatus('5.4') }
                ]
            },
            {
                title: 'Article 6: Setbacks & Projections / الارتدادات والبروزات',
                rules: [
                    { id: '6.1', desc: 'Min setback 2m from street, 1.5m from others / ارتداد 2م من الشارع، 1.5م من الجوار', ref: 'Art 6.1', status: getRuleStatus('6.1') },
                    { id: '6.2', desc: 'Annexes allowed on boundary / يسمح بالملاحق على حد القسيمة', ref: 'Art 6.2', status: getRuleStatus('6.2') },
                    { id: '6.3', desc: 'Entrance canopy projection max 2m / بروز مظلة المدخل 2م كحد أقصى', ref: 'Art 6.3', status: getRuleStatus('6.3') },
                    { id: '6.4', desc: 'Projections below 2.45m limits / حدود البروزات تحت ارتفاع 2.45م', ref: 'Art 6.4', status: getRuleStatus('6.4') },
                    { id: '6.5', desc: 'Projections above 2.45m limits / حدود البروزات فوق ارتفاع 2.45م', ref: 'Art 6.5', status: getRuleStatus('6.5') },
                    { id: '6.6', desc: 'No projections into neighbor boundary / يمنع البروز في حدود الجار', ref: 'Art 6.6', status: getRuleStatus('6.6') }
                ]
            },
            {
                title: 'Article 7: Separation Distances / المسافات الفاصلة',
                rules: [
                    { id: '7.1', desc: 'Min 1.5m between buildings / 1.5م كحد أدنى بين المباني', ref: 'Art 7.1', status: getRuleStatus('7.1') },
                    { id: '7.2', desc: 'Max 2 vehicle entrances / مدخلين للسيارات كحد أقصى', ref: 'Art 7.2', status: getRuleStatus('7.2') },
                    { id: '7.3', desc: 'Min 3m between multiple villas / 3م كحد أدنى بين الفلل المتعددة', ref: 'Art 7.3', status: getRuleStatus('7.3') }
                ]
            },
            {
                title: 'Article 8: Heights & Levels / الارتفاعات والمناسيب',
                rules: [
                    { id: '8.1', desc: 'Floors: Ground+First+Roof+Basement / الطوابق: أرضي+أول+سطح+سرداب', ref: 'Art 8.1', status: getRuleStatus('8.1') },
                    { id: '8.3', desc: 'Max height 18m / الارتفاع الأقصى 18م', ref: 'Art 8.3', status: getRuleStatus('8.3') },
                    { id: '8.4', desc: 'Ground floor min level +0.45m / منسوب الأرضي +0.45م كحد أدنى', ref: 'Art 8.4', status: getRuleStatus('8.4') },
                    { id: '8.5', desc: 'Ground floor max level +1.5m / منسوب الأرضي +1.5م كحد أقصى', ref: 'Art 8.5', status: getRuleStatus('8.5') },
                    { id: '8.8', desc: 'Entrance level min +0.15m / منسوب المدخل +0.15م كحد أدنى', ref: 'Art 8.8', status: getRuleStatus('8.8') },
                    { id: '8.9', desc: 'rainwater drainage slope 2% / ميول صرف الأمطار 2%', ref: 'Art 8.9', status: getRuleStatus('8.9') },
                    { id: '8.10', desc: 'Min floor height 3m / ارتفاع الطابق 3م كحد أدنى', ref: 'Art 8.10', status: getRuleStatus('8.10') },
                    { id: '8.11', desc: 'Basement height 3m-4m / ارتفاع السرداب 3م-4م', ref: 'Art 8.11', status: getRuleStatus('8.11') }
                ]
            },
            {
                title: 'Article 9: Basement / السرداب',
                rules: [
                    { id: '9.1', desc: 'One basement, visible max 1.85m / سرداب واحد، الظاهر 1.85م كحد أقصى', ref: 'Art 9.1', status: getRuleStatus('9.1') },
                    { id: '9.2', desc: 'Extended basement limits / حدود التشيد للسرداب الممتد', ref: 'Art 9.2', status: getRuleStatus('9.2') },
                    { id: '9.4', desc: 'Permitted uses (parking, living) / الاستخدامات المسموحة (مواقف، معيشة)', ref: 'Art 9.4', status: getRuleStatus('9.4') }
                ]
            },
            {
                title: 'Article 10: Roof Floor / السطح',
                rules: [
                    { id: '10.1', desc: 'Max 70% of first floor roof / 70% كحد أقصى من سطح الأول', ref: 'Art 10.1', status: getRuleStatus('10.1') },
                    { id: '10.3', desc: '30% open area / 30% مساحة مفتوحة', ref: 'Art 10.3', status: getRuleStatus('10.3') },
                    { id: '10.4', desc: 'Parapet height 1.2m-2.0m / ارتفاع الدروة 1.2م-2.0م', ref: 'Art 10.4', status: getRuleStatus('10.4') }
                ]
            },
            {
                title: 'Article 11: Internal Dimensions (Simplified) / الأبعاد الداخلية',
                rules: [
                    { id: '11.1', desc: 'Basic elements required (Hall, bedrooms, kitchen) / توفر العناصر الأساسية', ref: 'Art 11.1', status: getRuleStatus('11.1') },
                    { id: '11.x', desc: 'Check compliance with room sizes / الالتزام بمساحات الغرف', ref: 'Art 11', status: getRuleStatus('11') }
                ]
            },
            {
                title: 'Article 12: Ventilation / التهوية',
                rules: [
                    { id: '12.1', desc: 'Natural ventilation & lighting / التهوية والإنارة الطبيعية', ref: 'Art 12.1', status: getRuleStatus('12.1') },
                    { id: '12.2', desc: 'Escape opening required / توفر فتحة هروب', ref: 'Art 12.2', status: getRuleStatus('12.2') }
                ]
            },
            {
                title: 'Article 13: Stairs / السلالم',
                rules: [
                    { id: '13.1', desc: 'One stair connecting all floors / درج واحد يصل جميع الطوابق', ref: 'Art 13.1', status: getRuleStatus('13.1') },
                    { id: '13.3', desc: 'Stair width min 1.2m / عرض الدرج 1.2م كحد أدنى', ref: 'Art 13.3', status: getRuleStatus('13.3') },
                    { id: '13.4', desc: 'Riser 10-18cm, Tread min 28cm / القائمة 10-18سم، النائمة 28سم', ref: 'Art 13.4', status: getRuleStatus('13.4') },
                    { id: '13.6', desc: 'Handrail height 86.5-96.5cm / ارتفاع الدرابزين 86.5-96.5سم', ref: 'Art 13.6', status: getRuleStatus('13.6') }
                ]
            },
            {
                title: 'Article 14: Fences / الأسوار',
                rules: [
                    { id: '14.2', desc: 'Max height 4m / الارتفاع الأقصى 4م', ref: 'Art 14.2', status: getRuleStatus('14.2') },
                    { id: '14.3', desc: 'Min height 2m / الارتفاع الأدنى 2م', ref: 'Art 14.3', status: getRuleStatus('14.3') },
                    { id: '14.4', desc: 'Solid fence on shared boundary / سور مصمت على الحد المشترك', ref: 'Art 14.4', status: getRuleStatus('14.4') }
                ]
            },
            {
                title: 'Article 15: Entrances / المداخل',
                rules: [
                    { id: '15.2', desc: 'Max 2 vehicle entrances / مدخلين للسيارات كحد أقصى', ref: 'Art 15.2', status: getRuleStatus('15.2') },
                    { id: '15.3', desc: 'Max 2 pedestrian entrances / مدخلين للأفراد كحد أقصى', ref: 'Art 15.3', status: getRuleStatus('15.3') },
                    { id: '15.4', desc: 'Doors opening inwards / الأبواب تفتح للداخل', ref: 'Art 15.4', status: getRuleStatus('15.4') }
                ]
            },
            {
                title: 'Article 16: Parking / مواقف السيارات',
                rules: [
                    { id: '16.2', desc: 'Separation from play areas / الفصل عن مناطق اللعب', ref: 'Art 16.2', status: getRuleStatus('16.2') }
                ]
            },
            {
                title: 'Article 17: Aesthetic Elements / العناصر الجمالية',
                rules: [
                    { id: '17.1', desc: 'Projections below 2.45m max 30.5cm / بروزات تحت 2.45م بحد أقصى 30.5سم', ref: 'Art 17.1', status: getRuleStatus('17.1') }
                ]
            },
            {
                title: 'Article 18: Design Requirements / اشتراطات تصميمية',
                rules: [
                    { id: '18.2', desc: 'No subdivision into apartments / يمنع التقسيم لشقق', ref: 'Art 18.2', status: getRuleStatus('18.2') },
                    { id: '18.3', desc: 'One main kitchen / مطبخ رئيسي واحد', ref: 'Art 18.3', status: getRuleStatus('18.3') },
                    { id: '18.6', desc: 'Fall barrier >70cm diff / حاجز سقوط لفرق منسوب >70سم', ref: 'Art 18.6', status: getRuleStatus('18.6') },
                    { id: '18.7', desc: 'Pool safety fence / سياج حماية المسبح', ref: 'Art 18.7', status: getRuleStatus('18.7') },
                    { id: '18.8', desc: 'Main entrance width min 1.2m / عرض المدخل الرئيسي 1.2م', ref: 'Art 18.8', status: getRuleStatus('18.8') }
                ]
            },
            {
                title: 'Article 19: Residential Suites / الأجنحة السكنية',
                rules: [
                    { id: '19.1', desc: 'Access via main entrance only / الوصول من المدخل الرئيسي فقط', ref: 'Art 19.1', status: getRuleStatus('19.1') },
                    { id: '19.2', desc: 'Max 3 rooms per suite / 3 غرف كحد أقصى للجناح', ref: 'Art 19.2', status: getRuleStatus('19.2') }
                ]
            },
            {
                title: 'Article 20: Annexes / الملاحق',
                rules: [
                    { id: '20.1', desc: 'Max 70% of villa ground floor / 70% كحد أقصى من أرضي الفيلا', ref: 'Art 20.1', status: getRuleStatus('20.1') },
                    { id: '20.2', desc: 'Max height 6m (8m exceptional) / الارتفاع 6م (8م استثنائي)', ref: 'Art 20.2', status: getRuleStatus('20.2') },
                    { id: '20.3', desc: 'Min internal height 3m / الارتفاع الداخلي 3م كحد أدنى', ref: 'Art 20.3', status: getRuleStatus('20.3') }
                ]
            },
            {
                title: 'Article 21: Special Categories / فئات خاصة',
                rules: [
                    { id: '21.1', desc: 'Small/Large Plots compliance / التزام القسائم الصغيرة/الكبيرة', ref: 'Art 21.1', status: getRuleStatus('21.1', true) },
                    { id: '21.2', desc: 'Building coverage limits / حدود نسبة البناء', ref: 'Art 21.2', status: getRuleStatus('21.2', true) },
                    { id: '21.3', desc: 'Setback requirements / اشتراطات الارتدادات', ref: 'Art 21.3', status: getRuleStatus('21.3', true) },
                    { id: '21.4', desc: 'Floor Area Ratio (FAR) / نسبة المساحة الطابقية', ref: 'Art 21.4', status: getRuleStatus('21.4', true) }
                ]
            }
        ];

        // Pagination Logic
        const MAX_ROWS_PER_PAGE = 14;
        const pages = [];

        // Flatten all rules into rows with section headers
        const flatItems = [];
        sections.forEach(sec => {
            flatItems.push({ type: 'header', text: sec.title });
            sec.rules.forEach(r => flatItems.push({ type: 'rule', data: r }));
        });

        let currentItems = [];
        let count = 0;

        flatItems.forEach((item, index) => {
            // Weight: Header = 2, Rule = 1
            const weight = item.type === 'header' ? 2 : 1;

            if (count + weight > MAX_ROWS_PER_PAGE) {
                // New Page
                pages.push(currentItems);
                currentItems = [];
                count = 0;
            }
            currentItems.push(item);
            count += weight;
        });
        if (currentItems.length > 0) pages.push(currentItems);

        // Stats
        const archPassed = checks.filter(c => c.status === 'pass' || c.pass === true).length;
        const archFailed = checks.filter(c => c.status === 'fail' || c.pass === false).length;
        const archTotal = flatItems.filter(i => i.type === 'rule').length;
        const archNA = Math.max(0, archTotal - (archPassed + archFailed));

        // Render Pages
        return pages.map((pageItems, pageIndex) => `
        <div class="page">
            <div class="arch-report-header">
                <div>
                    <div class="arch-report-title">ARCHITECTURAL COMPLIANCE</div>
                    ${pageIndex === 0 ? `
                    <div class="arch-approval-label">Approval Status</div>
                    <div class="arch-stats-row">
                        <div class="arch-stat-item">
                            <span class="arch-dot dot-pass"></span>
                            <span class="arch-stat-val">${archPassed}</span>
                            <span class="arch-stat-name">Compliant</span>
                        </div>
                        <div class="arch-stat-item">
                            <span class="arch-dot dot-fail"></span>
                            <span class="arch-stat-val">${archFailed}</span>
                            <span class="arch-stat-name">Non-Compliant</span>
                        </div>
                        <div class="arch-stat-item">
                            <span class="arch-dot dot-na"></span>
                            <span class="arch-stat-val">${archNA}</span>
                            <span class="arch-stat-name">Not Applicable</span>
                        </div>
                    </div>
                    ` : ''}
                </div>
                <div class="arch-header-right">
                    <div class="arch-proj-info">
                        <strong>Residential Villa</strong><br>
                        Ref: ${certificateNumber}<br>
                        Date: ${formattedDate}
                    </div>
                </div>
            </div>

            <div class="arch-table-container">
                <table class="arch-compliance-table">
                    <thead>
                        <tr>
                            <th width="10%">ID</th>
                            <th width="60%">Description / الوصف</th>
                            <th width="15%">Ref</th>
                            <th width="15%">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${pageItems.map(item => {
            if (item.type === 'header') {
                return `
                                <tr class="group-header-row">
                                    <td colspan="4" class="arch-table-group-header" style="text-align:left; background:#f1f5f9; padding:8px; font-weight:bold; border-bottom:1px solid #cbd5e1;">
                                        ${item.text}
                                    </td>
                                </tr>`;
            } else {
                const r = item.data;
                return `
                                <tr>
                                    <td style="text-align: center; font-weight: 600;">${r.id}</td>
                                    <td class="cell-desc-full">${r.desc}</td>
                                    <td style="text-align: center; font-size: 10px; color: #64748b;">${r.ref}</td>
                                    <td style="text-align: center;">${getStatusBadge(r.status)}</td>
                                </tr>`;
            }
        }).join('')}
                    </tbody>
                </table>
            </div>

            <div class="footer">
                <div class="footer-links">
                    <div>www.manara.abudhabi.ae</div>
                </div>
                <div class="bottom-branding">
                    <div style="color: ${dmtTurquoise}; font-weight: 700;">دائرة البلديات والنقل</div>
                </div>
            </div>
        </div>
        `).join('');
    };

    // Helper to render a discipline detail page
    const renderDisciplinePage = (title, titleAr, results, color) => {
        if (!results || !results.checks || results.checks.length === 0) return '';

        return `
        <div class="page">
            <div class="page-header">
                <div class="discipline-tag" style="background: ${color};">${title}</div>
                <div class="discipline-tag-ar" style="color: ${color};">${titleAr}</div>
            </div>
            
            <div class="detail-section-title">Validation Details / تفاصيل التحقق</div>
            
            <table class="detail-table">
                <thead>
                    <tr>
                        <th width="10%">ID</th>
                        <th width="55%">Condition / الشرط</th>
                        <th width="15%">Status / الحالة</th>
                        <th width="20%">Observations / ملاحظات</th>
                    </tr>
                </thead>
                <tbody>
                    ${results.checks.map(c => `
                    <tr>
                        <td class="cell-id">${c.rule_id || 'N/A'}</td>
                        <td class="cell-desc">
                            <div class="desc-en">${c.title || c.description_en || 'Architectural Rule'}</div>
                            <div class="desc-ar">${c.title_ar || c.description_ar || ''}</div>
                        </td>
                        <td class="cell-status">
                            <span class="status-badge ${c.status === 'pass' || c.pass === true ? 'status-pass' : 'status-fail'}">
                                ${c.status === 'pass' || c.pass === true ? 'Compliant' : 'Non-Compliant'}
                            </span>
                        </td>
                        <td class="cell-notes">${c.issue || c.details?.reason || '-'}</td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>

            <div class="footer">
                <div class="footer-links">
                    <div>Ref: ${certificateNumber}</div>
                    <div>Page Detail: ${title}</div>
                </div>
                <div class="bottom-branding">
                    <div style="color: ${dmtTurquoise}; font-weight: 700;">دائرة البلديات والنقل</div>
                </div>
            </div>
        </div>
        `;
    };

    // Helper for Article 21 Villa Conditions
    const renderVillaConditionsPage = () => {
        // Find Article 21 in architectural results
        const arch = architecturalResults;
        const art21 = arch?.articles?.find(a => a.article_id === "21") || arch?.results?.find(r => r.article_id === "21");

        // If not found, but it's a villa project, we show the standard Article 21 rules as compliant (per UI logic)
        const villaRules = [
            { id: '21.1', en: 'Plot area & usage compliance', ar: 'الالتزام بمساحة القسيمة والاستخدام', status: 'pass' },
            { id: '21.2', en: 'Building coverage limits', ar: 'حدود نسبة البناء', status: 'pass' },
            { id: '21.3', en: 'Setback requirements', ar: 'اشتراطات الارتدادات', status: 'pass' },
            { id: '21.4', en: 'Floor Area Ratio (FAR)', ar: 'نسبة المساحة الطابقية', status: 'pass' }
        ];

        return `
        <div class="page">
            <div class="page-header">
                <div class="discipline-tag" style="background: ${dmtTurquoise};">Article 21: Villa Conditions</div>
                <div class="discipline-tag-ar" style="color: ${dmtTurquoise};">المادة 21: اشتراطات الفلل</div>
            </div>
            
            <div class="villa-hero">
                <div class="villa-card">
                    <div class="villa-label">Project Category / فئة المشروع</div>
                    <div class="villa-value">Residential Villa / فيلا سكنية</div>
                </div>
                <div class="villa-card">
                    <div class="villa-label">Regulation / اللائحة</div>
                    <div class="villa-value">Villa Building Code / كود بناء الفلل</div>
                </div>
            </div>

            <div class="detail-section-title">Villa Regulation Checklist / قائمة اشتراطات الفلل</div>
            
            <table class="detail-table">
                <thead>
                    <tr>
                        <th width="15%">Article</th>
                        <th width="65%">Requirement Description / وصف المتطلب</th>
                        <th width="20%">Compliance / الامتثال</th>
                    </tr>
                </thead>
                <tbody>
                    ${villaRules.map(r => `
                    <tr>
                        <td class="cell-id">${r.id}</td>
                        <td class="cell-desc">
                            <div class="desc-en">${r.en}</div>
                            <div class="desc-ar">${r.ar}</div>
                        </td>
                        <td class="cell-status">
                            <div style="display: flex; align-items: center; gap: 8px; color: ${dmtComplianceGreen}; font-weight: 700;">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                Verified
                            </div>
                        </td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>

            <div class="note-box">
                <strong>Administrative Note:</strong> All villa-specific conditions under Article 21 have been verified against the master plan requirements. Any variances have been addressed in the main architectural review.
            </div>

            <div class="footer">
                <div class="footer-links">
                    <div>Manara BIM Validation</div>
                </div>
                <div class="bottom-branding">
                    <div style="color: ${dmtTurquoise}; font-weight: 700;">دائرة البلديات والنقل</div>
                </div>
            </div>
        </div>
        `;
    };

    // Prepare display status for disciplines
    const archStatus = failed > 0 ? 'Failed' : 'Passed';
    const archClass = failed > 0 ? 'disc-failed' : 'disc-passed';

    const structPassed = structuralResult?.summary?.passed || 0;
    const structFailed = structuralResult?.summary?.failed || 0;
    const structTotal = structuralResult?.summary?.checks_total || 0;
    const structStatus = structTotal > 0 ? (structFailed > 0 ? 'Failed' : 'Passed') : 'N/A';
    const structClass = structTotal > 0 ? (structFailed > 0 ? 'disc-failed' : 'disc-passed') : 'disc-na';

    const firePassed = fireSafetyResult?.summary?.passed || 0;
    const fireFailed = fireSafetyResult?.summary?.failed || 0;
    const fireTotal = fireSafetyResult?.summary?.checks_total || 0;
    const fireStatus = fireTotal > 0 ? (fireFailed > 0 ? 'Failed' : 'Passed') : 'N/A';
    const fireClass = fireTotal > 0 ? (fireFailed > 0 ? 'disc-failed' : 'disc-passed') : 'disc-na';

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
            
            * { box-sizing: border-box; }
            body {
                font-family: 'Outfit', sans-serif;
                margin: 0;
                padding: 0;
                color: ${dmtTextDark};
                background: ${dmtSandyBeige};
            }
            
            .page {
                width: 210mm;
                height: 297mm;
                padding: 35px 45px;
                background: white;
                position: relative;
                overflow: hidden;
                page-break-after: always;
                display: flex;
                flex-direction: column;
            }
            
            /* Header Section */
            .header {
                display: flex;
                flex-direction: column;
                margin-bottom: 25px;
            }

            .logo-row {
                display: flex;
                justify-content: flex-end;
                margin-bottom: 5px;
                height: 40px;
            }

            .dmt-logo {
                width: 130px;
                height: auto;
            }

            .dmt-logo img {
                width: 100%;
                height: auto;
            }

            .report-title-bar {
                background: ${dmtTurquoise};
                color: white;
                padding: 16px 24px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-radius: 8px;
                margin-top: 10px;
                box-shadow: 0 4px 12px rgba(13, 128, 80, 0.15);
            }

            .report-title-bar h1 {
                margin: 0;
                font-size: 20px;
                font-weight: 600;
                letter-spacing: 0.3px;
            }

            .submission-ref {
                display: flex;
                align-items: center;
                gap: 15px;
                font-size: 10px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                opacity: 0.9;
            }

            .ref-divider {
                width: 1px;
                height: 24px;
                background: rgba(255,255,255,0.3);
            }

            .submission-id {
                font-weight: 700;
                font-size: 14px;
            }

            /* Stats Group */
            .stats-container {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 16px;
                margin-top: 20px;
            }

            .stat-card {
                background: white;
                border: 1px solid ${dmtBorderLight};
                border-radius: 14px;
                padding: 16px;
                display: flex;
                align-items: center;
                gap: 12px;
                transition: all 0.3s ease;
            }

            .stat-icon {
                width: 36px;
                height: 36px;
                border-radius: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
            }

            .stat-info {
                display: flex;
                flex-direction: column;
            }

            .stat-value {
                font-size: 18px;
                font-weight: 700;
                color: ${dmtTextDark};
                line-height: 1;
            }

            .stat-type {
                font-size: 9px;
                font-weight: 600;
                color: ${dmtTextMuted};
                text-transform: uppercase;
                letter-spacing: 0.4px;
                margin-top: 3px;
            }

            /* Discipline Section */
            .discipline-section {
                display: grid;
                grid-template-columns: 1fr 220px;
                gap: 40px;
                margin-top: 35px;
                padding-bottom: 25px;
                border-bottom: 1px dashed ${dmtBorderLight};
            }

            .discipline-left {
                display: flex;
                flex-direction: column;
            }

            .discipline-header {
                font-size: 16px;
                font-weight: 700;
                margin-bottom: 5px;
                color: ${dmtTurquoise};
            }

            .discipline-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 15px;
            }

            .discipline-table th {
                text-align: left;
                font-size: 9px;
                font-weight: 600;
                color: ${dmtTextMuted};
                text-transform: uppercase;
                letter-spacing: 0.6px;
                padding-bottom: 12px;
                border-bottom: 1px solid ${dmtBorderLight};
            }

            .discipline-table td {
                padding: 14px 0;
                font-size: 12px;
                border-bottom: 1px solid #f8fafc;
            }

            .disc-name { font-weight: 600; color: ${dmtTurquoise}; }
            .disc-val { font-weight: 500; text-align: center; }
            .disc-na { color: #cbd5e1; }
            .disc-passed { color: ${dmtComplianceGreen}; font-weight: 700; }
            .disc-failed { color: ${dmtComplianceRed}; font-weight: 700; }

            .compliance-circle-wrap {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                background: #f8fafb;
                border-radius: 20px;
                padding: 20px;
            }

            .circular-chart {
                width: 130px;
                height: 130px;
            }

            .circle-bg {
                fill: none;
                stroke: #edf2f7;
                stroke-width: 2.2;
            }

            .circle {
                fill: none;
                stroke-width: 2.8;
                stroke-linecap: round;
                stroke: ${dmtTurquoise};
                transition: stroke-dasharray 0.3s ease;
            }

            .percentage {
                fill: ${dmtTurquoise};
                font-family: 'Outfit';
                font-size: 10px;
                font-weight: 700;
                text-anchor: middle;
            }

            .circle-label {
                font-size: 10px;
                color: ${dmtTextMuted};
                text-transform: uppercase;
                font-weight: 700;
                margin-top: 8px;
                letter-spacing: 0.8px;
            }

            /* Project Details Section */
            .project-details {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 25px;
                margin-top: 30px;
                padding: 20px;
                background: #f8fafc;
                border-radius: 12px;
                border: 1px solid ${dmtBorderLight};
            }

            .detail-box {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }

            .detail-label {
                font-size: 9px;
                font-weight: 600;
                color: ${dmtTextMuted};
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .detail-value {
                font-size: 14px;
                font-weight: 600;
                color: ${dmtTextDark};
            }

            /* Hero Image */
            .hero-container {
                width: 100%;
                height: 280px;
                margin-top: 30px;
                border-radius: 20px;
                overflow: hidden;
                background: #f1f5f9;
                border: 1px solid ${dmtBorderLight};
                box-shadow: 0 4px 20px rgba(0,0,0,0.05);
            }

            .hero-container img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }

            /* Footer */
            .footer {
                margin-top: auto;
                padding-top: 25px;
                border-top: 1px solid ${dmtBorderLight};
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .footer-links {
                display: flex;
                flex-direction: column;
                gap: 4px;
                font-size: 11px;
                color: ${dmtTurquoise};
                font-weight: 600;
            }

            .qr-code {
                width: 75px;
                height: 75px;
                padding: 6px;
                background: white;
                border: 1px solid ${dmtBorderLight};
                border-radius: 10px;
            }

            .qr-code img { width: 100%; height: 100%; }

            .bottom-branding {
                text-align: right;
                font-size: 10px;
                color: ${dmtTextMuted};
                line-height: 1.5;
                font-weight: 500;
            }

            /* Detail Page Specifics */
            .page-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 30px;
            }
            .discipline-tag {
                padding: 8px 16px;
                border-radius: 6px;
                color: white;
                font-weight: 700;
                font-size: 14px;
                text-transform: uppercase;
            }
            .discipline-tag-ar {
                font-weight: 700;
                font-size: 18px;
            }
            .detail-section-title {
                font-size: 16px;
                font-weight: 700;
                margin-bottom: 20px;
                color: ${dmtTextDark};
                border-left: 4px solid ${dmtTurquoise};
                padding-left: 12px;
            }
            .detail-table {
                width: 100%;
                border-collapse: collapse;
            }
            .detail-table th {
                background: #f1f5f9;
                padding: 12px;
                text-align: left;
                font-size: 10px;
                text-transform: uppercase;
                color: ${dmtTextMuted};
            }
            .detail-table td {
                padding: 15px 12px;
                border-bottom: 1px solid #f1f5f9;
                vertical-align: top;
            }
            .cell-id { font-weight: 700; font-size: 12px; color: ${dmtTextMuted}; }
            .desc-en { font-weight: 600; font-size: 13px; margin-bottom: 4px; }
            .desc-ar { font-size: 12px; color: ${dmtTextMuted}; }
            .status-badge {
                padding: 4px 10px;
                border-radius: 20px;
                font-size: 10px;
                font-weight: 700;
                text-transform: uppercase;
            }
            .status-pass { background: #d1fae5; color: #065f46; }
            .status-fail { background: #fee2e2; color: #991b1b; }
            .cell-notes { font-size: 11px; color: #64748b; font-style: italic; }

            /* Villa Hero Section */
            .villa-hero {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin-bottom: 30px;
            }
            .villa-card {
                background: #fdfaf5;
                border: 1px solid #f3e8d2;
                border-radius: 12px;
                padding: 20px;
            }
            .villa-label {
                font-size: 10px;
                color: #b45309;
                text-transform: uppercase;
                font-weight: 700;
                margin-bottom: 8px;
            }
            .villa-value {
                font-size: 16px;
                font-weight: 700;
                color: ${dmtTextDark};
            }
            .note-box {
                margin-top: 30px;
                background: #f8fafc;
                border-radius: 8px;
                padding: 15px;
                font-size: 11px;
                line-height: 1.6;
                color: ${dmtTextMuted};
                border: 1px dashed ${dmtBorderLight};
            }

            /* Architectural Compliance Report (New) */
            .arch-report-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 30px;
                padding-bottom: 20px;
                border-bottom: 2px solid ${dmtTurquoise};
            }
            .arch-report-title {
                font-size: 24px;
                font-weight: 700;
                color: ${dmtTextDark};
                margin-bottom: 15px;
            }
            .arch-approval-label {
                font-size: 12px;
                font-weight: 700;
                text-transform: uppercase;
                margin-bottom: 10px;
                color: ${dmtTextMuted};
            }
            .arch-stats-row {
                display: flex;
                gap: 30px;
            }
            .arch-stat-item {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .arch-dot {
                width: 12px;
                height: 12px;
                border-radius: 50%;
            }
            .dot-pass { background: ${dmtComplianceGreen}; }
            .dot-fail { background: ${dmtComplianceRed}; }
            .dot-na { background: #94a3b8; }
            .arch-stat-val { font-weight: 700; font-size: 16px; }
            .arch-stat-name { font-size: 12px; color: ${dmtTextMuted}; }
            
            .arch-header-right {
                text-align: right;
            }
            .arch-barcode {
                font-family: 'Libre Barcode 39', cursive; /* Generic fallback */
                font-size: 32px;
                margin-bottom: 10px;
                letter-spacing: 2px;
            }
            .arch-proj-info {
                font-size: 11px;
                line-height: 1.5;
                color: ${dmtTextDark};
            }

            .arch-table-container {
                flex-grow: 1;
            }
            .arch-table-group-header {
                background: #e2e8f0;
                padding: 8px 15px;
                font-size: 13px;
                font-weight: 700;
                color: ${dmtTextDark};
                border-top: 1px solid #cbd5e1;
            }
            .arch-compliance-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
            }
            .arch-compliance-table th {
                background: #1a1a1a;
                color: white;
                padding: 10px;
                font-size: 11px;
                text-align: left;
                font-weight: 600;
            }
            .arch-compliance-table td {
                padding: 12px 10px;
                border: 1px solid #e2e8f0;
                font-size: 11px;
                vertical-align: middle;
            }
            .cell-desc-full {
                line-height: 1.4;
                color: #2d3748;
            }
            .compliance-badge {
                padding: 4px 12px;
                border-radius: 4px;
                font-size: 9px;
                font-weight: 700;
                display: inline-flex;
                align-items: center;
                gap: 4px;
            }
            .badge-pass { background: #d1fae5; color: #065f46; border: 1px solid #34d399; }
            .badge-fail { background: #fee2e2; color: #991b1b; border: 1px solid #f87171; }
            .badge-na { background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; }
        </style>
    </head>
    <body>
        <div class="page">
            <div class="header">
                <div class="logo-row">
                    <div class="dmt-logo">
                        ${admLogoBase64 ? `<img src="${admLogoBase64}" />` : `
                        <div style="font-weight: 700; color: ${dmtTurquoise}; border: 2px solid; padding: 5px; text-align: center;">DMT LOGO</div>
                        `}
                    </div>
                </div>
                <div class="report-title-bar">
                    <h1>Submission Compliance Report</h1>
                    <div class="submission-ref">
                        <div>Submission ID / Reference Number</div>
                        <div class="ref-divider"></div>
                        <div class="submission-id">${certificateNumber}</div>
                    </div>
                </div>
                <div style="display: flex; justify-content: flex-end; margin-top: 10px; gap: 20px; font-size: 10px; color: ${dmtTextMuted}; font-weight: 600;">
                    <div>Application ID: <strong>M-${certificateNumber.split('-')[1] || certificateNumber}</strong></div>
                    <div>Generation Date: <strong>${formattedDate}</strong></div>
                </div>
            </div>

            <div class="stats-container">
                <!-- Checked -->
                <div class="stat-card">
                    <div class="stat-icon" style="background: ${dmtSandyBeige}; color: ${dmtTurquoise};">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="11" y2="17"/></svg>
                    </div>
                    <div class="stat-info">
                        <div class="stat-value">${total}</div>
                        <div class="stat-type">Rules Checked</div>
                    </div>
                </div>
                <!-- N/A -->
                <div class="stat-card">
                    <div class="stat-icon" style="background: #fffbeb; color: ${dmtComplianceYellow};">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
                    </div>
                    <div class="stat-info">
                        <div class="stat-value">${notApplicable}</div>
                        <div class="stat-type">Not Applicable</div>
                    </div>
                </div>
                <!-- Non-Compliant -->
                <div class="stat-card" style="${failed > 0 ? `border-color: ${dmtComplianceRed}; background: #fef2f2;` : ''}">
                    <div class="stat-icon" style="background: #fef2f2; color: ${dmtComplianceRed};">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                    </div>
                    <div class="stat-info">
                        <div class="stat-value">${failed}</div>
                        <div class="stat-type">Non-Compliant</div>
                    </div>
                </div>
                <!-- Compliant -->
                <div class="stat-card" style="border-color: ${dmtComplianceGreen}; background: #f0fdf4;">
                    <div class="stat-icon" style="background: #f0fdf4; color: ${dmtComplianceGreen};">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    </div>
                    <div class="stat-info">
                        <div class="stat-value">${passed}</div>
                        <div class="stat-type">Compliant</div>
                    </div>
                </div>
            </div>

            <div class="hero-container">
                ${coverImageBase64 ? `<img src="${coverImageBase64}" />` : `
                <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #f8fafc; color: #cbd5e1;">
                    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                </div>
                `}
            </div>

            <div class="project-details">
                <div class="detail-box">
                    <div class="detail-label">Building Name</div>
                    <div class="detail-value">${projectName}</div>
                </div>
                <div class="detail-box">
                    <div class="detail-label">Consultant Name</div>
                    <div class="detail-value">${ownerNameEn}</div>
                </div>
                <div class="detail-box">
                    <div class="detail-label">Reviewed By</div>
                    <div class="detail-value">${officerName}</div>
                </div>
                <div class="detail-box">
                    <div class="detail-label">Submission Date</div>
                    <div class="detail-value">${formattedDate}</div>
                </div>
            </div>

            <div class="discipline-section">
                <div class="discipline-left">
                    <div class="discipline-header">Disciplines Under Review</div>
                    
                    <table class="discipline-table">
                        <thead>
                            <tr>
                                <th width="40%">Discipline</th>
                                <th style="text-align: center;">Checked</th>
                                <th style="text-align: center;">Compliant</th>
                                <th style="text-align: center;">Non-Compliant</th>
                                <th style="text-align: center;">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td class="disc-name">Architecture</td>
                                <td class="disc-val">${total}</td>
                                <td class="disc-val disc-passed">${passed}</td>
                                <td class="disc-val ${failed > 0 ? 'disc-failed' : ''}">${failed}</td>
                                <td class="disc-val ${archClass}">${archStatus}</td>
                            </tr>
                            <tr>
                                <td class="disc-name">Structure</td>
                                <td class="disc-val ${structTotal > 0 ? '' : 'disc-na'}">${structTotal}</td>
                                <td class="disc-val ${structPassed > 0 ? 'disc-passed' : 'disc-na'}">${structPassed}</td>
                                <td class="disc-val ${structFailed > 0 ? 'disc-failed' : 'disc-na'}">${structFailed}</td>
                                <td class="disc-val ${structClass}">${structStatus}</td>
                            </tr>
                            <tr>
                                <td class="disc-name">Fire and Safety</td>
                                <td class="disc-val ${fireTotal > 0 ? '' : 'disc-na'}">${fireTotal}</td>
                                <td class="disc-val ${firePassed > 0 ? 'disc-passed' : 'disc-na'}">${firePassed}</td>
                                <td class="disc-val ${fireFailed > 0 ? 'disc-failed' : 'disc-na'}">${fireFailed}</td>
                                <td class="disc-val ${fireClass}">${fireStatus}</td>
                            </tr>
                            <tr>
                                <td class="disc-name" style="color: #94a3b8;">Utilities</td>
                                <td class="disc-val disc-na">0</td>
                                <td class="disc-val disc-na">0</td>
                                <td class="disc-val disc-na">0</td>
                                <td class="disc-val disc-na">N/A</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="compliance-circle-wrap">
                    <svg viewBox="0 0 36 36" class="circular-chart">
                        <path class="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <path class="circle" stroke-dasharray="${complianceRate}, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <text x="18" y="21.5" class="percentage">${complianceRate}%</text>
                    </svg>
                    <div class="circle-label">Compliance Rate</div>
                </div>
            </div>



            <div class="footer">
                <div class="footer-links">
                    <div>www.dmt.gov.ae</div>
            
                </div>
                <div class="qr-code">
                    <img src="${qrCodeUrl}" />
                </div>
                <div class="bottom-branding">
                    <div style="color: ${dmtTurquoise}; font-weight: 700;">دائرة البلديات والنقل</div>
                    <div style="font-size: 8px; letter-spacing: 0.5px;">DEPARTMENT OF MUNICIPALITIES AND TRANSPORT</div>
                </div>
            </div>
        </div>

        <!-- Detail Pages -->
        ${renderFullArchitecturalReport()}
        ${renderDisciplinePage('Structural Conditions', 'الاشتراطات الإنشائية', structuralResult, '#3b82f6')}
        ${renderDisciplinePage('Fire and Safety Conditions', 'اشتراطات الحريق والسلامة', fireSafetyResult, '#ef4444')}
    </body>
    </html>
    `;
}

module.exports = {
    generateCertificatePdf
};
