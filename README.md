# 🍔 FudiPos | Speed-OS for Street Food

![FudiPos Banner](https://fudipos.shop/storage/assets/images/og-image-social.png) 


> **The first "Queue-Busting" Operating System designed specifically for high-throughput Food Trucks and Mobile Kitchens.**

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)]()
[![Stack](https://img.shields.io/badge/stack-MEVN%20%2B%20Laravel-orange)]()
[![Version](https://img.shields.io/badge/version-1.0.0-blue)]()

---

## 📖 Overview

**FudiPos** no es solo un Punto de Venta (POS); es una plataforma de comercio unificado diseñada para eliminar la fricción en la venta de comida callejera. 

A diferencia de los sistemas tradicionales diseñados para restaurantes con mesas, FudiPos se centra en la **velocidad de rotación** y la **auto-atención**, permitiendo a los clientes ordenar y pagar desde la fila mediante QR, sincronizando todo en tiempo real con una pantalla de cocina (KDS).

### 🚀 Core Value Proposition
* **Zero Hardware:** Funciona en cualquier dispositivo Android/iOS.
* **Offline-First:** Arquitectura robusta que permite vender sin internet y sincronizar después.
* **Stripe Connect Integration:** Pagos nativos con dispersión automática de fondos.

---

## 🛠 Tech Stack & Architecture

El proyecto utiliza una arquitectura de servicios separados orquestados por Nginx en un mismo VPS.

### 1. Marketing Site & SEO (`fudipos.shop`)
* **Framework:** Laravel 10 (PHP 8.1+)
* **Objetivo:** Landing page, captación de leads, SEO técnico, Blog.
* **Database:** MySQL (para leads y gestión de contenido estático).

### 2. The Application (`app.fudipos.shop`)
* **Frontend:** Vue.js 3 + Vite + Tailwind CSS.
* **State Management:** Pinia.
* **Backend API:** Node.js (Express).
* **Real-Time:** Socket.io (WebSockets para comunicación Cliente -> Cocina).
* **Database:** MongoDB (Esquemas flexibles para menús complejos).
* **Mobile Wrapper:** Capacitor / Ionic (para PWA instalable).

---

## 📂 Project Structure

```bash
/
├── marketing-site/      # Laravel Project (Landing Page)
├── fudi-app/            # Node.js + Vue Project (The SaaS Platform)
│   ├── client/          # Vue.js Frontend
│   └── server/          # Node.js API & Websockets
└── .readme/             # Assets for documentation
