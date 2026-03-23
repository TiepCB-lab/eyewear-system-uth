# Project Scope & Business Requirements

This document outlines the project scope and functional requirements derived from the initial project specifications (`NhomBaoTiep.pdf`). It serves as the baseline for the system architecture and development phases.

## 🎯 Objectives

- **E-Commerce Excellence**: Build a robust platform for selling high-quality eyewear.
- **Digital Health Integration**: Support online prescription management and lens customization.
- **Smart Shopping**: Implement face-shape-based recommendations and virtual try-on features.
- **Operational Efficiency**: Streamline the workflow between Sales, Laboratory staff, and Logistics.

---

## 🏗️ Core Business Modules

The system is categorized into 5 primary operational domains:

### 1. System Admin & Identity
- **Internal User Management**: Tools for managing staff and administrative accounts.
- **Role-Based Access Control (RBAC)**: Fine-grained permissions (Admin, Manager, Sales, Ops).
- **Customer Identity**: Registration, Authentication, and Profile management.
- **Prescription Book**: Digital storage for optical prescriptions, including axis, cylinder, sphere, and PD.

### 2. Catalog & Product Management
- **Frames & Variants**: Manage colors, sizes, materials, photos, and stock levels.
- **Lens Catalog**: Manage lenses by index, features (Blue light, Photochromic), and prescription limits.
- **Pre-order System**: Handle backorders for out-of-stock premium frames.
- **Promotions**: Voucher management, seasonal discounts, and warranty policy management.

### 3. Shopping Experience & Smart Suggestion
- **Advanced Search & Discovery**: Multi-criteria filtering (shape, brand, price).
- **Recommendation Engine**: AI-driven suggestions based on face shape analysis.
- **Step-by-Step Configuration**: Guide customers through selecting frames and matching them with compatible lenses.
- **Unified Checkout**: Cart management, digital vouchers, and integrated payments (COD, VNPay).

### 4. Sales & Customer Service
- **Order Verification**: Manual review of prescriptions for safety and accuracy.
- **Pre-order Fulfillment**: Workflow for managing incoming stock and customer notifications.
- **Customer Support**: Ticket system for inquiries, returns, and warranty claims.

### 5. Operations, Logistics & Dashboard
- **Laboratory Workflow**: Sequential steps for lens cutting and frame mounting.
- **Quality Control (QC)**: Verification steps before packaging.
- **Logistics**: Packaging, label generation, and automated tracking updates.
- **Analytics Dashboard**: Real-time reporting on revenue, top-selling products, and order success rates.

---

## 👥 Stakeholders (Key Actors)

- **Customer**: Browses products, uses virtual try-on, and places orders.
- **Sales / Support Staff**: Verifies orders and handles customer tickets.
- **Operations Staff**: Handles lens mounting, QC, and logistics.
- **Manager**: Oversees reports, stock levels, and staff efficiency.
- **System Admin**: Manages system configurations and security.

---

## 📊 Core Data Entities

- **Identity**: Roles, Users, Addresses.
- **Catalog**: Products, ProductVariants, Inventories, Lenses, Promotions.
- **Commerce**: Prescriptions, Carts, CartItems, Orders, OrderItems.
- **Fulfillment**: Payments, Shipments, SupportTickets, ReturnWarranties.

---

## 🛠️ Modular Architecture

Both Backend and Frontend are designed to be modular, following these boundaries:
- `Identity` | `Catalog` | `Recommendation` | `Checkout`
- `Orders` | `Sales` | `Operations` | `Support`
- `Reports` | `Administration`
