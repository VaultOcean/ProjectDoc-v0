const fs = require('fs');
const path = require('path');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
const FormData = require('form-data');
const fetch = require('node-fetch');

async function testUpload() {
  console.log('🧪 Testing file upload...\n');

  try {
    const pdfPath = path.join(process.env.USERPROFILE, 'Downloads', 'MFISAAJBACKLOGFEB2026PFI (002).pdf');

    if (!fs.existsSync(pdfPath)) {
      console.error('❌ PDF file not found:', pdfPath);
      process.exit(1);
    }

    console.log('📄 PDF file found:', pdfPath);
    const fileBuffer = fs.readFileSync(pdfPath);
    console.log('📦 File size:', Math.ceil(fileBuffer.length / 1024), 'KB\n');

    // Extract text
    console.log('🔍 Extracting PDF text...');
    const uint8Array = new Uint8Array(fileBuffer);
    const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;
    const textChunks = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const text = textContent.items.map(item => item.str).join(' ');
      textChunks.push(text);
    }

    const extractedText = textChunks.join('\n\n');
    console.log('✅ Extracted', extractedText.length, 'characters from', pdf.numPages, 'pages\n');

    // Get a test batch ID (from the browser URL)
    const batchId = 'cmqh2pp420003oh7kg9g7bi7w'; // From the batch URL
    console.log('📨 Uploading to batch:', batchId);

    // Create form data
    const formData = new FormData();
    formData.append('file', fileBuffer, 'MFISAAJBACKLOGFEB2026PFI (002).pdf');
    formData.append('batchId', batchId);
    formData.append('extractedText', extractedText);

    // Send request
    const res = await fetch('http://localhost:3000/api/docx/documents', {
      method: 'POST',
      body: formData,
    });

    console.log('\n📊 API Response Status:', res.status);

    const responseText = await res.text();
    console.log('📄 Response:', responseText.substring(0, 500));

    if (res.ok) {
      const data = JSON.parse(responseText);
      console.log('\n✅ SUCCESS! Document created:');
      console.log('   ID:', data.docFile.id);
      console.log('   Name:', data.docFile.fileName);
      console.log('   Size:', data.docFile.fileSizeKb, 'KB');
      console.log('   Status:', data.docFile.status);
    } else {
      console.log('\n❌ Upload failed');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testUpload();
