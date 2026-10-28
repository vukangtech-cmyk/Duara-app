// Formatters & Constants for Duara Marketplace

export function formatPrice(amount) {
  const num = Number(amount);
  if (isNaN(num) || num <= 0) {
    return "Maelewano";
  }
  return `TSh ${num.toLocaleString("en-US")}`;
}

export function formatRelativeDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 60) return "Sasa hivi";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `Dakika ${diffMin} zilizopita`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `Saa ${diffHours} zilizopita`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Jana";
  if (diffDays < 7) return `Siku ${diffDays} zilizopita`;
  if (diffDays < 30) return `Wiki ${Math.floor(diffDays / 7)} zilizopita`;

  const months = [
    "Jan", "Feb", "Mac", "Apr", "Mei", "Jun",
    "Jul", "Ago", "Sep", "Okt", "Nov", "Des"
  ];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatPhoneForWhatsApp(rawPhone) {
  if (!rawPhone) return "";
  let clean = String(rawPhone).replace(/[^\d+]/g, "");
  if (clean.startsWith("+")) clean = clean.substring(1);
  if (clean.startsWith("0")) {
    clean = "255" + clean.substring(1);
  } else if (!clean.startsWith("255") && clean.length === 9) {
    clean = "255" + clean;
  }
  return clean;
}

export function buildWhatsAppLink(phone, listingTitle = "", listingUrl = "") {
  const cleanPhone = formatPhoneForWhatsApp(phone);
  if (!cleanPhone) return null;
  const greeting = listingTitle
    ? `Habari! Nimeona tangazo lako la "${listingTitle}" kwenye Duara Marketplace. Bado ipo? ${listingUrl}`
    : `Habari! Nimeona mawasiliano yako kwenye Duara Marketplace.`;
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(greeting)}`;
}

export const TANZANIA_REGIONS = [
  "Dar es Salaam",
  "Dodoma",
  "Arusha",
  "Mwanza",
  "Morogoro",
  "Mbeya",
  "Kilimanjaro",
  "Tanga",
  "Iringa",
  "Tabora",
  "Kigoma",
  "Kagera",
  "Mara",
  "Manyara",
  "Singida",
  "Shinyanga",
  "Ruvuma",
  "Mtwara",
  "Lindi",
  "Rukwa",
  "Songwe",
  "Katavi",
  "Geita",
  "Simiyu",
  "Njombe",
  "Zanzibar Mjini Magharibi",
  "Kusini Unguja",
  "Kaskazini Unguja",
  "Kusini Pemba",
  "Kaskazini Pemba"
];

export const POPULAR_INSTITUTIONS = [
  "Mtu Binafsi / Nje ya Chuo",
  "UDSM - Chuo Kikuu cha Dar es Salaam",
  "UDOM - Chuo Kikuu cha Dodoma",
  "SUA - Sokoine University of Agriculture",
  "MZUMBE - Mzumbe University (Morogoro)",
  "IFM - Institute of Finance Management",
  "CBE - College of Business Education",
  "DIT - Dar es Salaam Institute of Technology",
  "TIA - Tanzania Institute of Accountancy",
  "MUST - Mbeya University of Science & Tech",
  "SAUT - St. Augustine University of Tanzania",
  "IAA - Institute of Accountancy Arusha",
  "ARU - Ardhi University",
  "OUT - Open University of Tanzania",
  "CUHAS - Catholic University of Health (Bugando)",
  "KCMUCo - Kilimanjaro Christian Medical University",
  "DUCE - Dar es Salaam University College of Education",
  "MUCE - Mkwawa University College of Education",
  "NIT - National Institute of Transport",
  "Chuo / Taasisi Nyingine"
];
