# TroveDocDue — Store Submission & Production Guide

This document provides all metadata, assets, descriptions, and release notes required for submitting **TroveDocDue** to both the **Google Play Console** and **Apple App Store Connect**.

---

## 1. App Summary & Brand Assets

- **App Name:** TroveDocDue
- **Primary Tagline:** Find. Organize. Never Miss.
- **Category:** Productivity / Utilities
- **Content Rating:** Everyone / 4+ (No ads, no tracking, no user-to-user interaction)

### Master & Store Assets Directory
All files below are located in the `brand-assets/` directory:

| Platform | Asset Name | Dimensions | Format | Path |
| :--- | :--- | :--- | :--- | :--- |
| **Universal** | Master Vector Icon | 1024 x 1024 | SVG | `brand-assets/01-Master-Vectors/trovedocdue-master-icon.svg` |
| **Universal** | Brand Wordmark | 800 x 200 | SVG | `brand-assets/01-Master-Vectors/trovedocdue-wordmark.svg` |
| **iOS** | App Store Icon | 1024 x 1024 | PNG (No Alpha) | `brand-assets/02-App-Icons/trovedocdue-ios-app-icon-1024x1024.png` |
| **iOS** | App Store Screenshots (5x) | 1284 x 2778 | PNG | `brand-assets/05-Apple-App-Store/ios-screenshot-0*.png` |
| **Android** | Google Play Icon | 512 x 512 | PNG | `brand-assets/02-App-Icons/trovedocdue-play-icon-512x512.png` |
| **Android** | Play Store Feature Graphic | 1024 x 500 | PNG | `brand-assets/04-Google-Play/trovedocdue-play-feature-graphic-1024x500.png` |
| **Android** | Play Store Screenshots (5x) | 1080 x 1920 | PNG | `brand-assets/04-Google-Play/android-screenshot-0*.png` |
| **Android** | Adaptive Icon Foreground | 432 x 432 | PNG (Alpha) | `brand-assets/03-Android-Adaptive/ic_launcher_foreground.png` |
| **Android** | Adaptive Icon Background | Solid `#071B3A` | XML | `brand-assets/03-Android-Adaptive/ic_launcher_background.xml` |

---

## 2. Google Play Store Listing Copy

### Short Description (Max 80 characters)
```text
Find documents in your photos, track expiry dates, and never miss a renewal.
```
*(Length: 76 characters)*

### Full Description (Google Play)
```text
Find documents you already have. Extract the dates that matter. Never miss a renewal.

Meet TroveDocDue, your intelligent on-device personal document assistant. Stop frantically searching through thousands of camera roll photos to find your driver’s licence expiry date, passport number, or insurance renewal deadline.

TroveDocDue securely inspects the photos already on your device, recognizes key identity and policy documents, extracts their validity dates using local machine learning, and schedules proactive reminders—all without your data ever leaving your phone.

KEY FEATURES:

🔍 SMART GALLERY DISCOVERY
Instead of making you manually photograph and upload each document one by one, TroveDocDue scans your accessible photo library to uncover documents you already photographed.

🧠 100% ON-DEVICE OCR INTELLIGENCE
Powered by Google ML Kit on-device Optical Character Recognition. Text recognition, classification, and date parsing run completely locally on your hardware. No cloud APIs, no remote processing.

🛡️ ZERO-STORAGE PRIVACY GUARANTEE
Your personal privacy is non-negotiable:
• Zero Cloud Storage: We operate no remote databases or backend servers.
• Read-Only Gallery Access: Your photos are never deleted, altered, moved, or overwritten.
• Immediate RAM Purge: Non-document photos analyzed during a scan are released from device memory immediately.
• Zero Telemetry: No third-party analytics SDKs, advertising trackers, or user profiling.

✅ YOU'RE ALWAYS IN CONTROL
Scanning does not automatically import records into your permanent database. Every detected document is placed in an uncommitted review queue. You verify the details, adjust any dates, and explicitly tap "Approve & Save" before anything enters your local vault.

⏰ PROACTIVE RENEWAL REMINDERS
Never pay a late renewal fee or get caught with an expired licence again. TroveDocDue schedules local notifications:
• 30 Days Before: Early appointment booking and renewal preparation.
• 14 Days Before: Urgent reminder to file documents.
• 7 Days Before: Final alert before deadline.

SUPPORTED DOCUMENTS:
• Passports & Travel Visas
• Driver's Licences & National ID Cards
• Motor, Health & Life Insurance Policies
• Vehicle Registration Certificates (RC) & Inspection Permits
• Professional Certifications, Memberships & Leases

DATA OWNERSHIP & FREEDOM:
You own 100% of your data. Export your vault in structured JSON format anytime, or wipe all records and settings with a single tap.

PERMISSIONS NOTICE:
TroveDocDue requests photo library access solely to identify document images on your device, and notification access to deliver local renewal alerts. We intentionally do not request geolocation or background location permissions.
```

### Release Notes — Version 1.0.0 (Max 500 characters)
```text
Welcome to TroveDocDue v1.0.0 — Find documents you already have. Extract the dates that matter. Never miss a renewal.
• 🔍 Smart Gallery Discovery: Identify passports, licences, RC, and insurance in your photos.
• 🧠 100% On-Device OCR: Powered by local ML Kit with zero cloud uploads.
• 🛡️ Zero-Storage Guarantee: Photos stay on your device; non-documents discarded from memory.
• ⏰ Smart Renewal Reminders: 30, 14, and 7-day local notification alerts.
```
*(Length: 489 characters)*

---

## 3. Apple App Store Listing Copy

### Subtitle (Max 30 characters)
```text
Document Finder & Expiry Alert
```
*(Length: 29 characters)*

### Promotional Text (Max 170 characters)
```text
Find documents already in your photos. TroveDocDue extracts expiry dates and sets smart reminders with 100% on-device AI and a strict zero-cloud privacy guarantee.
```
*(Length: 163 characters)*

### Keywords (Max 100 characters, comma-separated)
```text
document scanner,id organizer,expiry reminder,renewal tracker,passport,driving licence,insurance
```
*(Length: 97 characters)*

### What's New in Version 1.0.0 (App Store Release Notes)
```text
Welcome to the debut release of TroveDocDue!

Never dig through thousands of camera roll photos to find an expired driver's licence, passport, or insurance renewal date again. TroveDocDue brings intelligent, privacy-first document discovery directly to your device.

Key Features in v1.0.0:
• On-Device Discovery Scan: Inspect your photo library locally to find personal documents without manual photo uploads.
• Instant OCR Extraction: Automatically detects document numbers, names, and critical expiry dates using on-device machine learning.
• Explicit Review Vault: You are always in control. Nothing is stored in your personal encrypted vault until you review and approve it.
• Smart Expiry Reminders: Automated local alerts 30, 14, and 7 days before your documents expire so you never incur late penalties.
• Strict Zero-Cloud Guarantee: We don't have servers, user accounts, or tracking SDKs. Your data and photos never leave your iPhone.
• Flexible Manual Entry: Easily add custom documents, policies, and reminders whenever you need.

We'd love your feedback! Contact us or report issues at https://github.com/nltsravi/trouve-doc-due.
```

---

## 4. Legal & Support URLs

- **Privacy Policy:** `https://nltsravi.github.io/trouve-doc-due/privacy.html`
- **Terms & Conditions:** `https://nltsravi.github.io/trouve-doc-due/terms.html`
- **Marketing & Support Portal:** `https://nltsravi.github.io/trouve-doc-due/`
- **Support Email:** `ravi@neolumina.in`
