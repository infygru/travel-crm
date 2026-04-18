export const CURRENCIES: Record<string, { symbol: string; locale: string; name: string }> = {
  INR: { symbol: "₹",    locale: "en-IN", name: "Indian Rupee" },
  USD: { symbol: "$",    locale: "en-US", name: "US Dollar" },
  EUR: { symbol: "€",    locale: "de-DE", name: "Euro" },
  GBP: { symbol: "£",    locale: "en-GB", name: "British Pound" },
  AED: { symbol: "AED",  locale: "ar-AE", name: "UAE Dirham" },
  SAR: { symbol: "SAR",  locale: "ar-SA", name: "Saudi Riyal" },
  QAR: { symbol: "QAR",  locale: "ar-QA", name: "Qatari Riyal" },
  KWD: { symbol: "KWD",  locale: "ar-KW", name: "Kuwaiti Dinar" },
  BHD: { symbol: "BHD",  locale: "ar-BH", name: "Bahraini Dinar" },
  OMR: { symbol: "OMR",  locale: "ar-OM", name: "Omani Rial" },
  SGD: { symbol: "S$",   locale: "en-SG", name: "Singapore Dollar" },
  MYR: { symbol: "RM",   locale: "ms-MY", name: "Malaysian Ringgit" },
  THB: { symbol: "฿",    locale: "th-TH", name: "Thai Baht" },
  IDR: { symbol: "Rp",   locale: "id-ID", name: "Indonesian Rupiah" },
  PHP: { symbol: "₱",    locale: "en-PH", name: "Philippine Peso" },
  VND: { symbol: "₫",    locale: "vi-VN", name: "Vietnamese Dong" },
  HKD: { symbol: "HK$",  locale: "zh-HK", name: "Hong Kong Dollar" },
  CNY: { symbol: "¥",    locale: "zh-CN", name: "Chinese Yuan" },
  JPY: { symbol: "¥",    locale: "ja-JP", name: "Japanese Yen" },
  KRW: { symbol: "₩",    locale: "ko-KR", name: "South Korean Won" },
  AUD: { symbol: "A$",   locale: "en-AU", name: "Australian Dollar" },
  NZD: { symbol: "NZ$",  locale: "en-NZ", name: "New Zealand Dollar" },
  CAD: { symbol: "CA$",  locale: "en-CA", name: "Canadian Dollar" },
  CHF: { symbol: "CHF",  locale: "de-CH", name: "Swiss Franc" },
  ZAR: { symbol: "R",    locale: "en-ZA", name: "South African Rand" },
  TRY: { symbol: "₺",    locale: "tr-TR", name: "Turkish Lira" },
  LKR: { symbol: "Rs",   locale: "si-LK", name: "Sri Lankan Rupee" },
  NPR: { symbol: "Rs",   locale: "ne-NP", name: "Nepalese Rupee" },
  BDT: { symbol: "৳",    locale: "bn-BD", name: "Bangladeshi Taka" },
  PKR: { symbol: "Rs",   locale: "ur-PK", name: "Pakistani Rupee" },
  EGP: { symbol: "EGP",  locale: "ar-EG", name: "Egyptian Pound" },
  KES: { symbol: "KSh",  locale: "sw-KE", name: "Kenyan Shilling" },
  NGN: { symbol: "₦",    locale: "en-NG", name: "Nigerian Naira" },
};

export const CURRENCIES_LIST = Object.entries(CURRENCIES).map(([code, v]) => ({
  code,
  symbol: v.symbol,
  name: v.name,
  label: `${code} — ${v.name}`,
}));

export function formatCurrency(
  amount: number,
  currency = "INR",
  opts?: { maximumFractionDigits?: number; compact?: boolean }
): string {
  const cfg = CURRENCIES[currency] ?? CURRENCIES.INR;
  try {
    if (opts?.compact && amount >= 1_000_000) {
      return `${cfg.symbol}${(amount / 1_000_000).toFixed(1)}M`;
    }
    if (opts?.compact && amount >= 1_000) {
      return `${cfg.symbol}${(amount / 1_000).toFixed(0)}k`;
    }
    return new Intl.NumberFormat(cfg.locale, {
      style: "currency",
      currency,
      maximumFractionDigits: opts?.maximumFractionDigits ?? 0,
      minimumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${cfg.symbol}${amount.toLocaleString()}`;
  }
}

export function getCurrencySymbol(currency = "INR"): string {
  return CURRENCIES[currency]?.symbol ?? currency;
}
