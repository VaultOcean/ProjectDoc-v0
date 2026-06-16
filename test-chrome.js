const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function testPDFExtraction() {
  console.log('🌐 Testing PDF extraction in Chrome...\n');

  let browser;
  try {
    // Launch Chrome - try system Chrome first
    const chromeExe = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    browser = await puppeteer.launch({
      headless: false, // Show the browser
      executablePath: chromeExe,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled']
    });

    const page = await browser.newPage();

    // Set user agent to avoid detection
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

    // Disable webdriver
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });
    });

    // Set viewport
    await page.setViewport({ width: 1280, height: 800 });

    console.log('📱 Navigating to batch page...');
    try {
      await page.goto('http://localhost:3000/docx/test-company/batches', {
        waitUntil: 'networkidle2',
        timeout: 10000
      });
    } catch (e) {
      console.log('⚠️  Timeout navigating to batches, continuing...');
    }

    // Take screenshot to debug
    await page.screenshot({ path: 'debug-batches.png' });
    console.log('📸 Saved debug screenshot: debug-batches.png');

    // Get page content for debugging
    const pageTitle = await page.title();
    console.log(`📄 Page title: ${pageTitle}`);

    // Get list of batches - try multiple selectors
    const batches = await page.evaluate(() => {
      // Try to find any batch links
      let batchLinks = Array.from(document.querySelectorAll('a[href*="/batches/"]'));
      batchLinks = batchLinks.filter(link => !link.href.includes('/documents/'));

      if (batchLinks.length === 0) {
        // Try alternative selectors
        batchLinks = Array.from(document.querySelectorAll('[href*="/batches/"]'));
        batchLinks = batchLinks.filter(link => !link.href.includes('/documents/'));
      }

      return batchLinks
        .map(link => ({
          text: link.textContent.trim(),
          href: link.href
        }))
        .filter(b => b.text && b.href)
        .slice(0, 1);
    });

    console.log(`Found ${batches.length} batches`);

    if (batches.length === 0) {
      // Try hardcoded batch URL from earlier screenshot
      console.log('⚠️  No batches found via selectors, trying known batch URL...');
      const knownBatchUrl = 'http://localhost:3000/docx/test-company/batches/cmqh2pp420003oh7kg9g7bi7w';
      batches.push({ href: knownBatchUrl, text: 'Test Batch' });
    }

    const batchUrl = batches[0].href;
    console.log(`✅ Found batch: ${batches[0].text}`);
    console.log(`📍 Opening: ${batchUrl}\n`);

    await page.goto(batchUrl, { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for page to fully render

    // Take screenshot to see page structure
    await page.screenshot({ path: 'debug-batch-page.png' });
    console.log('📸 Saved batch page screenshot: debug-batch-page.png');

    // Find upload input - check what's on the page
    const pageContent = await page.evaluate(() => {
      return {
        title: document.title,
        inputs: Array.from(document.querySelectorAll('input')).map(i => ({
          type: i.type,
          name: i.name,
          id: i.id
        })),
        buttons: Array.from(document.querySelectorAll('button')).map(b => b.textContent.trim()).slice(0, 5),
        text: document.body.innerText.substring(0, 300)
      };
    });

    console.log('🔍 Page structure:');
    console.log(`  Inputs: ${JSON.stringify(pageContent.inputs)}`);
    console.log(`  Buttons: ${pageContent.buttons.join(', ')}`);

    console.log('\n🔍 Finding file upload input...');
    const fileInput = await page.$('input[type="file"]');

    if (!fileInput) {
      // Try to find it by other means
      const hiddenInputs = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('input')).filter(i => i.type === 'file').length;
      });

      if (hiddenInputs > 0) {
        console.log(`⚠️  Found ${hiddenInputs} hidden file input(s), trying to use...`);
      } else {
        console.error('❌ File upload input not found on page');
        process.exit(1);
      }
    }

    console.log('✅ Found file input');

    // Upload the PDF
    const pdfPath = path.join(process.env.USERPROFILE, 'Downloads', 'MFISAAJBACKLOGFEB2026PFI (002).pdf');

    if (!fs.existsSync(pdfPath)) {
      console.error(`❌ PDF not found at: ${pdfPath}`);
      process.exit(1);
    }

    console.log(`\n📄 Uploading PDF: ${path.basename(pdfPath)}`);
    console.log(`📦 File size: ${Math.ceil(fs.statSync(pdfPath).size / 1024)} KB\n`);

    // Set file input
    await fileInput.uploadFile(pdfPath);

    // Wait for upload to complete (check for loading indicator to disappear)
    console.log('⏳ Waiting for upload and extraction...');
    await page.waitForTimeout(3000); // Initial wait

    // Wait for "Uploading..." text to appear then disappear
    try {
      await page.waitForFunction(
        () => {
          const uploading = document.textContent.includes('Uploading...');
          return !uploading;
        },
        { timeout: 15000 }
      );
      console.log('✅ Upload completed');
    } catch (e) {
      console.log('⚠️  Upload check timeout - continuing...');
    }

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check if document appeared
    console.log('\n🔍 Checking for extracted document...');
    const docInfo = await page.evaluate(() => {
      const docLinks = Array.from(document.querySelectorAll('a[href*="/documents/"]'));
      const firstDoc = docLinks[0];

      if (!firstDoc) return null;

      return {
        fileName: firstDoc.textContent.trim(),
        href: firstDoc.href,
        status: firstDoc.closest('div')?.textContent || 'unknown'
      };
    });

    if (docInfo) {
      console.log(`✅ Document found: ${docInfo.fileName}`);
      console.log(`📍 Status: ${docInfo.status}`);

      // Click on document to view extraction
      console.log('\n📖 Opening document to check text extraction...');
      await page.goto(docInfo.href, { waitUntil: 'networkidle2' });
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check extracted text
      const extractedText = await page.evaluate(() => {
        const textBox = document.querySelector('[class*="pre-wrap"]') ||
                       document.querySelector('[class*="whitespace"]') ||
                       document.evaluate("//h2[contains(text(), 'Document Text')]/following::div[1]", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

        return textBox?.textContent?.trim().substring(0, 300) || 'NOT FOUND';
      });

      console.log('\n📝 Extracted Text Preview:');
      console.log('---');
      console.log(extractedText);
      console.log('---');

      if (extractedText.includes('[PDF text extraction failed') || extractedText === 'NOT FOUND') {
        console.log('\n❌ PDF TEXT EXTRACTION FAILED');
      } else if (extractedText.length > 20) {
        console.log('\n✅ PDF TEXT EXTRACTION SUCCESSFUL');
      }
    } else {
      console.log('❌ No documents found after upload');
    }

    // Take screenshot
    const screenshotPath = path.join(__dirname, 'test-screenshot.png');
    await page.screenshot({ path: screenshotPath });
    console.log(`\n📸 Screenshot saved: ${screenshotPath}`);

    await browser.close();
    console.log('\n✅ Test complete');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (browser) await browser.close();
    process.exit(1);
  }
}

testPDFExtraction();
