const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const BRAND_ROOT = path.join(PROJECT_ROOT, 'brand-assets');
const IMAGES_ROOT = path.join(PROJECT_ROOT, 'assets', 'images');
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const DIRS = [
  path.join(BRAND_ROOT, '01-Master-Vectors'),
  path.join(BRAND_ROOT, '02-App-Icons'),
  path.join(BRAND_ROOT, '03-Android-Adaptive'),
  path.join(BRAND_ROOT, '04-Google-Play'),
  path.join(BRAND_ROOT, '05-Apple-App-Store'),
  path.join(BRAND_ROOT, '06-Metadata'),
];

DIRS.forEach((d) => fs.mkdirSync(d, { recursive: true }));

console.log('🚀 Generating TroveDocDue Brand Assets...');

// ---------------------------------------------------------------------------
// 1. MASTER VECTOR ASSETS
// ---------------------------------------------------------------------------

const MASTER_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <!-- Background Safe Area / iOS Base -->
  <rect width="1024" height="1024" fill="#071B3A" />
  
  <!-- Back Document -->
  <rect x="256" y="212" width="400" height="520" rx="48" fill="#0B65F5" opacity="0.8" />
  
  <!-- Front Document -->
  <rect x="368" y="292" width="400" height="520" rx="48" fill="#FFFFFF" />
  <rect x="448" y="380" width="240" height="32" rx="16" fill="#F5F8FC" />
  <rect x="448" y="460" width="180" height="32" rx="16" fill="#F5F8FC" />
  <rect x="448" y="540" width="200" height="32" rx="16" fill="#F5F8FC" />
  
  <!-- Teal Checkmark / Readiness -->
  <circle cx="680" cy="720" r="80" fill="#17C3A3" />
  <path d="M640 720l25 25 50-50" fill="none" stroke="#FFFFFF" stroke-width="24" stroke-linecap="round" stroke-linejoin="round" />
  
  <!-- AI Discovery Sparkle -->
  <path d="M768 180C768 220 808 260 848 260C808 260 768 300 768 340C768 300 728 260 688 260C728 260 768 220 768 180Z" fill="#17C3A3" />
  <path d="M848 100C848 120 868 140 888 140C868 140 848 160 848 180C848 160 828 140 808 140C828 140 848 120 848 100Z" fill="#0B65F5" />
</svg>`;

const WORDMARK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 200" width="800" height="200">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&amp;display=swap');
      .bold { font-family: 'Inter', system-ui, -apple-system, sans-serif; font-weight: 700; font-size: 84px; fill: #071B3A; }
      .regular { font-family: 'Inter', system-ui, -apple-system, sans-serif; font-weight: 400; font-size: 84px; fill: #0B65F5; }
    </style>
  </defs>
  <text x="50" y="130" class="bold">TroveDoc<tspan class="regular">Due</tspan></text>
</svg>`;

