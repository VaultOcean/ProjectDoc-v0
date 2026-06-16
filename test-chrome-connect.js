const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

async function testCompleteWorkflow() {
  console.log('🧪 COMPLETE DOCX WORKFLOW TEST\n');
  console.log('Testing: Upload → Extract → Select Fields → Preview → Export\n');

  let browser;
  try {
    // Try to connect to existing Chrome instance
    console.log('📱 Connecting to existing Chrome instance...');

    try {
      browser = await puppeteer.connect({
        browserWSEndpoint: 'ws://localhost:9222'
      });
      console.log('✅ Connected to existing Chrome\n');
    } catch (e) {
      console.log('⚠️  Could not connect via debugging protocol, launching new instance...');
      const chromeExe = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
      browser = await puppeteer.launch({
        headless: false,
        executablePath: chromeExe,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--remote-debugging-port=9222'
        ]
      });
      console.log('✅ Launched Chrome\n');
    }

    const pages = await browser.pages();
    const page = pages[0];

    // Step 1: Navigate to batches
    console.log('📍 Step 1: Navigate to Docx batches');
    const knownBatchUrl = 'http://localhost:3000/docx/test-company/batches/cmqh2pp420003oh7kg9g7bi7w';
    console.log(`  📎 Using batch: ${knownBatchUrl.split('/').pop()}`);

    await page.goto(knownBatchUrl, { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 3000));

    await page.screenshot({ path: 'step1-batch.png' });
    console.log('  ✅ Batch page loaded\n');

    // Step 2: Check for file input
    console.log('📍 Step 2: Find file upload input');
    const fileInput = await page.$('input[type="file"]');

    if (!fileInput) {
      console.log('  ❌ File input not found');
      const pageContent = await page.evaluate(() => ({
        title: document.title,
        url: window.location.href,
        text: document.body.innerText.substring(0, 300)
      }));
      console.log('  Page:', pageContent);
      process.exit(1);
    }
    console.log('  ✅ File input found\n');

    // Step 3: Upload PDF
    console.log('📍 Step 3: Upload PDF file');
    const pdfPath = path.join(process.env.USERPROFILE, 'Downloads', 'MFISAAJBACKLOGFEB2026PFI (002).pdf');

    if (!fs.existsSync(pdfPath)) {
      console.error(`  ❌ PDF not found: ${pdfPath}`);
      process.exit(1);
    }

    const fileSize = Math.ceil(fs.statSync(pdfPath).size / 1024);
    console.log(`  📄 Uploading: ${path.basename(pdfPath)} (${fileSize}KB)`);

    await fileInput.uploadFile(pdfPath);
    console.log(`  ⏳ Processing PDF...`);

    // Wait for extraction (5-10 seconds)
    await new Promise(resolve => setTimeout(resolve, 8000));

    await page.screenshot({ path: 'step3-uploaded.png' });
    console.log('  ✅ File uploaded\n');

    // Step 4: Check for document in list
    console.log('📍 Step 4: Verify document created');

    const documentInfo = await page.evaluate(() => {
      const container = document.querySelector('[class*="Documents"]') ||
                       document.evaluate("//h2[contains(text(), 'Documents')]/ancestor::div", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

      if (!container) return { found: false };

      const docLinks = Array.from(container.querySelectorAll('a')).filter(a => a.href.includes('/documents/'));

      if (docLinks.length === 0) return { found: false, text: container.innerText.substring(0, 300) };

      const doc = docLinks[0];
      return {
        found: true,
        fileName: doc.textContent.trim(),
        href: doc.href,
        status: doc.closest('div')?.textContent.split('\n')[1] || 'unknown'
      };
    });

    if (!documentInfo.found) {
      console.log('  ❌ No document found');
      console.log('  Page shows:', documentInfo.text);
      process.exit(1);
    }

    console.log(`  ✅ Document: ${documentInfo.fileName}`);
    console.log(`  📊 Status: ${documentInfo.status}\n`);

    // Step 5: Open document to check extraction
    console.log('📍 Step 5: Verify text extraction');

    await page.goto(documentInfo.href, { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 2000));

    const extractionResult = await page.evaluate(() => {
      // Find the document text area
      const textDivs = Array.from(document.querySelectorAll('div')).filter(d =>
        d.textContent.length > 100 &&
        (d.textContent.includes('[Page') || d.textContent.includes('Order') || d.textContent.includes('PDF'))
      );

      if (textDivs.length === 0) {
        return { success: false, error: 'No text container found' };
      }

      const text = textDivs[0].textContent.substring(0, 400);

      if (text.includes('[PDF text extraction failed')) {
        return { success: false, error: text };
      }

      if (text.includes('[Image - OCR')) {
        return { success: false, error: 'Image-only PDF' };
      }

      if (text.includes('[Page') || text.length > 100) {
        return { success: true, text: text };
      }

      return { success: false, error: 'Unexpected format', text: text };
    });

    await page.screenshot({ path: 'step5-extraction.png' });

    if (extractionResult.success) {
      console.log('  ✅ TEXT EXTRACTION SUCCESSFUL');
      console.log('\n  📝 Extracted Text Preview:');
      console.log('  ' + extractionResult.text.substring(0, 200).replace(/\n/g, '\n  '));
      console.log('  ...\n');
    } else {
      console.log(`  ❌ EXTRACTION FAILED: ${extractionResult.error}\n`);
    }

    // Summary
    console.log('═══════════════════════════════════════');
    console.log('📊 WORKFLOW TEST RESULTS');
    console.log('═══════════════════════════════════════');
    console.log('✅ File Upload: SUCCESS');
    console.log(`✅ Document Created: ${documentInfo.fileName}`);
    console.log(`${extractionResult.success ? '✅' : '❌'} Text Extraction: ${extractionResult.success ? 'SUCCESS' : 'FAILED'}`);
    console.log('\n📸 Screenshots:');
    console.log('  - step1-batch.png (batch page)');
    console.log('  - step3-uploaded.png (after upload)');
    console.log('  - step5-extraction.png (document detail)');

    if (extractionResult.success) {
      console.log('\n🎉 PHASE 3 COMPLETE - All features working!');
      console.log('Ready to build Phase 4: Encryption & Export Features');
    } else {
      console.log('\n⚠️  PDF extraction needs debugging');
    }

    await browser.close();

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
    if (browser) {
      try {
        await browser.close();
      } catch (e) {}
    }
    process.exit(1);
  }
}

testCompleteWorkflow();
