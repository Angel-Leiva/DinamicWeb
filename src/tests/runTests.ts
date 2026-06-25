import { PageValidationSchema, UserValidationSchema, MediaValidationSchema, VersionValidationSchema } from '../lib/validation.ts';
import { sanitizeString, sanitizeInput } from '../lib/sanitizer.ts';
import { validateExternalUrl } from '../lib/urlValidator.ts';

// Color logs helpers
const pass = (msg: string) => console.log(`\x1b[32m✔ PASS: ${msg}\x1b[0m`);
const fail = (msg: string) => console.log(`\x1b[31m✘ FAIL: ${msg}\x1b[0m`);
const section = (title: string) => console.log(`\n\x1b[36m=== ${title} ===\x1b[0m`);

async function runTests() {
  console.log('Starting Security & Hardening Validation Suite...\n');
  let failures = 0;

  // 1. ZOD INPUT VALIDATION TESTS
  section('1. Zod Input Validation & Schema Hardening');
  
  // Pages validation
  const validPage = {
    id: 'page-home',
    title: 'Página de Inicio',
    slug: 'home-page',
    blocks: [],
    isPublished: true
  };
  if (PageValidationSchema.safeParse(validPage).success) {
    pass('Valid page structure successfully parsed.');
  } else {
    fail('Valid page failed validation.');
    failures++;
  }

  const invalidPage = {
    id: '', // Empty
    title: 'X', // Too short
    slug: 'UPPERCASE_AND_BAD_CHARS!!' // Invalid slug format
  };
  const pageResult = PageValidationSchema.safeParse(invalidPage);
  if (!pageResult.success) {
    pass('Invalid page slug and structures rejected correctly: ' + JSON.stringify(pageResult.error.flatten().fieldErrors));
  } else {
    fail('Invalid page structure was incorrectly accepted.');
    failures++;
  }

  // Users validation
  const validUser = {
    username: 'angel_dev',
    email: 'angelleiva3hola@gmail.com',
    roleId: 'owner',
    status: 'active'
  };
  if (UserValidationSchema.safeParse(validUser).success) {
    pass('Valid user record successfully parsed.');
  } else {
    fail('Valid user record failed validation.');
    failures++;
  }

  const invalidUser = {
    username: 'ok',
    email: 'not-an-email',
    roleId: 'hacker-admin' // Invalid role
  };
  const userResult = UserValidationSchema.safeParse(invalidUser);
  if (!userResult.success) {
    pass('Invalid user mail and roles rejected correctly.');
  } else {
    fail('Invalid user record was incorrectly accepted.');
    failures++;
  }

  // Versions Validation
  const validVersion = {
    id: 'ver-123',
    pageId: 'page-home',
    version: 3,
    title: 'Home updated',
    slug: 'home',
    blocks: [],
    changeSummary: 'Updated headers'
  };
  if (VersionValidationSchema.safeParse(validVersion).success) {
    pass('Valid Page Version successfully parsed.');
  } else {
    fail('Valid Page Version failed validation.');
    failures++;
  }


  // 2. SANITIZATION / XSS PREVENTION TESTS
  section('2. Sanitization & HTML/Script Injection Protection');

  const dangerousString = '<script>alert("XSS")</script><p onload="doEvil()">Hello World</p>';
  const sanitized = sanitizeString(dangerousString);
  if (!sanitized.includes('<script>') && !sanitized.includes('onload')) {
    pass('Direct XSS script tag and onload attributes successfully neutralized.');
  } else {
    fail('Sanitizer failed to strip harmful tags or properties.');
    failures++;
  }

  const nestedObject = {
    title: 'Normal Title',
    blocks: [
      {
        id: 'block-1',
        properties: {
          html: 'Safe HTML',
          script: '<script src="hacker.js"></script>'
        }
      }
    ]
  };
  const cleanedObject: any = sanitizeInput(nestedObject);
  if (!JSON.stringify(cleanedObject).includes('<script')) {
    pass('Recursive object sanitization successfully stripped deep XSS vectors.');
  } else {
    fail('Recursive sanitization failed to clean deep objects.');
    failures++;
  }


  // 3. EXTERNAL MEDIA URL VALIDATIONS
  section('3. External URL & Content-Type Security');

  // Test Valid Image URL
  const validImgUrl = 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=200';
  console.log(`Testing external image URL validation on: ${validImgUrl}`);
  const imgCheck = await validateExternalUrl(validImgUrl, 'image');
  if (imgCheck.valid) {
    pass(`Image URL validated successfully. MIME type resolved: ${imgCheck.contentType}`);
  } else {
    console.warn(`[WARN] Unsplash check failed (might be offline): ${imgCheck.error}`);
  }

  // Test Invalid URL
  const invalidUrl = 'https://google.com/non-existent-image-file-abc-123.png';
  const invalidCheck = await validateExternalUrl(invalidUrl, 'image');
  if (!invalidCheck.valid) {
    pass(`Invalid/non-existent image URL correctly rejected. Error message: ${invalidCheck.error}`);
  } else {
    fail('Invalid URL was incorrectly marked as valid.');
    failures++;
  }

  // Test Content Type Mismatch
  const htmlPageUrl = 'https://example.com';
  console.log(`Testing image filter on HTML webpage URL: ${htmlPageUrl}`);
  const mimeMismatchCheck = await validateExternalUrl(htmlPageUrl, 'image');
  if (!mimeMismatchCheck.valid) {
    pass(`HTML webpage correctly rejected when image format was expected. Error: ${mimeMismatchCheck.error}`);
  } else {
    fail('HTML webpage was incorrectly accepted as an image.');
    failures++;
  }


  // 4. SUMMARY
  section('Validation Summary');
  if (failures === 0) {
    console.log('\x1b[32m✔ ALL INTEGRATION AND SECURITY TESTS PASSED SUCCESSFULLY! PRODUCTION READY.\x1b[0m\n');
  } else {
    console.log(`\x1b[31m✘ TEST SUITE COMPLETED WITH ${failures} FAILURE(S).\x1b[0m\n`);
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal error running tests:', err);
  process.exit(1);
});