const WORDMARK_WHITE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 200" width="800" height="200">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&amp;display=swap');
      .bold { font-family: 'Inter', system-ui, -apple-system, sans-serif; font-weight: 700; font-size: 84px; fill: #FFFFFF; }
      .regular { font-family: 'Inter', system-ui, -apple-system, sans-serif; font-weight: 400; font-size: 84px; fill: #17C3A3; }
    </style>
  </defs>
  <text x="50" y="130" class="bold">TroveDoc<tspan class="regular">Due</tspan></text>
</svg>`;

// Android Adaptive Icon Foreground (Transparent background, centered in 288x288 safe zone)
const ADAPTIVE_FOREGROUND_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <!-- Scaled and centered to fit within 66% (680px) safe zone for 108dp Android adaptive icons -->
  <g transform="translate(512, 512) scale(0.82) translate(-572, -450)">
    <!-- Back Document -->
    <rect x="256" y="212" width="400" height="520" rx="48" fill="#0B65F5" opacity="0.9" />
    
    <!-- Front Document -->
    <rect x="368" y="292" width="400" height="520" rx="48" fill="#FFFFFF" />
    <rect x="448" y="380" width="240" height="32" rx="16" fill="#F5F8FC" />
    <rect x="448" y="460" width="180" height="32" rx="16" fill="#F5F8FC" />
    <rect x="448" y="540" width="200" height="32" rx="16" fill="#F5F8FC" />
    
    <!-- Teal Checkmark / Readiness -->
    <circle cx="680" cy="720" r="80" fill="#17C3A3" />
    <path d="M640 720l25 25 50-50" fill="none" stroke="#FFFFFF" stroke-width="24" stroke-linecap="round" stroke-linejoin="round" />
    
    <!-- AI Discovery Sparkles -->
    <path d="M768 180C768 220 808 260 848 260C808 260 768 300 768 340C768 300 728 260 688 260C728 260 768 220 768 180Z" fill="#17C3A3" />
    <path d="M848 100C848 120 868 140 888 140C868 140 848 160 848 180C848 160 828 140 808 140C828 140 848 120 848 100Z" fill="#0B65F5" />
  </g>
</svg>`;

// Android Monochrome Vector
const ADAPTIVE_MONOCHROME_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <g transform="translate(512, 512) scale(0.82) translate(-572, -450)" fill="#FFFFFF">
    <rect x="256" y="212" width="400" height="520" rx="48" fill="#FFFFFF" opacity="0.6" />
    <rect x="368" y="292" width="400" height="520" rx="48" fill="#FFFFFF" />
    <rect x="448" y="380" width="240" height="32" rx="16" fill="#071B3A" opacity="0.3" />
    <rect x="448" y="460" width="180" height="32" rx="16" fill="#071B3A" opacity="0.3" />
    <rect x="448" y="540" width="200" height="32" rx="16" fill="#071B3A" opacity="0.3" />
    <circle cx="680" cy="720" r="80" fill="#FFFFFF" />
    <path d="M640 720l25 25 50-50" fill="none" stroke="#071B3A" stroke-width="24" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M768 180C768 220 808 260 848 260C808 260 768 300 768 340C768 300 728 260 688 260C728 260 768 220 768 180Z" fill="#FFFFFF" />
    <path d="M848 100C848 120 868 140 888 140C868 140 848 160 848 180C848 160 828 140 808 140C828 140 848 120 848 100Z" fill="#FFFFFF" />
  </g>
</svg>`;

// Android background XML
const ANDROID_BACKGROUND_XML = `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <path
        android:fillColor="#071B3A"
        android:pathData="M0,0h108v108h-108z"/>
</vector>
`;

// Android monochrome XML
const ANDROID_MONOCHROME_XML = `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <group
        android:translateX="54"
        android:translateY="54"
        android:scaleX="0.086"
        android:scaleY="0.086">
        <group
            android:translateX="-572"
            android:translateY="-450">
            <!-- Back Doc -->
            <path
                android:fillColor="#99FFFFFF"
                android:pathData="M304,212h304c26.5,0 48,21.5 48,48v424c0,26.5 -21.5,48 -48,48h-304c-26.5,0 -48,-21.5 -48,-48v-424c0,-26.5 21.5,-48 48,-48z"/>
            <!-- Front Doc -->
            <path
                android:fillColor="#FFFFFFFF"
                android:pathData="M416,292h304c26.5,0 48,21.5 48,48v424c0,26.5 -21.5,48 -48,48h-304c-26.5,0 -48,-21.5 -48,-48v-424c0,-26.5 21.5,-48 48,-48z"/>
            <!-- Checkmark Circle -->
            <path
                android:fillColor="#FFFFFFFF"
                android:pathData="M680,720m-80,0a80,80 0 1,0 160,0a80,80 0 1,0 -160,0"/>
            <path
                android:strokeColor="#FF071B3A"
                android:strokeWidth="24"
                android:strokeLineCap="round"
                android:strokeLineJoin="round"
                android:pathData="M640,720l25,25l50,-50"/>
        </group>
    </group>
</vector>
`;

// Google Play Feature Graphic SVG (1024x500)
const PLAY_FEATURE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 500" width="1024" height="500">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#071B3A" />
      <stop offset="60%" stop-color="#092955" />
      <stop offset="100%" stop-color="#0B65F5" />
    </linearGradient>
    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10213D" />
      <stop offset="100%" stop-color="#172B4D" />
    </linearGradient>
    <filter id="cardShadow" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="16" stdDeviation="24" flood-color="#000000" flood-opacity="0.45" />
    </filter>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&amp;display=swap');
      .title-bold { font-family: 'Inter', system-ui, sans-serif; font-weight: 800; font-size: 52px; fill: #FFFFFF; letter-spacing: -0.5px; }
      .title-accent { font-family: 'Inter', system-ui, sans-serif; font-weight: 800; font-size: 52px; fill: #17C3A3; }
      .tagline { font-family: 'Inter', system-ui, sans-serif; font-weight: 600; font-size: 24px; fill: #F5F8FC; opacity: 0.95; }
      .subtagline { font-family: 'Inter', system-ui, sans-serif; font-weight: 700; font-size: 16px; fill: #17C3A3; letter-spacing: 2px; }
      .badge-text { font-family: 'Inter', system-ui, sans-serif; font-weight: 600; font-size: 12px; fill: #F5F8FC; }
      .card-title { font-family: 'Inter', system-ui, sans-serif; font-weight: 700; font-size: 15px; fill: #FFFFFF; }
      .card-sub { font-family: 'Inter', system-ui, sans-serif; font-weight: 500; font-size: 11px; fill: #94A3B8; }
      .pill-text { font-family: 'Inter', system-ui, sans-serif; font-weight: 700; font-size: 11px; fill: #17C3A3; }
      .pill-warn { font-family: 'Inter', system-ui, sans-serif; font-weight: 700; font-size: 11px; fill: #F59E0B; }
    </style>
  </defs>

  <!-- Background -->
  <rect width="1024" height="500" fill="url(#bgGrad)" />

  <!-- Subtle grid pattern & glow -->
  <circle cx="850" cy="180" r="280" fill="#0B65F5" opacity="0.25" filter="blur(60px)" />
  <circle cx="200" cy="450" r="200" fill="#17C3A3" opacity="0.12" filter="blur(50px)" />

  <!-- Left Content Column -->
  <g transform="translate(64, 75)">
    <!-- Wordmark / Brand -->
    <text x="0" y="50" class="title-bold">TroveDoc<tspan class="title-accent">Due</tspan></text>
    
    <!-- Sub-tagline badge -->
    <g transform="translate(0, 75)">
      <rect width="250" height="28" rx="14" fill="#071B3A" opacity="0.6" />
      <text x="14" y="19" class="subtagline">DISCOVER • REVIEW • NEVER MISS</text>
    </g>

    <!-- Main Tagline -->
    <text x="0" y="150" class="tagline">Your Important Documents, Found.</text>
    <text x="0" y="182" class="tagline" style="font-weight: 400; font-size: 18px; fill: #94A3B8;">On-device AI extracts renewal dates directly from your photos.</text>

    <!-- Feature Pills -->
    <g transform="translate(0, 230)">
      <!-- Pill 1 -->
      <g transform="translate(0, 0)">
        <rect width="150" height="34" rx="17" fill="#071B3A" stroke="#17C3A3" stroke-width="1.5" />
        <circle cx="20" cy="17" r="5" fill="#17C3A3" />
        <text x="34" y="22" class="badge-text">100% On-Device</text>
      </g>
      <!-- Pill 2 -->
      <g transform="translate(162, 0)">
        <rect width="150" height="34" rx="17" fill="#071B3A" stroke="#0B65F5" stroke-width="1.5" />
        <circle cx="20" cy="17" r="5" fill="#0B65F5" />
        <text x="34" y="22" class="badge-text">Zero Cloud Upload</text>
      </g>
      <!-- Pill 3 -->
      <g transform="translate(324, 0)">
        <rect width="150" height="34" rx="17" fill="#071B3A" stroke="#F59E0B" stroke-width="1.5" />
        <circle cx="20" cy="17" r="5" fill="#F59E0B" />
        <text x="34" y="22" class="badge-text">Smart Reminders</text>
      </g>
    </g>
  </g>

  <!-- Right Visual / Mockup Cards -->
  <g transform="translate(580, 40)">
    <!-- Back card (Passport) -->
    <g transform="rotate(7 220 200)" filter="url(#cardShadow)">
      <rect x="30" y="60" width="340" height="200" rx="20" fill="url(#cardGrad)" stroke="#1E293B" stroke-width="2" />
      <rect x="52" y="84" width="40" height="40" rx="12" fill="#0B65F5" opacity="0.2" />
      <path d="M68 96l10 10 16-16" stroke="#0B65F5" stroke-width="3" stroke-linecap="round" fill="none" />
      <text x="104" y="102" class="card-title">Passport Renewal</text>
      <text x="104" y="118" class="card-sub">Exp: Nov 15, 2026 • Verified</text>
      <rect x="270" y="88" width="80" height="24" rx="12" fill="#10B981" opacity="0.2" />
      <text x="290" y="104" class="pill-text">VALID</text>
      <!-- Sparkle -->
      <path d="M340 70C340 80 350 90 360 90C350 90 340 100 340 110C340 100 330 90 320 90C330 90 340 80 340 70Z" fill="#17C3A3" />
    </g>

    <!-- Front card (Driving Licence) -->
    <g transform="rotate(-6 160 250)" filter="url(#cardShadow)">
      <rect x="0" y="170" width="370" height="230" rx="24" fill="#0A1628" stroke="#0B65F5" stroke-width="2.5" />
      
      <!-- Card header -->
      <rect x="24" y="196" width="48" height="48" rx="14" fill="#0B65F5" />
      <text x="40" y="227" font-family="sans-serif" font-weight="900" font-size="22" fill="#FFFFFF">ID</text>
      <text x="86" y="218" class="card-title" style="font-size: 18px;">Driver's Licence</text>
      <text x="86" y="238" class="card-sub">DL-4092-8819 • Detected in Photos</text>
      
      <rect x="270" y="202" width="84" height="26" rx="13" fill="#F59E0B" opacity="0.2" />
      <text x="282" y="219" class="pill-warn">DUE SOON</text>

      <!-- Extracted Fields Row -->
      <g transform="translate(24, 266)">
        <rect width="322" height="60" rx="14" fill="#10213D" />
        <text x="16" y="26" class="card-sub">DETECTED EXPIRY DATE</text>
        <text x="16" y="48" font-family="'Inter', sans-serif" font-weight="800" font-size="16" fill="#17C3A3">December 28, 2026</text>
        <circle cx="295" cy="30" r="14" fill="#17C3A3" />
        <path d="M289 30l4 4 8-8" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" fill="none" />
      </g>

      <!-- Approval Banner -->
      <g transform="translate(24, 342)">
        <rect width="322" height="38" rx="12" fill="#17C3A3" />
        <text x="110" y="24" font-family="'Inter', sans-serif" font-weight="700" font-size="13" fill="#071B3A">APPROVE &amp; SAVE RECORD</text>
      </g>
    </g>
  </g>
</svg>`;

// Write master vector files
fs.writeFileSync(path.join(BRAND_ROOT, '01-Master-Vectors', 'trovedocdue-master-icon.svg'), MASTER_ICON_SVG);
fs.writeFileSync(path.join(BRAND_ROOT, '01-Master-Vectors', 'trovedocdue-wordmark.svg'), WORDMARK_SVG);
fs.writeFileSync(path.join(BRAND_ROOT, '01-Master-Vectors', 'trovedocdue-wordmark-white.svg'), WORDMARK_WHITE_SVG);
fs.writeFileSync(path.join(BRAND_ROOT, '03-Android-Adaptive', 'ic_launcher_foreground.svg'), ADAPTIVE_FOREGROUND_SVG);
fs.writeFileSync(path.join(BRAND_ROOT, '03-Android-Adaptive', 'ic_launcher_monochrome.svg'), ADAPTIVE_MONOCHROME_SVG);
fs.writeFileSync(path.join(BRAND_ROOT, '03-Android-Adaptive', 'ic_launcher_background.xml'), ANDROID_BACKGROUND_XML);
fs.writeFileSync(path.join(BRAND_ROOT, '03-Android-Adaptive', 'ic_launcher_monochrome.xml'), ANDROID_MONOCHROME_XML);
fs.writeFileSync(path.join(BRAND_ROOT, '04-Google-Play', 'trovedocdue-play-feature.svg'), PLAY_FEATURE_SVG);

console.log('✅ Master vector SVG & XML files created.');

// ---------------------------------------------------------------------------
// 2. METADATA & SPECIFICATION DOCUMENTS
// ---------------------------------------------------------------------------

const METADATA_DRAFT_TXT = `App Name: TroveDocDue
Primary Tagline: Find. Organize. Never Miss.

Short Description (Google Play - 80 chars max):
Find important documents in your gallery, track details, and never miss a due date.

Promotional Text (Apple App Store - 170 chars max):
The intelligent way to organize your life. TroveDocDue scans your photos for vital documents, extracts expiry dates, and sets smart reminders—all under your control.

Full Description:
Meet TroveDocDue, your AI-powered personal document assistant. Stop digging through thousands of photos to find your driver's license, passport, or insurance papers.

Key Features:
• 🔍 Smart Gallery Discovery: Automatically detects personal documents already in your photo library.
• 🧠 100% On-Device Intelligence: Powered by Google ML Kit OCR running entirely on your smartphone.
• 🛡️ Zero-Cloud Storage Guarantee: Your photos and personal data NEVER leave your device. No cloud servers, no third-party tracking.
• ✅ Explicit User Review & Approval: No record is added to your secure local vault until you verify and approve the detected details.
• ⏰ Intelligent Renewal Reminders: Automatically schedules notification alerts 30, 14, and 7 days before your documents expire.
• 🔒 Read-Only Photo Access: Your original photos are never modified, moved, or deleted.

Supported Documents:
- Passports & Travel Visas
- Driver's Licences & National ID Cards
- Vehicle & Health Insurance Policies
- Vehicle Registrations & Inspection Certificates
- Certifications, Memberships & Leases

Privacy Consideration:
TroveDocDue requires access to your photo gallery solely for the purpose of identifying document images on your device. All processing is strictly local.

Keywords:
document scanner, ID organizer, expiry reminder, renewal tracker, photo scanner, AI document, wallet, passport tracker, licence renewal, on-device OCR
`;

const BRAND_COLORS_TXT = `TroveDocDue — Official Brand Color Palette System

1. Primary Navy
   - Hex: #071B3A
   - RGB: rgb(7, 27, 58)
   - Usage: Primary branding backgrounds, headers, iOS icon base, Android adaptive background, critical headings.

2. Electric Blue
   - Hex: #0B65F5
   - RGB: rgb(11, 101, 245)
   - Usage: AI processing highlights, primary interactive buttons, back document accent, focus rings.

3. Teal Accent
   - Hex: #17C3A3
   - RGB: rgb(23, 195, 163)
   - Usage: Readiness, approved documents, valid status pills, AI discovery sparkle, positive confirmation.

4. Light Background
   - Hex: #F5F8FC
   - RGB: rgb(245, 248, 252)
   - Usage: Clean off-white app background, document placeholder lines, screenshot backdrops.

5. White
   - Hex: #FFFFFF
   - RGB: rgb(255, 255, 255)
   - Usage: Surface color for document cards, foreground text on dark backgrounds.

6. Primary Text
   - Hex: #10213D
   - RGB: rgb(16, 33, 61)
   - Usage: High-contrast body text for readability.

7. Secondary Text
   - Hex: #64748B
   - RGB: rgb(100, 116, 139)
   - Usage: Muted slate for metadata, expiry dates, subtitles, supplementary UI text.

Typography:
- Family: Inter (Rasmus Andersson, OFL License)
- TroveDoc: Inter Bold (#071B3A or #FFFFFF)
- Due: Inter Regular (#0B65F5 or #17C3A3)
`;

const ASSET_MANIFEST_CSV = `Filename,Purpose,Dimensions,Format,Platform,Status
trovedocdue-master-icon.svg,Master Vector,Scalable,SVG,Universal,Generated (Ready)
trovedocdue-wordmark.svg,Master Logo,Scalable,SVG,Universal,Generated (Ready)
trovedocdue-wordmark-white.svg,Master Logo Light,Scalable,SVG,Universal,Generated (Ready)
trovedocdue-ios-app-icon-1024x1024.png,App Store Submit,1024x1024,PNG (No Alpha),iOS,Generated (Ready)
trovedocdue-play-icon-512x512.png,Play Store Submit,512x512,PNG,Android,Generated (Ready)
ic_launcher_foreground.png,Adaptive Icon Foreground,432x432,PNG (Alpha),Android,Generated (Ready)
ic_launcher_background.xml,Adaptive Icon Background,108x108 dp,XML,Android,Generated (Ready)
ic_launcher_monochrome.xml,Themed Icon Monochrome,108x108 dp,XML,Android,Generated (Ready)
trovedocdue-play-feature-graphic-1024x500.png,Play Store Header,1024x500,PNG,Android,Generated (Ready)
ios-screenshot-01-discover.png,App Store Screenshot 1,1284x2778,PNG,iOS,Generated (Ready)
ios-screenshot-02-extract.png,App Store Screenshot 2,1284x2778,PNG,iOS,Generated (Ready)
ios-screenshot-03-approve.png,App Store Screenshot 3,1284x2778,PNG,iOS,Generated (Ready)
ios-screenshot-04-reminders.png,App Store Screenshot 4,1284x2778,PNG,iOS,Generated (Ready)
ios-screenshot-05-organized.png,App Store Screenshot 5,1284x2778,PNG,iOS,Generated (Ready)
android-screenshot-01-discover.png,Play Store Screenshot 1,1080x1920,PNG,Android,Generated (Ready)
android-screenshot-02-extract.png,Play Store Screenshot 2,1080x1920,PNG,Android,Generated (Ready)
android-screenshot-03-approve.png,Play Store Screenshot 3,1080x1920,PNG,Android,Generated (Ready)
android-screenshot-04-reminders.png,Play Store Screenshot 4,1080x1920,PNG,Android,Generated (Ready)
android-screenshot-05-organized.png,Play Store Screenshot 5,1080x1920,PNG,Android,Generated (Ready)
Metadata-Draft.txt,Store Copy & Keywords,N/A,TXT,Universal,Generated (Ready)
Brand-Colors.txt,Color System & Tokens,N/A,TXT,Universal,Generated (Ready)
`;

fs.writeFileSync(path.join(BRAND_ROOT, '06-Metadata', 'Metadata-Draft.txt'), METADATA_DRAFT_TXT);
fs.writeFileSync(path.join(BRAND_ROOT, '06-Metadata', 'Brand-Colors.txt'), BRAND_COLORS_TXT);
fs.writeFileSync(path.join(BRAND_ROOT, '06-Metadata', '09-Asset-Manifest.csv'), ASSET_MANIFEST_CSV);

console.log('✅ Metadata documents and Asset Manifest CSV written.');

// ---------------------------------------------------------------------------
// 3. RENDER FUNCTION VIA HEADLESS CHROME
// ---------------------------------------------------------------------------

function renderSvgOrHtmlToPng(inputPath, outputPath, width, height, transparent = false) {
  const flags = [
    '--headless=new',
    '--hide-scrollbars',
    '--force-device-scale-factor=1',
    `--window-size=${width},${height}`,
    transparent ? '--default-background-color=00000000' : '--default-background-color=ffffffff',
    `--screenshot="${outputPath}"`,
    `"file://${path.resolve(inputPath)}"`,
  ].join(' ');

  const cmd = `"${CHROME_PATH}" ${flags} 2>/dev/null`;
  execSync(cmd);
}

// ---------------------------------------------------------------------------
// 4. GENERATE APP ICONS & FEATURE GRAPHICS
// ---------------------------------------------------------------------------

const masterIconSvgPath = path.join(BRAND_ROOT, '01-Master-Vectors', 'trovedocdue-master-icon.svg');
const adaptiveFgSvgPath = path.join(BRAND_ROOT, '03-Android-Adaptive', 'ic_launcher_foreground.svg');
const featureSvgPath = path.join(BRAND_ROOT, '04-Google-Play', 'trovedocdue-play-feature.svg');

// A. iOS App Icon (1024x1024, No Alpha)
const iosIconPng = path.join(BRAND_ROOT, '02-App-Icons', 'trovedocdue-ios-app-icon-1024x1024.png');
renderSvgOrHtmlToPng(masterIconSvgPath, iosIconPng, 1024, 1024, false);
console.log('✅ Rendered iOS 1024x1024 icon.');

// B. Play Store Icon (512x512)
const playIconPng = path.join(BRAND_ROOT, '02-App-Icons', 'trovedocdue-play-icon-512x512.png');
renderSvgOrHtmlToPng(masterIconSvgPath, playIconPng, 512, 512, false);
fs.copyFileSync(playIconPng, path.join(BRAND_ROOT, '04-Google-Play', 'trovedocdue-play-icon-512x512.png'));
console.log('✅ Rendered Play Store 512x512 icon.');

// C. Android Adaptive Icon Foreground (432x432, Alpha)
const adaptiveFgPng = path.join(BRAND_ROOT, '03-Android-Adaptive', 'ic_launcher_foreground.png');
renderSvgOrHtmlToPng(adaptiveFgSvgPath, adaptiveFgPng, 432, 432, true);
console.log('✅ Rendered Android adaptive foreground 432x432 (transparent).');

// D. Play Store Feature Graphic (1024x500)
const playFeaturePng = path.join(BRAND_ROOT, '04-Google-Play', 'trovedocdue-play-feature-graphic-1024x500.png');
renderSvgOrHtmlToPng(featureSvgPath, playFeaturePng, 1024, 500, false);
console.log('✅ Rendered Play Store Feature Graphic 1024x500.');

// ---------------------------------------------------------------------------
// 5. UPDATE ACTIVE PROJECT ASSETS IN assets/images/
// ---------------------------------------------------------------------------

fs.copyFileSync(iosIconPng, path.join(IMAGES_ROOT, 'icon.png'));
renderSvgOrHtmlToPng(adaptiveFgSvgPath, path.join(IMAGES_ROOT, 'android-icon-foreground.png'), 512, 512, true);
renderSvgOrHtmlToPng(masterIconSvgPath, path.join(IMAGES_ROOT, 'splash-icon.png'), 256, 256, false);
renderSvgOrHtmlToPng(masterIconSvgPath, path.join(IMAGES_ROOT, 'favicon.png'), 48, 48, false);

// Android Background solid #071B3A (512x512)
const bgHtmlPath = path.join(BRAND_ROOT, '03-Android-Adaptive', '_temp_bg.html');
fs.writeFileSync(bgHtmlPath, `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#071B3A;width:512px;height:512px;"></body></html>`);
renderSvgOrHtmlToPng(bgHtmlPath, path.join(IMAGES_ROOT, 'android-icon-background.png'), 512, 512, false);
fs.unlinkSync(bgHtmlPath);

// Android Monochrome (432x432)
const monoSvgPath = path.join(BRAND_ROOT, '03-Android-Adaptive', 'ic_launcher_monochrome.svg');
renderSvgOrHtmlToPng(monoSvgPath, path.join(IMAGES_ROOT, 'android-icon-monochrome.png'), 432, 432, true);

console.log('✅ Active project assets updated in assets/images/ (icon, adaptive icons, splash, favicon).');

// ---------------------------------------------------------------------------
// 6. GENERATE STORE SCREENSHOTS (5 iOS 1284x2778, 5 Android 1080x1920)
// ---------------------------------------------------------------------------

function buildScreenshotHtml(platform, screenIndex, title, subtitle, contentHtml) {
  const isIos = platform === 'ios';
  const width = isIos ? 1284 : 1080;
  const height = isIos ? 2778 : 1920;
  const frameWidth = isIos ? 1040 : 880;
  const frameHeight = isIos ? 2120 : 1500;
  const titleSize = isIos ? '72px' : '54px';
  const subSize = isIos ? '34px' : '26px';

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: ${width}px;
    height: ${height}px;
    background: #F5F8FC;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    padding-top: ${isIos ? '160px' : '100px'};
    overflow: hidden;
    position: relative;
  }
  .header-wrap {
    text-align: center;
    max-width: 90%;
    z-index: 10;
  }
  .brand-pill {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 24px;
    background: rgba(11, 101, 245, 0.08);
    border-radius: 30px;
    color: #0B65F5;
    font-weight: 700;
    font-size: ${isIos ? '26px' : '20px'};
    margin-bottom: 24px;
    text-transform: uppercase;
    letter-spacing: 2px;
  }
  h1 {
    font-size: ${titleSize};
    font-weight: 800;
    color: #071B3A;
    line-height: 1.15;
    letter-spacing: -1.5px;
    margin-bottom: 16px;
  }
  p.sub {
    font-size: ${subSize};
    font-weight: 500;
    color: #64748B;
    line-height: 1.35;
    max-width: 900px;
    margin: 0 auto;
  }
  .device-mockup {
    margin-top: ${isIos ? '70px' : '50px'};
    width: ${frameWidth}px;
    height: ${frameHeight}px;
    background: #071B3A;
    border-radius: ${isIos ? '68px' : '44px'};
    box-shadow: 0 40px 100px rgba(7, 27, 58, 0.35), 0 10px 30px rgba(0,0,0,0.15);
    border: ${isIos ? '16px' : '12px'} solid #10213D;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    position: relative;
  }
  .device-notch {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: ${isIos ? '280px' : '220px'};
    height: ${isIos ? '36px' : '28px'};
    background: #10213D;
    border-bottom-left-radius: 20px;
    border-bottom-right-radius: 20px;
    z-index: 20;
  }
  .screen-content {
    flex: 1;
    background: #0B0F19;
    padding: ${isIos ? '60px 40px 40px' : '48px 30px 30px'};
    display: flex;
    flex-direction: column;
  }
</style>
</head>
<body>
  <div class="header-wrap">
    <div class="brand-pill">TROVEDOCDUE AI</div>
    <h1>${title}</h1>
    <p class="sub">${subtitle}</p>
  </div>
  <div class="device-mockup">
    <div class="device-notch"></div>
    <div class="screen-content">
      ${contentHtml}
    </div>
  </div>
</body>
</html>`;
}

const SCREENS = [
  {
    id: '01-discover',
    title: 'Discover Documents in Your Photos',
    subtitle: 'On-device AI securely scans your gallery to locate vital records',
    content: `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:28px;">
        <div>
          <div style="font-size:32px;font-weight:800;color:#FFF;">Document Discovery</div>
          <div style="font-size:20px;color:#94A3B8;margin-top:4px;">Scanning local photos securely</div>
        </div>
        <div style="background:#0B65F5;color:#FFF;padding:8px 18px;border-radius:20px;font-weight:700;font-size:18px;">ON-DEVICE</div>
      </div>
      <div style="background:#131A26;padding:24px;border-radius:20px;border:1px solid #1E293B;margin-bottom:30px;">
        <div style="display:flex;justify-content:space-between;color:#F8FAFC;font-size:20px;font-weight:700;margin-bottom:12px;">
          <span>Analyzing 1,420 Photos</span>
          <span style="color:#17C3A3;">86%</span>
        </div>
        <div style="height:12px;background:#1E293B;border-radius:6px;overflow:hidden;">
          <div style="width:86%;height:100%;background:linear-gradient(90deg,#0B65F5,#17C3A3);border-radius:6px;"></div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;flex:1;">
        <div style="background:#131A26;border:2.5px solid #0B65F5;border-radius:20px;padding:20px;position:relative;">
          <div style="position:absolute;top:16px;right:16px;background:#17C3A3;color:#071B3A;padding:4px 12px;border-radius:12px;font-size:14px;font-weight:800;">FOUND</div>
          <div style="width:50px;height:50px;background:#0B65F5;border-radius:14px;display:flex;align-items:center;justify-content:center;color:#FFF;font-size:24px;font-weight:800;margin-bottom:20px;">ID</div>
          <div style="color:#FFF;font-size:22px;font-weight:700;">Driver's Licence</div>
          <div style="color:#94A3B8;font-size:16px;margin-top:6px;">Expires Dec 2026</div>
        </div>
        <div style="background:#131A26;border:2.5px solid #0B65F5;border-radius:20px;padding:20px;position:relative;">
          <div style="position:absolute;top:16px;right:16px;background:#17C3A3;color:#071B3A;padding:4px 12px;border-radius:12px;font-size:14px;font-weight:800;">FOUND</div>
          <div style="width:50px;height:50px;background:#10B981;border-radius:14px;display:flex;align-items:center;justify-content:center;color:#FFF;font-size:24px;font-weight:800;margin-bottom:20px;">✈️</div>
          <div style="color:#FFF;font-size:22px;font-weight:700;">Passport</div>
          <div style="color:#94A3B8;font-size:16px;margin-top:6px;">Expires Nov 2028</div>
        </div>
        <div style="background:#131A26;border:1px solid #1E293B;border-radius:20px;padding:20px;">
          <div style="width:50px;height:50px;background:#64748B;border-radius:14px;display:flex;align-items:center;justify-content:center;color:#FFF;font-size:24px;font-weight:800;margin-bottom:20px;">🛡️</div>
          <div style="color:#FFF;font-size:22px;font-weight:700;">Health Insurance</div>
          <div style="color:#94A3B8;font-size:16px;margin-top:6px;">Expires Jan 2027</div>
        </div>
        <div style="background:#131A26;border:1px solid #1E293B;border-radius:20px;padding:20px;">
          <div style="width:50px;height:50px;background:#64748B;border-radius:14px;display:flex;align-items:center;justify-content:center;color:#FFF;font-size:24px;font-weight:800;margin-bottom:20px;">🚗</div>
          <div style="color:#FFF;font-size:22px;font-weight:700;">Auto Policy</div>
          <div style="color:#94A3B8;font-size:16px;margin-top:6px;">Expires Aug 2027</div>
        </div>
      </div>
    `,
  },
  {
    id: '02-extract',
    title: 'AI Extracts Important Details',
    subtitle: 'Local OCR reads document numbers, names, and renewal dates',
    content: `
      <div style="background:#131A26;border:2px solid #0B65F5;border-radius:24px;padding:30px;margin-bottom:24px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
          <span style="font-size:24px;font-weight:800;color:#FFF;">National Driver Licence</span>
          <span style="background:#0B65F5;color:#FFF;padding:6px 16px;border-radius:16px;font-size:15px;font-weight:700;">EXTRACTED</span>
        </div>
        <div style="background:#0B0F19;border-radius:16px;padding:20px;margin-bottom:16px;">
          <div style="font-size:14px;color:#94A3B8;font-weight:600;">HOLDER NAME</div>
          <div style="font-size:22px;color:#FFF;font-weight:700;margin-top:4px;">ALEXANDER M. VANCE</div>
        </div>
        <div style="background:#0B0F19;border-radius:16px;padding:20px;margin-bottom:16px;">
          <div style="font-size:14px;color:#94A3B8;font-weight:600;">LICENCE NUMBER</div>
          <div style="font-size:22px;color:#0B65F5;font-weight:700;margin-top:4px;">DL-9821-4098-B</div>
        </div>
        <div style="background:rgba(23,195,163,0.12);border:1.5px solid #17C3A3;border-radius:16px;padding:20px;">
          <div style="font-size:14px;color:#17C3A3;font-weight:700;">EXPIRY / RENEWAL DATE</div>
          <div style="font-size:26px;color:#FFF;font-weight:800;margin-top:4px;">December 28, 2026</div>
          <div style="font-size:15px;color:#17C3A3;margin-top:4px;">✓ High Confidence (98.4%)</div>
        </div>
      </div>
    `,
  },
  {
    id: '03-approve',
    title: 'Review & Approve Records',
    subtitle: 'Zero data is saved without your explicit verification and consent',
    content: `
      <div style="background:#131A26;border-radius:24px;padding:30px;border:1px solid #1E293B;">
        <div style="display:flex;align-items:center;gap:14px;margin-bottom:24px;">
          <div style="width:48px;height:48px;border-radius:16px;background:#17C3A3;display:flex;align-items:center;justify-content:center;color:#071B3A;font-size:28px;font-weight:900;">✓</div>
          <div>
            <div style="font-size:24px;font-weight:800;color:#FFF;">Verify Detected Record</div>
            <div style="font-size:16px;color:#94A3B8;">Please review details before saving to vault</div>
          </div>
        </div>
        <div style="background:#0B0F19;border-radius:16px;padding:20px;margin-bottom:16px;">
          <div style="font-size:14px;color:#94A3B8;">DOCUMENT TYPE</div>
          <div style="font-size:20px;color:#FFF;font-weight:700;">Passport (United States)</div>
        </div>
        <div style="background:#0B0F19;border-radius:16px;padding:20px;margin-bottom:24px;">
          <div style="font-size:14px;color:#94A3B8;">RENEWAL TARGET</div>
          <div style="font-size:20px;color:#17C3A3;font-weight:700;">November 14, 2027 (in 392 days)</div>
        </div>
        <div style="background:#17C3A3;color:#071B3A;font-weight:800;font-size:22px;text-align:center;padding:22px;border-radius:18px;margin-bottom:14px;">
          Approve &amp; Save Record
        </div>
        <div style="color:#94A3B8;text-align:center;font-size:16px;font-weight:600;">
          Discard or Edit Manually
        </div>
      </div>
    `,
  },
  {
    id: '04-reminders',
    title: 'Never Miss a Renewal',
    subtitle: 'Automated on-device notifications before your documents expire',
    content: `
      <div style="background:#131A26;border-radius:24px;padding:30px;border:1px solid #1E293B;">
        <div style="font-size:24px;font-weight:800;color:#FFF;margin-bottom:8px;">Smart Renewal Schedule</div>
        <div style="font-size:16px;color:#94A3B8;margin-bottom:28px;">Automatic on-device notifications scheduled</div>

        <div style="display:flex;align-items:center;justify-content:space-between;background:#0B0F19;padding:20px;border-radius:18px;margin-bottom:14px;border-left:5px solid #17C3A3;">
          <div>
            <div style="font-size:18px;font-weight:700;color:#FFF;">30 Days Before</div>
            <div style="font-size:14px;color:#94A3B8;">Early appointment booking alert</div>
          </div>
          <div style="background:#17C3A3;color:#071B3A;padding:6px 14px;border-radius:12px;font-size:14px;font-weight:800;">ACTIVE</div>
        </div>

        <div style="display:flex;align-items:center;justify-content:space-between;background:#0B0F19;padding:20px;border-radius:18px;margin-bottom:14px;border-left:5px solid #0B65F5;">
          <div>
            <div style="font-size:18px;font-weight:700;color:#FFF;">14 Days Before</div>
            <div style="font-size:14px;color:#94A3B8;">Urgent renewal reminder</div>
          </div>
          <div style="background:#0B65F5;color:#FFF;padding:6px 14px;border-radius:12px;font-size:14px;font-weight:800;">ACTIVE</div>
        </div>

        <div style="display:flex;align-items:center;justify-content:space-between;background:#0B0F19;padding:20px;border-radius:18px;border-left:5px solid #F59E0B;">
          <div>
            <div style="font-size:18px;font-weight:700;color:#FFF;">7 Days Before</div>
            <div style="font-size:14px;color:#94A3B8;">Final call to avoid late penalties</div>
          </div>
          <div style="background:#F59E0B;color:#071B3A;padding:6px 14px;border-radius:12px;font-size:14px;font-weight:800;">ACTIVE</div>
        </div>
      </div>
    `,
  },
  {
    id: '05-organized',
    title: 'Keep Everything Organized',
    subtitle: 'All your personal validity dates in one encrypted, private dashboard',
    content: `
      <div style="display:flex;gap:16px;margin-bottom:24px;">
        <div style="flex:1;background:#131A26;padding:20px;border-radius:18px;border:1px solid #1E293B;">
          <div style="font-size:14px;color:#94A3B8;">TOTAL RECORDS</div>
          <div style="font-size:36px;font-weight:800;color:#FFF;margin-top:6px;">8</div>
        </div>
        <div style="flex:1;background:#131A26;padding:20px;border-radius:18px;border:1px solid #1E293B;">
          <div style="font-size:14px;color:#17C3A3;">ALL VALID</div>
          <div style="font-size:36px;font-weight:800;color:#17C3A3;margin-top:6px;">6</div>
        </div>
        <div style="flex:1;background:#131A26;padding:20px;border-radius:18px;border:1px solid #1E293B;">
          <div style="font-size:14px;color:#F59E0B;">DUE SOON</div>
          <div style="font-size:36px;font-weight:800;color:#F59E0B;margin-top:6px;">2</div>
        </div>
      </div>

      <div style="background:#131A26;border-radius:20px;padding:20px;margin-bottom:14px;border:1px solid #1E293B;display:flex;align-items:center;justify-content:space-between;">
        <div>
          <div style="font-size:18px;font-weight:700;color:#FFF;">Driver's Licence</div>
          <div style="font-size:14px;color:#94A3B8;">Expires in 42 days (Dec 28, 2026)</div>
        </div>
        <div style="background:rgba(245,158,11,0.15);color:#F59E0B;padding:6px 14px;border-radius:14px;font-size:14px;font-weight:800;">DUE SOON</div>
      </div>

      <div style="background:#131A26;border-radius:20px;padding:20px;margin-bottom:14px;border:1px solid #1E293B;display:flex;align-items:center;justify-content:space-between;">
        <div>
          <div style="font-size:18px;font-weight:700;color:#FFF;">Passport</div>
          <div style="font-size:14px;color:#94A3B8;">Expires in 2 years (Nov 15, 2028)</div>
        </div>
        <div style="background:rgba(23,195,163,0.15);color:#17C3A3;padding:6px 14px;border-radius:14px;font-size:14px;font-weight:800;">VALID</div>
      </div>

      <div style="background:#131A26;border-radius:20px;padding:20px;border:1px solid #1E293B;display:flex;align-items:center;justify-content:space-between;">
        <div>
          <div style="font-size:18px;font-weight:700;color:#FFF;">Auto Insurance Policy</div>
          <div style="font-size:14px;color:#94A3B8;">Expires in 9 months (Jul 10, 2027)</div>
        </div>
        <div style="background:rgba(23,195,163,0.15);color:#17C3A3;padding:6px 14px;border-radius:14px;font-size:14px;font-weight:800;">VALID</div>
      </div>
    `,
  },
];

console.log('🖼️ Rendering iOS Screenshots (1284x2778)...');
for (let i = 0; i < SCREENS.length; i++) {
  const s = SCREENS[i];
  const html = buildScreenshotHtml('ios', i + 1, s.title, s.subtitle, s.content);
  const tempHtmlPath = path.join(BRAND_ROOT, '05-Apple-App-Store', `_temp_${s.id}.html`);
  const outPngPath = path.join(BRAND_ROOT, '05-Apple-App-Store', `ios-screenshot-${s.id}.png`);
  fs.writeFileSync(tempHtmlPath, html);
  renderSvgOrHtmlToPng(tempHtmlPath, outPngPath, 1284, 2778, false);
  fs.unlinkSync(tempHtmlPath);
  console.log(`  ✓ ios-screenshot-${s.id}.png (1284x2778)`);
}

console.log('🖼️ Rendering Google Play Screenshots (1080x1920)...');
for (let i = 0; i < SCREENS.length; i++) {
  const s = SCREENS[i];
  const html = buildScreenshotHtml('android', i + 1, s.title, s.subtitle, s.content);
  const tempHtmlPath = path.join(BRAND_ROOT, '04-Google-Play', `_temp_${s.id}.html`);
  const outPngPath = path.join(BRAND_ROOT, '04-Google-Play', `android-screenshot-${s.id}.png`);
  fs.writeFileSync(tempHtmlPath, html);
  renderSvgOrHtmlToPng(tempHtmlPath, outPngPath, 1080, 1920, false);
  fs.unlinkSync(tempHtmlPath);
  console.log(`  ✓ android-screenshot-${s.id}.png (1080x1920)`);
}

console.log('🎉 All brand assets generated successfully!');
