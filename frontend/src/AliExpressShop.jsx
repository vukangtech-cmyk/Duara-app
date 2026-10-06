import React, { useState, useEffect, useMemo } from "react";
import {
  getManagerCatalogues,
  createCatalogueProduct,
  uploadImage,
  getPlatformSettings,
  followUser,
  getFollowedUserIds
} from "./api/api";
import { PaymentModal } from "./PaymentModal";

// ============================================================================
// CURATED ALIEXPRESS ASSET & PRODUCT CATALOGUE
// Covers:
// 1. Kupangisha Vyumba & Maeneo (Rentals & Leases)
// 2. Kununua Nyumba & Viwanja (Real Estate & Land)
// 3. Magari & Assets (Vehicles, Bikes & Heavy Machinery)
// 4. Electronics, Fashion, Home, Beauty, Agri, Hardware & Tools
// ============================================================================

export const SEED_SHOP_ITEMS = [
  // --- 1. KUPANGISHA VYUMBA NA MAENEO (RENTALS) ---
  {
    id: "rental-apt-mikocheni",
    name: "Apartment ya Kisasa ya Vyumba 2",
    category: "rentals",
    categoryLabel: "Kupanga: Apartment",
    propertyType: "apartment",
    price: 650000,
    original_price: 750000,
    currency: "TZS",
    rentPeriod: "kwa mwezi",
    location: "Mikocheni B, Dar es Salaam",
    image_url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format&fit=crop&q=80"
    ],
    rating: 4.9,
    orders_count: 38,
    isChoice: true,
    badge: "Choice Rental",
    specs: {
      bedrooms: "2 (Moja Master)",
      bathrooms: "2",
      water: "Maji DAWASA 24/7",
      electricity: "Luku ya Pekee",
      security: "Fensi, Geti & Parking",
      deposit: "Miezi 6 ya kodi"
    },
    description: "Apartment ya kifahari kwenye ghorofa ya pili. Ina sebule kubwa, balcony, na jiko la kisasa.",
    seller: {
      id: "landlord-mikocheni",
      name: "Mwenye Nyumba (Mikocheni Estates)",
      phone: "+255714000111",
      whatsapp: "+255714000111",
      verified: true
    }
  },
  {
    id: "rental-room-sinza",
    name: "Chumba Kimoja Master (Tiles & Gypsum)",
    category: "rentals",
    categoryLabel: "Kupanga: Chumba Master",
    propertyType: "single_master",
    price: 180000,
    original_price: 200000,
    currency: "TZS",
    rentPeriod: "kwa mwezi",
    location: "Sinza Mori, Dar es Salaam",
    image_url: "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&auto=format&fit=crop&q=80"
    ],
    rating: 4.8,
    orders_count: 64,
    isChoice: false,
    badge: "Hot Rental",
    specs: {
      bedrooms: "Chumba Kimoja Pekee",
      bathrooms: "Choo & Bafu Ndani",
      water: "Maji yanatoka 24/7",
      electricity: "Luku ya Kushare (Wapangaji 3)",
      security: "Fensi & Geti la Nje",
      deposit: "Miezi 3 ya kodi"
    },
    description: "Chumba kizuri sana karibu na kituo cha mwendokasi. Hakina mazingira ya kelele.",
    seller: {
      id: "landlord-sinza",
      name: "Mama Neema Properties",
      phone: "+255755112233",
      whatsapp: "+255755112233",
      verified: true
    }
  },
  {
    id: "rental-frame-kariakoo",
    name: "Fremu ya Biashara (Duka la Mbele)",
    category: "rentals",
    categoryLabel: "Kupanga: Fremu ya Duka",
    propertyType: "commercial_frame",
    price: 450000,
    original_price: 550000,
    currency: "TZS",
    rentPeriod: "kwa mwezi",
    location: "Kariakoo Msimbazi, Dar es Salaam",
    image_url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80"
    ],
    rating: 5.0,
    orders_count: 92,
    isChoice: true,
    badge: "Prime Location",
    specs: {
      size: "Mita 4 x 5 (Sqm 20)",
      floors: "Ground Floor",
      security: "Shutter ya Chuma + Grille",
      electricity: "Luku yake pekee",
      footTraffic: "Watu wengi sana kila siku",
      deposit: "Miezi 6 ya kodi"
    },
    description: "Fremu nzuri sana ya kuweka duka la simu, nguo, vipodozi au accessories Kariakoo barabarani.",
    seller: {
      id: "agent-kariakoo",
      name: "Kariakoo Prime Agencies",
      phone: "+255655443322",
      whatsapp: "+255655443322",
      verified: true
    }
  },
  {
    id: "rental-house-kigamboni",
    name: "Nyumba Nzima ya Kupanga (Vyumba 3)",
    category: "rentals",
    categoryLabel: "Kupanga: Nyumba Nzima",
    propertyType: "standalone_house",
    price: 400000,
    original_price: 450000,
    currency: "TZS",
    rentPeriod: "kwa mwezi",
    location: "Kibada, Kigamboni, Dar es Salaam",
    image_url: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80"
    ],
    rating: 4.7,
    orders_count: 24,
    isChoice: false,
    badge: "Family Home",
    specs: {
      bedrooms: "Vyumba 3 (Kimoja Master)",
      bathrooms: "2",
      parking: "Magari 3 ndani ya uzio",
      compound: "Uwanja mkubwa wa pekee",
      deposit: "Miezi 6"
    },
    description: "Nyumba tulivu kwa familia. Ipo ndani ya fensi ya kisasa, maji na umeme tayari.",
    seller: {
      id: "landlord-kigamboni",
      name: "Mzee Ally Real Estate",
      phone: "+255784998877",
      whatsapp: "+255784998877",
      verified: true
    }
  },

  // --- 2. KUNUNUA NYUMBA NA VIWANJA (REAL ESTATE & ASSETS) ---
  {
    id: "sale-house-goba",
    name: "Nyumba ya Kisasa ya Kununua (Vyumba 4)",
    category: "realestate",
    categoryLabel: "Kununua: Nyumba Kamili",
    propertyType: "house_sale",
    price: 95000000,
    original_price: 110000000,
    currency: "TZS",
    location: "Goba Center, Dar es Salaam",
    image_url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&auto=format&fit=crop&q=80"
    ],
    rating: 5.0,
    orders_count: 12,
    isChoice: true,
    badge: "Hati Miliki Safi",
    specs: {
      plotSize: "Sqm 600",
      bedrooms: "4 (2 Master)",
      titleDeed: "Hati ya Wizara ya Ardhi",
      paving: "Tiles & Paving blocks uani",
      security: "Fensi ya umeme & CCTV"
    },
    description: "Nyumba mpya iliyokamilika vizuri sana. Mazingira safi, barabara inafikika bila tatizo.",
    seller: {
      id: "developer-goba",
      name: "Goba Homes Developers",
      phone: "+255767889900",
      whatsapp: "+255767889900",
      verified: true
    }
  },
  {
    id: "sale-plot-kerege",
    name: "Kiwanja Kilichopimwa (Mita 20 x 25)",
    category: "realestate",
    categoryLabel: "Kununua: Kiwanja",
    propertyType: "plot_sale",
    price: 12500000,
    original_price: 15000000,
    currency: "TZS",
    location: "Kerege, Bagamoyo Road",
    image_url: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop&q=80"
    ],
    rating: 4.8,
    orders_count: 45,
    isChoice: false,
    badge: "Pimwa & Beacon",
    specs: {
      plotSize: "Sqm 500 (20x25)",
      titleDeed: "Hati ya Makazi (Beacons zipo)",
      topography: "Kina tambarare, hakijai maji",
      utilities: "Umeme & Maji meter 50"
    },
    description: "Kiwanja kizuri sana cha kujenga makazi ya familia. Kipo eneo lililoendelea tayari na majirani wapo.",
    seller: {
      id: "agent-bagamoyo",
      name: "AfriPlots Tanzania",
      phone: "+255712334455",
      whatsapp: "+255712334455",
      verified: true
    }
  },
  {
    id: "sale-villa-mbezi",
    name: "Luxury Beachfront Villa (Vyumba 5)",
    category: "realestate",
    categoryLabel: "Kununua: Villa ya Kifahari",
    propertyType: "villa_sale",
    price: 350000000,
    original_price: 390000000,
    currency: "TZS",
    location: "Mbezi Beach, Dar es Salaam",
    image_url: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&auto=format&fit=crop&q=80"
    ],
    rating: 5.0,
    orders_count: 8,
    isChoice: true,
    badge: "Super Luxury",
    specs: {
      bedrooms: "5 Vyote Self-Contained",
      swimmingPool: "Bwawa Kubwa la Kuogelea",
      oceanDistance: "Mita 250 toka Baharini",
      titleDeed: "Hati ya Wizara miaka 99"
    },
    description: "Villa ya kipekee yenye bustani maridadi na mandhari ya bahari. Inajumuisha jenereta ya dharura.",
    seller: {
      id: "luxury-estates",
      name: "Tanzania Luxury Realties",
      phone: "+255754000999",
      whatsapp: "+255754000999",
      verified: true
    }
  },

  // --- 3. MAGARI NA ASSETS (VEHICLES, BIKES & HEAVY MACHINERY) ---
  {
    id: "car-harrier-2016",
    name: "Toyota Harrier New Shape (2016)",
    category: "vehicles",
    categoryLabel: "Gari: SUV",
    propertyType: "car_suv",
    price: 38500000,
    original_price: 43000000,
    currency: "TZS",
    location: "Mikocheni Showroom, Dar es Salaam",
    image_url: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&auto=format&fit=crop&q=80"
    ],
    rating: 4.9,
    orders_count: 19,
    isChoice: true,
    badge: "Inspected ✓",
    specs: {
      year: "2016",
      engine: "2,000cc Petrol (Eco Mode)",
      transmission: "Automatic",
      mileage: "54,200 km",
      color: "Pearl White",
      duty: "Ushuru Umelipwa (Full Tax Paid)"
    },
    description: "Gari ipo katika hali nzuri sana. Leather seats, panoramic sunroof, na camera 360 view.",
    seller: {
      id: "dealer-dar",
      name: "Royal Motors Tanzania",
      phone: "+255713444555",
      whatsapp: "+255713444555",
      verified: true
    }
  },
  {
    id: "car-ist-2010",
    name: "Toyota IST (1.5cc Low Mileage)",
    category: "vehicles",
    categoryLabel: "Gari: Hatchback",
    propertyType: "car_hatchback",
    price: 14800000,
    original_price: 16500000,
    currency: "TZS",
    location: "Kijitonyama, Dar es Salaam",
    image_url: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop&q=80"
    ],
    rating: 4.8,
    orders_count: 42,
    isChoice: false,
    badge: "Bargain Car",
    specs: {
      year: "2010",
      engine: "1,490cc VVTi (Matumizi Madogo)",
      transmission: "Automatic",
      mileage: "82,000 km",
      insurance: "Bima kubwa miezi 9"
    },
    description: "Gari ya kutembelea mjini. Inatumia mafuta kidogo mno na AC inafanya kazi fresh.",
    seller: {
      id: "seller-ist",
      name: "Hamza Auto Deals",
      phone: "+255788112233",
      whatsapp: "+255788112233",
      verified: true
    }
  },
  {
    id: "car-boxer-bm150",
    name: "Pikipiki Mpya Boxer BM 150 (2024)",
    category: "vehicles",
    categoryLabel: "Pikipiki & Bajaji",
    propertyType: "motorcycle",
    price: 2850000,
    original_price: 3100000,
    currency: "TZS",
    location: "Kariakoo / Mwenge Showroom",
    image_url: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&auto=format&fit=crop&q=80"
    ],
    rating: 4.9,
    orders_count: 110,
    isChoice: true,
    badge: "0 Km Mpya",
    specs: {
      year: "2024",
      engine: "150cc 4-Stroke",
      warranty: "Miezi 12 ya Kampuni",
      helmet: "Kofia 2 za Bure + Jacket"
    },
    description: "Pikipiki imara kwa biashara ya bodaboda au matumizi binafsi. Spea zake zinapatikana kila mahali.",
    seller: {
      id: "boxer-dealer",
      name: "Tanzania Motors Central",
      phone: "+255767112244",
      whatsapp: "+255767112244",
      verified: true
    }
  },
  {
    id: "car-tvs-bajaji",
    name: "Bajaji TVS King Deluxe 4-Stroke",
    category: "vehicles",
    categoryLabel: "Pikipiki & Bajaji",
    propertyType: "bajaji",
    price: 6900000,
    original_price: 7400000,
    currency: "TZS",
    location: "Ubungo / Shekilango Road",
    image_url: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&auto=format&fit=crop&q=80"
    ],
    rating: 4.8,
    orders_count: 58,
    isChoice: false,
    badge: "Uwekezaji",
    specs: {
      year: "2023",
      fuel: "Petroli (Ina mfumo wa kuweka Gesi CNG)",
      capacity: "Abiria 3 + Dereva"
    },
    description: "Bajaji imara sana na inafaa mno kuweka dereva kwa biashara ya kila siku.",
    seller: {
      id: "bajaji-centre",
      name: "Swahili Bajaji Hub",
      phone: "+255755449988",
      whatsapp: "+255755449988",
      verified: true
    }
  },

  // --- 4. ELECTRONICS & SMARTPHONES (SMART DEVICES) ---
  {
    id: "phone-iphone-15-pm",
    name: "Apple iPhone 15 Pro Max 256GB",
    category: "electronics",
    categoryLabel: "Simu & Elektroniki",
    price: 2850000,
    original_price: 3300000,
    currency: "TZS",
    location: "Kariakoo & Posta, Dar es Salaam",
    image_url: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop&q=80"
    ],
    rating: 5.0,
    orders_count: 320,
    isChoice: true,
    badge: "SuperDeal -15%",
    specs: {
      storage: "256GB / 512GB",
      chip: "A17 Pro Titanium",
      warranty: "1 Year Apple Warranty",
      delivery: "Usafirishaji Bure Tanzania nzima"
    },
    description: "Original Apple iPhone 15 Pro Max sealed box. Risiti rasmi inatolewa.",
    seller: {
      id: "apple-direct",
      name: "Duara Official Electronics",
      phone: "+255714000333",
      whatsapp: "+255714000333",
      verified: true
    }
  },
  {
    id: "phone-s24-ultra",
    name: "Samsung Galaxy S24 Ultra 5G (512GB)",
    category: "electronics",
    categoryLabel: "Simu & Elektroniki",
    price: 2650000,
    original_price: 3100000,
    currency: "TZS",
    location: "Mlimani City Mall Store",
    image_url: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&auto=format&fit=crop&q=80"
    ],
    rating: 4.9,
    orders_count: 240,
    isChoice: true,
    badge: "Choice Galaxy",
    specs: {
      storage: "512GB + S-Pen",
      camera: "200MP Quad Camera AI",
      warranty: "Miezi 24 Samsung Care"
    },
    description: "Simu ya kisasa yenye akili bandia (Galaxy AI). Titanium frame na skrini ya Gorilla Armor.",
    seller: {
      id: "galaxy-hub",
      name: "SmartHub Tech",
      phone: "+255745112288",
      whatsapp: "+255745112288",
      verified: true
    }
  },
  {
    id: "macbook-air-m2",
    name: "Apple MacBook Air 13.6\" (M2 Chip)",
    category: "electronics",
    categoryLabel: "Laptops & Vifaa",
    price: 2300000,
    original_price: 2650000,
    currency: "TZS",
    location: "Dar es Salaam & Arusha",
    image_url: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80"
    ],
    rating: 4.9,
    orders_count: 85,
    isChoice: true,
    badge: "Choice Laptop",
    specs: {
      ram: "8GB / 16GB Unified",
      ssd: "256GB / 512GB SSD",
      battery: "Masaa 18 ya Chaji"
    },
    description: "Laptop nyepesi yenye nguvu kubwa kwa watengenezaji wa maudhui, wanafunzi, na maofisa.",
    seller: {
      id: "istore-tz",
      name: "Tanzania Mac Zone",
      phone: "+255784992211",
      whatsapp: "+255784992211",
      verified: true
    }
  },
  {
    id: "hisense-tv-55",
    name: "Smart TV Hisense 55\" 4K UHD Frameless",
    category: "electronics",
    categoryLabel: "TV & Vifaa vya Sauti",
    price: 950000,
    original_price: 1150000,
    currency: "TZS",
    location: "Kariakoo, Dar es Salaam",
    image_url: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&auto=format&fit=crop&q=80"
    ],
    rating: 4.8,
    orders_count: 145,
    isChoice: false,
    badge: "Bure Usafirishaji",
    specs: {
      resolution: "4K Ultra HD (3840x2160)",
      os: "VIDAA OS (YouTube, Netflix)",
      warranty: "Miaka 2 Rasmi"
    },
    description: "Picha safi ya 4K yenye rangi angavu. Inakuja na rimoti ya sauti na Bluetooth.",
    seller: {
      id: "hisense-tz",
      name: "Home Appliances Direct",
      phone: "+255716554433",
      whatsapp: "+255716554433",
      verified: true
    }
  },

  // --- 5. FASHION & APPAREL (MITINDO NA MAVAZI) ---
  {
    id: "fashion-suit-slim",
    name: "Suti ya Kiume ya Kisasa (Italian Slim Fit)",
    category: "fashion",
    categoryLabel: "Mitindo: Wanaume",
    price: 180000,
    original_price: 240000,
    currency: "TZS",
    location: "Dar es Salaam",
    image_url: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&auto=format&fit=crop&q=80"
    ],
    rating: 4.8,
    orders_count: 210,
    isChoice: true,
    badge: "Choice Fashion",
    specs: {
      material: "Wool Blend (Haijunjiki)",
      sizes: "46, 48, 50, 52, 54, 56",
      colors: "Black, Navy Blue, Grey"
    },
    description: "Suti maridadi sana kwa sherehe, ofisi au mikutano rasmi. Inashonwa kwa ustadi wa hali ya juu.",
    seller: {
      id: "gentleman-tz",
      name: "Dar Modern Tailoring",
      phone: "+255715998877",
      whatsapp: "+255715998877",
      verified: true
    }
  },
  {
    id: "fashion-sneakers-jordan",
    name: "Nike Air Jordan Retro Sneakers",
    category: "fashion",
    categoryLabel: "Mitindo: Viatu",
    price: 75000,
    original_price: 110000,
    currency: "TZS",
    location: "Kariakoo & Kinondoni",
    image_url: "https://images.unsplash.com/photo-1552346154-21d32810aba3?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1552346154-21d32810aba3?w=800&auto=format&fit=crop&q=80"
    ],
    rating: 4.7,
    orders_count: 530,
    isChoice: false,
    badge: "SuperDeal -32%",
    specs: {
      sizes: "39, 40, 41, 42, 43, 44, 45",
      sole: "Cushioned Air Sole"
    },
    description: "Viatu vya michezo na mtoko. Ni vyepesi, vya kisasa na vinadumu.",
    seller: {
      id: "sneaker-hub",
      name: "Sneakers Tanzania",
      phone: "+255768223344",
      whatsapp: "+255768223344",
      verified: true
    }
  },

  // --- 6. HOME, FURNITURE & APPLIANCES ---
  {
    id: "home-sofa-lshape",
    name: "Seti ya Masofa ya Kisasa (L-Shape 6 Seater)",
    category: "home",
    categoryLabel: "Samani za Nyumbani",
    price: 850000,
    original_price: 1100000,
    currency: "TZS",
    location: "Mwananyamala Workshop, Dar",
    image_url: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&auto=format&fit=crop&q=80"
    ],
    rating: 4.9,
    orders_count: 76,
    isChoice: true,
    badge: "Mbao Ngumu",
    specs: {
      fabric: "Velvet laini inayofutika kirahisi",
      wood: "Mninga & Mkongo uliotibiwa",
      warranty: "Miaka 3"
    },
    description: "Sofa za kisasa za kupendezesha sebule yako. Zinakuja na mito 6 ya mapambo bila malipo.",
    seller: {
      id: "furniture-dar",
      name: "Swahili Fine Furniture",
      phone: "+255745667788",
      whatsapp: "+255745667788",
      verified: true
    }
  },
  {
    id: "home-fridge-boss",
    name: "Friji ya Milango Miwili 210L (No Frost)",
    category: "home",
    categoryLabel: "Vyombo & Friji",
    price: 680000,
    original_price: 820000,
    currency: "TZS",
    location: "Kariakoo, Dar es Salaam",
    image_url: "https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=800&auto=format&fit=crop&q=80"
    ],
    rating: 4.8,
    orders_count: 115,
    isChoice: false,
    badge: "Inatumia Umeme Kidogo",
    specs: {
      capacity: "210 Litres",
      features: "Eco Inverter, Lock & Key",
      warranty: "Miaka 2 Compressor"
    },
    description: "Friji imara ya kuhifadhi vyakula na mboga. Haigandishi barafu ya kero (No-Frost).",
    seller: {
      id: "appliances-tz",
      name: "Appliance Kings Dar",
      phone: "+255718332211",
      whatsapp: "+255718332211",
      verified: true
    }
  },

  // --- 7. BEAUTY, HEALTH & SPORTS ---
  {
    id: "beauty-oud-perfume",
    name: "Seti ya Perfume Asilia za Kiarabu (Oud Wood)",
    category: "beauty",
    categoryLabel: "Urembo & Perfume",
    price: 65000,
    original_price: 95000,
    currency: "TZS",
    location: "Dar es Salaam",
    image_url: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=800&auto=format&fit=crop&q=80"
    ],
    rating: 4.9,
    orders_count: 420,
    isChoice: true,
    badge: "Inakaa Masaa 48",
    specs: {
      volume: "100ml Eau De Parfum",
      notes: "Oud, Amber, Rose & Sandalwood"
    },
    description: "Harufu ya kuvutia na inayokaa kwenye nguo hata baada ya kufua.",
    seller: {
      id: "oud-palace",
      name: "Zanzibar Scents",
      phone: "+255712887766",
      whatsapp: "+255712887766",
      verified: true
    }
  },

  // --- 8. AGRICULTURE & FOOD (KILIMO NA VYAKULA) ---
  {
    id: "agri-rice-kyela",
    name: "Mchele Safi wa Kyela Daraja la Kwanza (25kg)",
    category: "agriculture",
    categoryLabel: "Kilimo & Vyakula",
    price: 68000,
    original_price: 80000,
    currency: "TZS",
    location: "Mbeya / Dar es Salaam Store",
    image_url: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&auto=format&fit=crop&q=80"
    ],
    rating: 5.0,
    orders_count: 670,
    isChoice: true,
    badge: "Mchele Asilia",
    specs: {
      weight: "Mfuko wa 25kg",
      aroma: "Harufu nzuri ya asili bila mawe"
    },
    description: "Mchele mweupe, laini na wenye harufu nzuri toka mashamba ya Kyela Mbeya.",
    seller: {
      id: "kyela-direct",
      name: "Mbeya Harvest Hub",
      phone: "+255754119933",
      whatsapp: "+255754119933",
      verified: true
    }
  },

  // --- 9. HARDWARE & TOOLS (ZANA NA UJENZI) ---
  {
    id: "tools-bosch-drill",
    name: "Drill ya Umeme & Betri Bosch (Seti ya Zana)",
    category: "tools",
    categoryLabel: "Zana & Vifaa vya Ujenzi",
    price: 135000,
    original_price: 175000,
    currency: "TZS",
    location: "Kariakoo Hardware Market",
    image_url: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&auto=format&fit=crop&q=80"
    ],
    rating: 4.8,
    orders_count: 180,
    isChoice: false,
    badge: "Seti Kamili",
    specs: {
      power: "24V Lithium-Ion Battery (x2)",
      accessories: "Misumari, bits 24, na sanduku lake"
    },
    description: "Drill imara ya kupiga kwenye ukuta, mbao na bati. Betri mbili za dharura zimejumuishwa.",
    seller: {
      id: "tools-kariakoo",
      name: "Tanzania Hardware Center",
      phone: "+255713884422",
      whatsapp: "+255713884422",
      verified: true
    }
  }
];

