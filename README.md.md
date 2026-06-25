# ADVACON - Wells & Meters Dashboard

**Active Farms Maintenance Project — Phase II**  
*AlUla Cultural Oasis · Contract CW5773*

[![GitHub Pages](https://img.shields.io/badge/GitHub-Pages-blue?style=flat-square&logo=github)](https://malakbilal07-cyber.github.io/Oasis-wells-meters-report/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)
[![Version](https://img.shields.io/badge/Version-2.0-orange?style=flat-square)](https://github.com/malakbilal07-cyber/Oasis-wells-meters-report)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Live Demo](#live-demo)
- [Features](#features)
- [Project Scope](#project-scope)
- [Technical Stack](#technical-stack)
- [Installation & Setup](#installation--setup)
- [Login Credentials](#login-credentials)
- [File Structure](#file-structure)
- [Data Management](#data-management)
- [KML Support](#kml-support)
- [Usage Guide](#usage-guide)
- [Export Options](#export-options)
- [Mobile Responsiveness](#mobile-responsiveness)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

---

## 🌟 Overview

The **ADVACON Wells & Meters Dashboard** is a comprehensive web-based monitoring and management tool for the Active Farms Maintenance Project in the AlUla Cultural Oasis District. This platform provides real-time visualization, analysis, and management of agricultural wells and electric meters across a 1,000-hectare area.

Built as a professional-grade dashboard, it enables project managers, field staff, and administrators to:

- Monitor well status and maintenance activities
- Track electric meter performance
- Visualize geographic distribution of assets
- Manage data through Excel uploads
- Generate reports for stakeholders

---

## 🔗 Live Demo

**Access the live dashboard here:**  
👉 [https://malakbilal07-cyber.github.io/Oasis-wells-meters-report/](https://malakbilal07-cyber.github.io/Oasis-wells-meters-report/)

> **Note:** Use the login credentials below to access the full dashboard.

---

## ✨ Features

### 🔐 Authentication System
- Secure login with three user roles:
  - **Admin** — Full access to all features
  - **Manager** — Data management and reporting
  - **Field** — View and data entry
- Session persistence
- Sign-out functionality

### 📊 Dashboard
- **8 KPI Stat Cards:**
  - Total Wells
  - Active / Non-Active Wells
  - Maintained / Not Maintained
  - Working / Faulty Meters
  - Rehab Required
- **Interactive Charts (Doughnut):**
  - Well Status Distribution
  - Rehab Status Breakdown
  - Meter Status Analysis
- **Summary Table:**
  - Cross-tabulation of Maintenance × Status
  - Disconnection Reason Analysis

### 🗺️ Interactive Maps

#### Well & Meter Locations Map
- Real-time positioning of all wells and meters
- Well number labels (#001, #042, etc.) for easy identification
- Filter buttons:
  - 🟢 **Active** — Green markers
  - 🟡 **Non-Active** — Amber markers
  - 🔵 **KML Layer** — Electric meters
  - 🔴 **Rehab Required** — Red markers
  - ⚫ **Out of Scope** — Gray markers
- Click markers → Detailed popup with:
  - Well/Meter ID
  - Status information
  - Coordinates
  - **"Open in Google Maps"** button for navigation
- **"Fit All"** button to zoom to all assets

#### KML Map Page
- Separate map for all 320 KML points
- Color-coded categories:
  - 🟢 Active Wells (88)
  - 🟡 Non-Active Wells (40)
  - 🔵 Electric Meters (100)
  - 🔴 Rehab Required (14)
  - ⚫ Out of Scope (78)
- Category filter buttons with counts
- Click popups with detailed information
- Upload new KML/KMZ files directly

### 📋 Data Management

#### Wells List
- Searchable table (by ID or Owner)
- View all well details:
  - Well ID, Status, Rehab Status
  - Maintenance Status, Owner
- **Edit** and **Remove** buttons on every row
- **Add Well** form with:
  - Custom ID entry
  - Status selection (Active/Non-Active)
  - Rehab requirement selection

#### Meters List
- Searchable table (by Meter ID or Well ID)
- View meter details:
  - Meter ID, Associated Well ID
  - Status (Working/Faulty)
  - Voltage and Amperes ratings
- **Edit** and **Remove** functionality
- **Add Meter** with:
  - Custom ID
  - Well association
  - Status selection

### 📤 Excel Upload
- Drag-and-drop or click to upload
- Supports `.xlsx` format
- Automatically replaces all well data
- Validates structure and loads new data
- Instant dashboard refresh upon upload

### 📥 Export Options
- **Export PDF** — Full report with:
  - Summary statistics
  - Wells table
  - Meters table
- **Export CSV** — Downloads filtered data for analysis

### 📄 Project Overview Page
- Company branding (ADVACON logo)
- Full project description
- Contract reference CW5773
- 1,000 ha area scope detail
- Complete list of 16 scope items:
  - Slow Food Farms
  - Oasis Living Farms
  - Ecolodge
  - HRH Initiative
  - Summer Farms
  - Perspective Galleries
  - Life & Memory Galleries
  - Hotel & Residences
  - Private Farms
  - And more...
- Live statistics from current data

---

## 🎯 Project Scope

**Contract:** CW5773 – Natural Reserves & Horticulture Plant Nurseries  
**Area:** 1,000 hectares in the Cultural Oasis District  
**Location:** AlUla, Saudi Arabia

**Project Objectives:**
1. Secure and improve farm health
2. Engage community in restarting farming activities
3. Contribute to the Cultural Oasis District transformation vision

**Agricultural Works Include:**
- Restoring and maintaining existing tree crops
- Improving agricultural land management
- Enhancing irrigation practices
- Community engagement in farming activities
- Supply of human resources, vehicles, machinery, tools, equipment
- Agricultural inputs management

---

## 💻 Technical Stack

| Component | Technology |
|-----------|------------|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript |
| **Mapping** | Leaflet.js + OpenStreetMap |
| **Charts** | Chart.js |
| **Excel Processing** | SheetJS (xlsx) |
| **Icons** | Font Awesome |
| **Styling** | Custom CSS (no external frameworks) |
| **Deployment** | GitHub Pages |
| **Data** | JSON + LocalStorage |

**CDN Sources:**
- Leaflet: `https://unpkg.com/leaflet@1.9.4/`
- Chart.js: `https://cdn.jsdelivr.net/npm/chart.js@4.4.0/`
- Font Awesome: `https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/`
- SheetJS: `https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/`

---

## 🚀 Installation & Setup

### Option 1: Deploy on GitHub Pages (Free)

1. **Fork/Clone this repository:**
   ```bash
   git clone https://github.com/malakbilal07-cyber/Oasis-wells-meters-report.git