// Top Navigation Categories in AliExpress Style
export const SHOP_CATEGORIES = [
  { id: "all", label: "Zote (All)", icon: "🛍️" },
  { id: "rentals", label: "Vyumba & Maeneo (Rentals)", icon: "🏠", highlight: true },
  { id: "realestate", label: "Nyumba & Viwanja", icon: "🏢", highlight: true },
  { id: "vehicles", label: "Magari & Assets", icon: "🚗", highlight: true },
  { id: "electronics", label: "Simu & Elektroniki", icon: "📱" },
  { id: "fashion", label: "Mitindo & Mavazi", icon: "👗" },
  { id: "home", label: "Nyumbani & Samani", icon: "🛋️" },
  { id: "beauty", label: "Urembo & Afya", icon: "💄" },
  { id: "agriculture", label: "Kilimo & Vyakula", icon: "🌾" },
  { id: "tools", label: "Zana za Ujenzi", icon: "🔨" }
];

export function AliExpressShop({
  profile,
  onShowToast,
  onViewUserProfile,
  lang = "sw",
  onOpenAuth
}) {
  const isSw = lang === "sw";

  // State
  const [items, setItems] = useState(() => {
    try {
      const stored = localStorage.getItem("aliexpress_custom_listings");
      if (stored) {
        const parsed = JSON.parse(stored);
        return [...parsed, ...SEED_SHOP_ITEMS];
      }
    } catch {}
    return SEED_SHOP_ITEMS;
  });

  const [activeCategory, setActiveCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("popular"); // 'popular' | 'price_low' | 'price_high' | 'newest' | 'rating'
  const [priceMax, setPriceMax] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [selectedRentalType, setSelectedRentalType] = useState("all");

  // Cart & Wishlist
  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("aliexpress_cart") || "[]");
    } catch {
      return [];
    }
  });
  const [cartOpen, setCartOpen] = useState(false);

  // Active Detail Modal
  const [detailItem, setDetailItem] = useState(null);
  const [activeModalImage, setActiveModalImage] = useState(0);

  // Direct Checkout / Payment Modal
  const [paymentItem, setPaymentItem] = useState(null);

  // Add Listing Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newListing, setNewListing] = useState({
    name: "",
    category: "rentals",
    price: "",
    original_price: "",
    location: "Dar es Salaam",
    description: "",
    image_url: "",
    rentPeriod: "kwa mwezi",
    specsText: "",
    phone: profile?.phone || "",
    whatsapp: profile?.whatsapp || profile?.phone || ""
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [followedIds, setFollowedIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("followed_user_ids") || "[]");
    } catch {
      return [];
    }
  });

  // Countdown timer for Flash Deals (AliExpress style)
  const [timeLeft, setTimeLeft] = useState({ hours: 7, minutes: 24, seconds: 45 });
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 12, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Save Cart to storage
  useEffect(() => {
    try {
      localStorage.setItem("aliexpress_cart", JSON.stringify(cart));
    } catch {}
  }, [cart]);

  // Load backend catalogues if available
  useEffect(() => {
    getManagerCatalogues()
      .then((remoteItems) => {
        if (Array.isArray(remoteItems) && remoteItems.length > 0) {
          const formatted = remoteItems.map((c) => ({
            id: c.id,
            name: c.name || c.title || "Bidhaa",
            category: c.category || "electronics",
            categoryLabel: c.category || "Bidhaa",
            price: Number(c.price) || 0,
            original_price: c.original_price ? Number(c.original_price) : 0,
            currency: c.currency || "TZS",
            image_url: c.image_url || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80",
            images: Array.isArray(c.images) && c.images.length ? c.images : [c.image_url],
            description: c.description || "",
            rating: 4.8,
            orders_count: c.orders_count || 12,
            isChoice: true,
            badge: "Verified Listing",
            seller: {
              id: c.manager_id,
              name: c.profiles?.display_name || "Muuzaji wa Duara",
              phone: c.whatsapp_number || c.profiles?.phone || "",
              whatsapp: c.whatsapp_number || c.profiles?.phone || "",
              verified: true
            }
          }));

          setItems((prev) => {
            const existingIds = new Set(prev.map((x) => x.id));
            const newOnes = formatted.filter((f) => !existingIds.has(f.id));
            return [...newOnes, ...prev];
          });
        }
      })
      .catch(() => {});
  }, []);

  // Add to cart
  const handleAddToCart = (item, e) => {
    if (e) e.stopPropagation();
    setCart((prev) => {
      const exists = prev.find((x) => x.id === item.id);
      if (exists) {
        return prev.map((x) => (x.id === item.id ? { ...x, quantity: x.quantity + 1 } : x));
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    if (onShowToast) {
      onShowToast(isSw ? `✓ "${item.name}" imewekwa kwenye mkokoteni!` : `✓ "${item.name}" added to cart!`);
    }
  };

  // Follow / Unfollow seller or landlord
  const handleToggleFollow = async (sellerId, sellerName, e) => {
    if (e) e.stopPropagation();
    if (!sellerId) return;
    const isNow = !followedIds.includes(sellerId);
    let updated;
    if (isNow) {
      updated = [...followedIds, sellerId];
    } else {
      updated = followedIds.filter((id) => id !== sellerId);
    }
    setFollowedIds(updated);
    try {
      localStorage.setItem("followed_user_ids", JSON.stringify(updated));
      if (profile?.id) {
        await followUser(profile.id, sellerId);
      }
    } catch {}
    if (onShowToast) {
      onShowToast(
        isNow
          ? `✓ Umemfollow ${sellerName || "Muuzaji"}!`
          : `✓ Umeacha kumfollow ${sellerName || "Muuzaji"}`
      );
    }
  };

  // Filtered & Sorted items
  const filteredItems = useMemo(() => {
    let list = [...items];

    // Category
    if (activeCategory !== "all") {
      list = list.filter((item) => {
        const cat = (item.category || "").toLowerCase();
        if (activeCategory === "rentals") return cat.includes("rental") || cat.includes("panga") || cat.includes("vyumba");
        if (activeCategory === "realestate") return cat.includes("realestate") || cat.includes("nyumba") || cat.includes("kiwanja") || cat.includes("shamba");
        if (activeCategory === "vehicles") return cat.includes("vehicle") || cat.includes("gari") || cat.includes("pikipiki") || cat.includes("bajaji");
        return cat.includes(activeCategory);
      });
    }

    // Search query
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (item) =>
          item.name?.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q) ||
          item.location?.toLowerCase().includes(q) ||
          item.categoryLabel?.toLowerCase().includes(q)
      );
    }

    // Price Filter
    if (priceMax && !isNaN(Number(priceMax))) {
      list = list.filter((item) => item.price <= Number(priceMax));
    }

    // Location Filter
    if (selectedLocation !== "all") {
      list = list.filter((item) => item.location?.toLowerCase().includes(selectedLocation.toLowerCase()));
    }

    // Rental type
    if (selectedRentalType !== "all") {
      list = list.filter((item) => item.propertyType === selectedRentalType);
    }

    // Sorting
    if (sortBy === "price_low") {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price_high") {
      list.sort((a, b) => b.price - a.price);
    } else if (sortBy === "rating") {
      list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === "newest") {
      // reverse default
    } else {
      // Popular (orders count)
      list.sort((a, b) => (b.orders_count || 0) - (a.orders_count || 0));
    }

    return list;
  }, [items, activeCategory, searchTerm, priceMax, selectedLocation, selectedRentalType, sortBy]);

  // Flash Deals items (Top discounted items)
  const flashDeals = useMemo(() => {
    return items.filter((x) => x.original_price && x.original_price > x.price).slice(0, 6);
  }, [items]);

  // Handle Image Upload for new listing
  const handleUploadImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const uploadedUrl = await uploadImage(profile?.id || "guest", file);
      setNewListing((prev) => ({ ...prev, image_url: uploadedUrl }));
      if (onShowToast) onShowToast("✓ Picha imepakiwa kikamilifu!");
    } catch {
      // Fallback object URL
      const fallbackUrl = URL.createObjectURL(file);
      setNewListing((prev) => ({ ...prev, image_url: fallbackUrl }));
    } finally {
      setUploadingImage(false);
    }
  };

  // Submit New Listing
  const handleCreateListing = async (e) => {
    e.preventDefault();
    if (!newListing.name.trim() || !newListing.price) {
      alert("Tafadhali weka jina la bidhaa/asset na bei.");
      return;
    }

    const priceNum = Number(newListing.price);
    const origPriceNum = newListing.original_price ? Number(newListing.original_price) : priceNum * 1.2;

    const newItem = {
      id: `custom_${Date.now()}`,
      name: newListing.name.trim(),
      category: newListing.category,
      categoryLabel:
        newListing.category === "rentals"
          ? "Kupanga (Vyumba & Maeneo)"
          : newListing.category === "realestate"
          ? "Kununua: Nyumba & Viwanja"
          : newListing.category === "vehicles"
          ? "Magari & Assets"
          : "Bidhaa Rasmi",
      price: priceNum,
      original_price: origPriceNum,
      currency: "TZS",
      rentPeriod: newListing.category === "rentals" ? newListing.rentPeriod : undefined,
      location: newListing.location || "Dar es Salaam",
      image_url:
        newListing.image_url ||
        (newListing.category === "rentals"
          ? "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop&q=80"
          : newListing.category === "vehicles"
          ? "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80"
          : "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80"),
      images: [
        newListing.image_url ||
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop&q=80"
      ],
      description: newListing.description || "",
      rating: 5.0,
      orders_count: 1,
      isChoice: true,
      badge: "Tangazo Jipya",
      specs: newListing.specsText ? { Maelezo: newListing.specsText } : {},
      seller: {
        id: profile?.id || "seller-custom",
        name: profile?.display_name || "Mwenye Mali",
        phone: newListing.phone || profile?.phone || "",
        whatsapp: newListing.whatsapp || profile?.whatsapp || "",
        verified: true
      }
    };

    // Save locally
    try {
      const stored = JSON.parse(localStorage.getItem("aliexpress_custom_listings") || "[]");
      stored.unshift(newItem);
      localStorage.setItem("aliexpress_custom_listings", JSON.stringify(stored));
    } catch {}

    // Save to database
    if (profile?.id && profile.role !== "guest") {
      createCatalogueProduct(profile.id, {
        name: newItem.name,
        price: newItem.price,
        original_price: newItem.original_price,
        category: newItem.category,
        image_url: newItem.image_url,
        description: newItem.description,
        whatsapp_number: newListing.whatsapp || profile?.phone
      }).catch(() => {});
    }

    setItems((prev) => [newItem, ...prev]);
    setAddModalOpen(false);
    setNewListing({
      name: "",
      category: "rentals",
      price: "",
      original_price: "",
      location: "Dar es Salaam",
      description: "",
      image_url: "",
      rentPeriod: "kwa mwezi",
      specsText: "",
      phone: profile?.phone || "",
      whatsapp: profile?.whatsapp || profile?.phone || ""
    });

    if (onShowToast) {
      onShowToast("✓ Tangazo lako limewekwa hewani kwenye Shop!");
    }
  };

  const totalCartAmount = cart.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);

  return (
    <div className="aliexpress-container" id="aliexpress-shop-root">
      {/* 1. ALIEXPRESS TOP SEARCH & ACTION BAR */}
      <div className="aliexpress-top-bar">
        <div className="aliexpress-brand-block">
          <div className="aliexpress-logo-icon">🛍️</div>
          <div>
            <div className="aliexpress-brand-name">DUARA EXPRESS</div>
            <div className="aliexpress-brand-sub">Soko la Kimataifa & Assets Tanzania</div>
          </div>
        </div>

        {/* Global AliExpress Search Bar */}
        <div className="aliexpress-search-wrapper">
          <input
            type="text"
            className="aliexpress-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              isSw
                ? "Tafuta simu, vyumba vya kupanga, nyumba, magari, mavazi..."
                : "Search phones, rentals, houses, cars, fashion..."
            }
          />
          {searchTerm && (
            <button
              type="button"
              className="aliexpress-search-clear"
              onClick={() => setSearchTerm("")}
            >
              ✕
            </button>
          )}
          <button type="button" className="aliexpress-search-btn">
            <span>🔍</span>
            <span className="search-btn-text">{isSw ? "Tafuta" : "Search"}</span>
          </button>
        </div>

        {/* Action Buttons: Tangaza Asset + Cart */}
        <div className="aliexpress-header-actions">
          <button
            type="button"
            className="aliexpress-post-btn"
            onClick={() => setAddModalOpen(true)}
            title="Tangaza Chumba, Nyumba, Gari au Bidhaa"
          >
            <span>+</span>
            <span>{isSw ? "Tangaza Asset / Bidhaa" : "Post Asset / Item"}</span>
          </button>

          <button
            type="button"
            className="aliexpress-cart-trigger"
            onClick={() => setCartOpen(true)}
            title="Mkokoteni wa Manunuzi"
          >
            <span className="cart-icon">🛒</span>
            <span className="cart-label">{isSw ? "Mkokoteni" : "Cart"}</span>
            {cart.length > 0 && <span className="cart-badge">{cart.reduce((a, b) => a + b.quantity, 0)}</span>}
          </button>
        </div>
      </div>

      {/* 2. ALIEXPRESS HORIZONTAL CATEGORY BAR */}
      <nav className="aliexpress-category-rail" aria-label="Shop Categories">
        {SHOP_CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setActiveCategory(cat.id);
                setSelectedRentalType("all");
              }}
              className={`aliexpress-category-pill ${isActive ? "active" : ""} ${cat.highlight ? "highlight" : ""}`}
            >
              <span className="cat-icon">{cat.icon}</span>
              <span className="cat-label">{cat.label}</span>
            </button>
          );
        })}
      </nav>

      {/* 3. ALIEXPRESS SUPERDEALS & FLASH SALE BANNER */}
      <div className="aliexpress-superdeals-banner">
        <div className="superdeals-header">
          <div className="superdeals-title-wrap">
            <span className="superdeals-lightning">⚡</span>
            <span className="superdeals-title">SUPER DEALS</span>
            <span className="superdeals-sub">Mauzo ya Chapchap · Hadi 60% Punguzo</span>
          </div>

          <div className="superdeals-timer">
            <span className="timer-label">{isSw ? "Muda uliobaki:" : "Ends in:"}</span>
            <span className="timer-box">{String(timeLeft.hours).padStart(2, "0")}</span>:
            <span className="timer-box">{String(timeLeft.minutes).padStart(2, "0")}</span>:
            <span className="timer-box">{String(timeLeft.seconds).padStart(2, "0")}</span>
          </div>
        </div>

        {/* Horizontal Mini Flash Deals Carousel */}
        <div className="superdeals-track">
          {flashDeals.map((deal) => {
            const discountPct = Math.round(((deal.original_price - deal.price) / deal.original_price) * 100);
            return (
              <div
                key={deal.id}
                className="superdeals-mini-card"
                onClick={() => setDetailItem(deal)}
              >
                <div className="mini-card-img-wrap">
                  <img src={deal.image_url} alt={deal.name} loading="lazy" />
                  <span className="mini-card-discount">-{discountPct}%</span>
                </div>
                <div className="mini-card-price">
                  <span className="mini-curr">TZS</span> {deal.price.toLocaleString()}
                </div>
                <div className="mini-card-original">
                  TZS {deal.original_price.toLocaleString()}
                </div>
                <div className="mini-card-title">{deal.name}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. REAL ESTATE & ASSET QUICK FILTER BAR (WHEN IN RENTALS, REAL ESTATE, VEHICLES) */}
      {(activeCategory === "rentals" || activeCategory === "realestate" || activeCategory === "vehicles") && (
        <div className="aliexpress-asset-filter-bar">
          <div className="asset-filter-heading">
            <span>📌</span>
            <span>
              {activeCategory === "rentals"
                ? "Chuja Vyumba & Maeneo ya Kupanga"
                : activeCategory === "realestate"
                ? "Chuja Nyumba na Viwanja vya Kununua"
                : "Chuja Magari na Vifaa Vizito"}
            </span>
          </div>

          <div className="asset-filter-controls">
            {activeCategory === "rentals" && (
              <select
                className="asset-filter-select"
                value={selectedRentalType}
                onChange={(e) => setSelectedRentalType(e.target.value)}
              >
                <option value="all">Aina Zote za Upangaji</option>
                <option value="apartment">Apartments za Kisasa</option>
                <option value="single_master">Vyumba Master (Single)</option>
                <option value="commercial_frame">Fremu za Biashara / Maduka</option>
                <option value="standalone_house">Nyumba Nzima ya Kupanga</option>
              </select>
            )}

            <select
              className="asset-filter-select"
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
            >
              <option value="all">Maeneo Yote (Tanzania)</option>
              <option value="Mikocheni">Mikocheni</option>
              <option value="Sinza">Sinza</option>
              <option value="Kariakoo">Kariakoo</option>
              <option value="Mbezi">Mbezi Beach</option>
              <option value="Kigamboni">Kigamboni</option>
              <option value="Goba">Goba</option>
              <option value="Bagamoyo">Bagamoyo / Kerege</option>
            </select>

            <div className="asset-filter-price-wrap">
              <span>Bei ya Juu:</span>
              <input
                type="number"
                placeholder="Mfano: 500000"
                className="asset-price-input"
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
              />
              {priceMax && (
                <button type="button" onClick={() => setPriceMax("")} className="asset-clear-price">
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. TOOLBAR: SORT & ITEM COUNT */}
      <div className="aliexpress-toolbar">
        <div className="toolbar-count">
          <span>{filteredItems.length}</span> {isSw ? "vitu vimepatikana" : "items found"}
        </div>

        <div className="toolbar-sort">
          <span className="sort-label">{isSw ? "Panga kwa:" : "Sort by:"}</span>
          <select
            className="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="popular">{isSw ? "Maarufu Zaidi (Popular)" : "Most Popular"}</option>
            <option value="price_low">{isSw ? "Bei: Chini kwenda Juu" : "Price: Low to High"}</option>
            <option value="price_high">{isSw ? "Bei: Juu kwenda Chini" : "Price: High to Low"}</option>
            <option value="rating">{isSw ? "Nyota & Ubora (Rating)" : "Top Rated"}</option>
            <option value="newest">{isSw ? "Mapya Zaidi (Newest)" : "Newest"}</option>
          </select>
        </div>
      </div>

      {/* 6. ALIEXPRESS PRODUCTS & ASSETS GRID */}
      {filteredItems.length === 0 ? (
        <div className="aliexpress-empty-state">
          <span className="empty-icon">🔍</span>
          <h3>{isSw ? "Hakuna bidhaa au asset iliyopatikana" : "No items match your search"}</h3>
          <p>{isSw ? "Jaribu kubadilisha maneno ya utafutaji au futa vichungi (filters)." : "Try broadening your search terms or clearing filters."}</p>
          <button
            type="button"
            className="aliexpress-reset-btn"
            onClick={() => {
              setSearchTerm("");
              setActiveCategory("all");
              setPriceMax("");
              setSelectedLocation("all");
              setSelectedRentalType("all");
            }}
          >
            {isSw ? "Onyesha Bidhaa Zote" : "Show All Products"}
          </button>
        </div>
      ) : (
        <div className="aliexpress-grid">
          {filteredItems.map((item) => {
            const hasDiscount = item.original_price && item.original_price > item.price;
            const discountPct = hasDiscount
              ? Math.round(((item.original_price - item.price) / item.original_price) * 100)
              : null;
            const isRental = item.category === "rentals";
            const isRealEstate = item.category === "realestate";
            const isVehicle = item.category === "vehicles";
            const isFollowingSeller = item.seller?.id && followedIds.includes(item.seller.id);

            return (
              <div
                key={item.id}
                className="aliexpress-card"
                onClick={() => setDetailItem(item)}
              >
                {/* Product Image & Badges */}
                <div className="aliexpress-card-image-wrap">
                  <img src={item.image_url} alt={item.name} loading="lazy" />

                  {/* Top Badges */}
                  <div className="card-badge-top-left">
                    {item.isChoice && <span className="choice-pill">Choice</span>}
                    {discountPct && <span className="discount-pill">-{discountPct}%</span>}
                    {isRental && <span className="rental-pill">Kupanga</span>}
                    {isRealEstate && <span className="asset-pill">Asset</span>}
                    {isVehicle && <span className="vehicle-pill">Gari</span>}
                  </div>

                  {/* Quick Action Overlay */}
                  <button
                    type="button"
                    className="card-quick-cart"
                    onClick={(e) => handleAddToCart(item, e)}
                    title="Weka kwenye mkokoteni"
                  >
                    🛒
                  </button>
                </div>

                {/* Card Content */}
                <div className="aliexpress-card-content">
                  {/* Title */}
                  <h4 className="aliexpress-card-title" title={item.name}>
                    {item.name}
                  </h4>

                  {/* Location or Category Kicker */}
                  <div className="aliexpress-card-kicker">
                    {item.location ? `📍 ${item.location}` : item.categoryLabel}
                  </div>

                  {/* Rating & Sold count */}
                  <div className="aliexpress-card-meta">
                    <span className="card-stars">★ {item.rating || 4.9}</span>
                    <span className="card-sep">·</span>
                    <span className="card-sold">
                      {isRental || isRealEstate
                        ? `${item.orders_count || 12} wameulizia`
                        : `${item.orders_count || 50}+ sold`}
                    </span>
                  </div>

                  {/* Price Block */}
                  <div className="aliexpress-card-price-block">
                    <div className="card-current-price">
                      <span className="price-currency">TZS</span>
                      <span className="price-num">{item.price.toLocaleString()}</span>
                      {isRental && <span className="price-period">/{item.rentPeriod || "mwezi"}</span>}
                    </div>

                    {hasDiscount && (
                      <div className="card-original-price">
                        TZS {item.original_price.toLocaleString()}
                      </div>
                    )}
                  </div>

                  {/* Free Delivery / Verified Landlord Badge */}
                  <div className="aliexpress-card-shipping">
                    {isRental
                      ? "✓ Mwenye Nyumba Halisi"
                      : isRealEstate
                      ? "✓ Hati Miliki Imethibitishwa"
                      : isVehicle
                      ? "✓ Kaguzi Imekamilika"
                      : "✓ Usafirishaji Bure"}
                  </div>

                  {/* Seller / Landlord info & Actions */}
                  <div className="aliexpress-card-footer">
                    <div className="card-seller-info">
                      <span className="seller-name">{item.seller?.name || "Duara Seller"}</span>
                    </div>

                    <div className="card-footer-buttons">
                      {item.seller?.id && (
                        <button
                          type="button"
                          className={`card-follow-btn ${isFollowingSeller ? "followed" : ""}`}
                          onClick={(e) => handleToggleFollow(item.seller.id, item.seller.name, e)}
                        >
                          {isFollowingSeller ? "✓ Ume-follow" : "+ Follow"}
                        </button>
                      )}

                      <button
                        type="button"
                        className="card-buy-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPaymentItem(item);
                        }}
                      >
                        {isRental ? "Panga" : isRealEstate ? "Nunua" : isVehicle ? "Tazama" : "Nunua"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 7. ALIEXPRESS PRODUCT / ASSET DETAIL MODAL */}
      {detailItem && (
        <div className="modal-backdrop" onClick={() => setDetailItem(null)}>
          <div
            className="aliexpress-detail-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="detail-modal-close"
              onClick={() => setDetailItem(null)}
            >
              ✕
            </button>

            <div className="detail-modal-body">
              {/* Left Column: Image Gallery */}
              <div className="detail-modal-gallery">
                <div className="detail-main-image-wrap">
                  <img
                    src={
                      Array.isArray(detailItem.images) && detailItem.images.length > 0
                        ? detailItem.images[activeModalImage] || detailItem.image_url
                        : detailItem.image_url
                    }
                    alt={detailItem.name}
                  />
                  {detailItem.isChoice && <span className="choice-badge-large">Choice Certified</span>}
                </div>

                {/* Thumbnails */}
                {Array.isArray(detailItem.images) && detailItem.images.length > 1 && (
                  <div className="detail-thumbnails-row">
                    {detailItem.images.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className={`detail-thumb-btn ${activeModalImage === idx ? "active" : ""}`}
                        onClick={() => setActiveModalImage(idx)}
                      >
                        <img src={img} alt={`Thumb ${idx}`} />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Specs, Price & Checkout */}
              <div className="detail-modal-info">
                <div className="detail-kicker">
                  <span>{detailItem.categoryLabel}</span>
                  {detailItem.location && <span> · 📍 {detailItem.location}</span>}
                </div>

                <h2 className="detail-title">{detailItem.name}</h2>

                {/* Rating & Inquiries */}
                <div className="detail-meta-row">
                  <span className="detail-stars">★ {detailItem.rating || 4.9}</span>
                  <span className="detail-rating-text">({detailItem.orders_count || 24} reviews/orders)</span>
                  <span className="detail-verified">✓ 100% Verified by Duara</span>
                </div>

                {/* Price Box */}
                <div className="detail-price-box">
                  <div className="detail-price-main">
                    <span className="detail-curr">TZS</span>
                    <span className="detail-amount">{detailItem.price.toLocaleString()}</span>
                    {detailItem.rentPeriod && <span className="detail-period">/{detailItem.rentPeriod}</span>}
                  </div>
                  {detailItem.original_price && detailItem.original_price > detailItem.price && (
                    <div className="detail-price-old">
                      Bei ya Awali: TZS {detailItem.original_price.toLocaleString()}
                    </div>
                  )}
                </div>

                {/* Specifications Grid */}
                {detailItem.specs && Object.keys(detailItem.specs).length > 0 && (
                  <div className="detail-specs-card">
                    <div className="specs-card-title">Vipengele Muhimu (Specifications):</div>
                    <div className="specs-table">
                      {Object.entries(detailItem.specs).map(([k, v]) => (
                        <div key={k} className="specs-row">
                          <span className="specs-key">{k}:</span>
                          <span className="specs-val">{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Description */}
                {detailItem.description && (
                  <div className="detail-description">
                    <p>{detailItem.description}</p>
                  </div>
                )}

                {/* Seller & Landlord Block */}
                <div className="detail-seller-box">
                  <div className="seller-profile-wrap">
                    <span className="seller-avatar">👤</span>
                    <div>
                      <div className="seller-title">{detailItem.seller?.name || "Duara Merchant"}</div>
                      <div className="seller-sub">Muuzaji / Mwenye Nyumba Aliyethibitishwa</div>
                    </div>
                  </div>

                  {detailItem.seller?.id && (
                    <button
                      type="button"
                      className="seller-follow-btn"
                      onClick={() => handleToggleFollow(detailItem.seller.id, detailItem.seller.name)}
                    >
                      {followedIds.includes(detailItem.seller.id) ? "✓ Ume-follow" : "+ Follow"}
                    </button>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="detail-actions-group">
                  {/* WhatsApp Direct Contact */}
                  {detailItem.seller?.whatsapp && (
                    <a
                      href={`https://wa.me/${detailItem.seller.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
                        `Habari, nimeona tangazo lako la "${detailItem.name}" (TZS ${detailItem.price.toLocaleString()}) kwenye Duara Shop. Naomba maelezo zaidi.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-whatsapp-direct"
                    >
                      <span>💬</span> WhatsApp Direct
                    </a>
                  )}

                  {/* Phone Call */}
                  {detailItem.seller?.phone && (
                    <a href={`tel:${detailItem.seller.phone}`} className="btn-call-direct">
                      <span>📞</span> Piga Simu
                    </a>
                  )}

                  {/* Add to Cart */}
                  <button
                    type="button"
                    className="btn-add-cart-large"
                    onClick={() => handleAddToCart(detailItem)}
                  >
                    🛒 Weka Mkokoteni
                  </button>

                  {/* Instant Buy / Book Button */}
                  <button
                    type="button"
                    className="btn-buy-now-large"
                    onClick={() => {
                      setDetailItem(null);
                      setPaymentItem(detailItem);
                    }}
                  >
                    ⚡ {detailItem.category === "rentals" ? "Panga Sasa" : "Nunua Sasa (Instant Buy)"}
                  </button>
                </div>

                {/* Buyer Protection Guarantee */}
                <div className="detail-protection-guarantee">
                  <span>🛡️</span>
                  <span>
                    <strong>Ulinzi wa Mnunuzi wa Duara:</strong> Malipo yako yanalindwa. Pesa
                    hazitolewi hadi uhakikishe umepokea bidhaa au umekagua chumba/nyumba.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. SHOPPING CART DRAWER */}
      {cartOpen && (
        <div className="modal-backdrop" onClick={() => setCartOpen(false)}>
          <div className="aliexpress-cart-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="cart-drawer-header">
              <h3>🛒 Mkokoteni Wako ({cart.length})</h3>
              <button type="button" className="drawer-close-btn" onClick={() => setCartOpen(false)}>
                ✕
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="cart-drawer-empty">
                <span style={{ fontSize: 48 }}>🛍️</span>
                <p>Mkokoteni wako hauna bidhaa bado.</p>
                <button
                  type="button"
                  className="aliexpress-reset-btn"
                  onClick={() => setCartOpen(false)}
                >
                  Anza Kununua
                </button>
              </div>
            ) : (
              <>
                <div className="cart-drawer-items">
                  {cart.map((cartItem) => (
                    <div key={cartItem.id} className="cart-drawer-item">
                      <img src={cartItem.image_url} alt={cartItem.name} />
                      <div className="cart-item-info">
                        <div className="cart-item-name">{cartItem.name}</div>
                        <div className="cart-item-price">
                          TZS {cartItem.price.toLocaleString()} x {cartItem.quantity}
                        </div>
                        <div className="cart-qty-controls">
                          <button
                            type="button"
                            onClick={() => {
                              if (cartItem.quantity > 1) {
                                setCart((prev) =>
                                  prev.map((x) =>
                                    x.id === cartItem.id ? { ...x, quantity: x.quantity - 1 } : x
                                  )
                                );
                              } else {
                                setCart((prev) => prev.filter((x) => x.id !== cartItem.id));
                              }
                            }}
                          >
                            -
                          </button>
                          <span>{cartItem.quantity}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setCart((prev) =>
                                prev.map((x) =>
                                  x.id === cartItem.id ? { ...x, quantity: x.quantity + 1 } : x
                                )
                              );
                            }}
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="cart-remove-item"
                        onClick={() => setCart((prev) => prev.filter((x) => x.id !== cartItem.id))}
                        title="Ondoa"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>

                <div className="cart-drawer-footer">
                  <div className="cart-drawer-total">
                    <span>Jumla Kuu:</span>
                    <span className="total-val">TZS {totalCartAmount.toLocaleString()}</span>
                  </div>

                  <button
                    type="button"
                    className="cart-checkout-btn"
                    onClick={() => {
                      setCartOpen(false);
                      setPaymentItem({
                        id: `cart-bundle-${Date.now()}`,
                        name: `Manunuzi ya Mkokoteni (${cart.length} vitu)`,
                        price: totalCartAmount,
                        currency: "TZS"
                      });
                    }}
                  >
                    ✓ Kamilisha Malipo (Checkout)
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 9. ADD LISTING / TANGAZA ASSET MODAL */}
      {addModalOpen && (
        <div className="modal-backdrop" onClick={() => setAddModalOpen(false)}>
          <div className="aliexpress-add-modal" onClick={(e) => e.stopPropagation()}>
            <div className="add-modal-header">
              <h3>+ Tangaza Chumba, Nyumba, Gari au Bidhaa</h3>
              <button type="button" className="drawer-close-btn" onClick={() => setAddModalOpen(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateListing} className="add-modal-form">
              <div className="form-group">
                <label>Aina ya Tangazo / Category *</label>
                <select
                  value={newListing.category}
                  onChange={(e) => setNewListing({ ...newListing, category: e.target.value })}
                  required
                >
                  <option value="rentals">🏠 Kupangisha: Chumba, Apartment, Fremu au Eneo</option>
                  <option value="realestate">🏢 Kununua: Nyumba Kamili, Kiwanja, au Shamba</option>
                  <option value="vehicles">🚗 Magari, Pikipiki, Bajaji au Mitambo</option>
                  <option value="electronics">📱 Simu & Vifaa vya Kielektroniki</option>
                  <option value="fashion">👗 Mitindo, Mavazi & Viatu</option>
                  <option value="home">🛋️ Samani & Vifaa vya Nyumbani</option>
                  <option value="beauty">💄 Urembo & Afya</option>
                  <option value="agriculture">🌾 Kilimo & Mazao</option>
                  <option value="tools">🔨 Zana za Ujenzi & Hardware</option>
                </select>
              </div>

              <div className="form-group">
                <label>Jina la Bidhaa / Asset / Chumba *</label>
                <input
                  type="text"
                  placeholder="Mfano: Apartment ya Kisasa Vyumba 2 / Toyota IST 2012"
                  value={newListing.name}
                  onChange={(e) => setNewListing({ ...newListing, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Bei (TZS) *</label>
                  <input
                    type="number"
                    placeholder="Mfano: 250000"
                    value={newListing.price}
                    onChange={(e) => setNewListing({ ...newListing, price: e.target.value })}
                    required
                  />
                </div>

                {newListing.category === "rentals" && (
                  <div className="form-group">
                    <label>Muda wa Kodi</label>
                    <select
                      value={newListing.rentPeriod}
                      onChange={(e) => setNewListing({ ...newListing, rentPeriod: e.target.value })}
                    >
                      <option value="kwa mwezi">Kwa Mwezi</option>
                      <option value="miezi 3">Miezi 3</option>
                      <option value="miezi 6">Miezi 6</option>
                      <option value="kwa mwaka">Kwa Mwaka</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Mahali / Eneo (Location) *</label>
                <input
                  type="text"
                  placeholder="Mfano: Mikocheni B, Sinza, Kariakoo, au Arusha..."
                  value={newListing.location}
                  onChange={(e) => setNewListing({ ...newListing, location: e.target.value })}
                  required
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Namba ya Simu ya Kupigiwa</label>
                  <input
                    type="tel"
                    placeholder="0714 000 000"
                    value={newListing.phone}
                    onChange={(e) => setNewListing({ ...newListing, phone: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Namba ya WhatsApp</label>
                  <input
                    type="tel"
                    placeholder="0714 000 000"
                    value={newListing.whatsapp}
                    onChange={(e) => setNewListing({ ...newListing, whatsapp: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Picha ya Bidhaa / Asset (Pakia au Weka URL)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUploadImage}
                  style={{ marginBottom: 8 }}
                />
                {uploadingImage && <div className="uploading-hint">Inapakia picha...</div>}
                <input
                  type="url"
                  placeholder="Au weka Image URL hapa..."
                  value={newListing.image_url}
                  onChange={(e) => setNewListing({ ...newListing, image_url: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Vipengele vya Ziada / Specifications</label>
                <input
                  type="text"
                  placeholder="Mfano: Vyumba 2, Choo ndani, Luku ya pekee, Maji 24/7, Gari Automatic..."
                  value={newListing.specsText}
                  onChange={(e) => setNewListing({ ...newListing, specsText: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Maelezo ya Ziada (Description)</label>
                <textarea
                  rows={3}
                  placeholder="Eleza kwa ufupi sifa za chumba, nyumba, gari au bidhaa yako..."
                  value={newListing.description}
                  onChange={(e) => setNewListing({ ...newListing, description: e.target.value })}
                />
              </div>

              <div className="add-modal-footer">
                <button
                  type="button"
                  className="button button-soft"
                  onClick={() => setAddModalOpen(false)}
                >
                  Ghairi
                </button>
                <button type="submit" className="button button-primary">
                  ✓ Weka Hewani Tangazo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 10. REAL PAYMENT PROCESSING MODAL INTEGRATION */}
      {paymentItem && (
        <PaymentModal
          profile={profile}
          purpose={`Malipo ya ${paymentItem.name}`}
          amount={paymentItem.price}
          itemId={paymentItem.id}
          onSuccess={() => {
            setPaymentItem(null);
            if (onShowToast) {
              onShowToast("✓ Malipo yamekamilika! Muuzaji amearifiwa kutoa huduma.");
            }
          }}
          onClose={() => setPaymentItem(null)}
        />
      )}
    </div>
  );
}
