import { ref } from "vue";

export const DEFAULT_RECEIPT_CONFIG = {
  titleAr: "فاتورة بيع",
  titleEn: "SALES INVOICE",
  fontFamily: "Courier New, monospace",
  fontSize: 12,
  width: 280,
  header: {
    enabled: true,
    companyName: true,
    companyLogo: true,
    companyAddress: true,
    companyPhone: true,
    companyEmail: true,
    companyWebsite: true,
    companyVat: true,
    showQrCode: false,
    qrCodeText: "",
  },
  items: {
    enabled: true,
    showDescription: true,
    showPrice: true,
    showQuantity: true,
    showTotal: true,
    showDiscount: true,
    showTax: false,
  },
  payments: {
    enabled: true,
    showMethod: true,
    showAmount: true,
    showChange: false,
  },
  totals: {
    enabled: true,
    showSubtotal: true,
    showDiscount: true,
    showServiceFee: true,
    showTax: true,
    showGrandTotal: true,
    currency: "ج.م",
  },
  footer: {
    enabled: true,
    showThankYou: true,
    thankYouText: "شكراً لتسوقكم معنا",
    showOrderNumber: true,
    showDate: true,
    showTime: true,
    showCashier: false,
    showTerms: false,
    termsText: "",
  },
  colors: {
    primary: "#000000",
    secondary: "#333333",
    accent: "#666666",
    text: "#000000",
    background: "#ffffff",
  },
  layout: {
    headerStyle: "standard",
    footerStyle: "standard",
    showDivider: true,
    dividerStyle: "dashed",
    showBorder: true,
    borderStyle: "solid",
  },
};

export function useReceiptPrint() {
  const receiptConfig = ref<any>(null);
  const receiptConfigLoading = ref(false);

  async function fetchReceiptConfig() {
    receiptConfigLoading.value = true;
    try {
      const res = await $fetch<any>("/api/receipt/config");
      if (res.success) {
        receiptConfig.value = res.data;
      }
    } catch (e) {
      console.error("[POS] Failed to fetch receipt config:", e);
      receiptConfig.value = null;
    } finally {
      receiptConfigLoading.value = false;
    }
  }

  function printReceipt(params: {
    orderName: string;
    lastOrderItems: {
      product: { name: string };
      quantity: number;
      price: number;
      discount: number;
    }[];
    lastOrderPayments: { methodName: string; amount: number }[];
    lastOrderSubtotal: number;
    lastOrderDiscount: number;
    lastOrderServiceFee: number;
    lastOrderGrandTotal: number;
  }) {
    const cfg = receiptConfig.value?.receipt || DEFAULT_RECEIPT_CONFIG;
    const company = receiptConfig.value?.company || {};
    const paperWidth = cfg.width || 280;
    const popupWidth = Math.min(paperWidth + 120, 700);
    const receiptWindow = window.open(
      "",
      "_blank",
      `width=${popupWidth},height=600`,
    );
    if (!receiptWindow) return;

    const fontFamily = cfg.fontFamily || "Courier New, monospace";
    const fontSize = cfg.fontSize || 12;
    const currency = cfg.totals?.currency || "ج.م";
    const primaryColor = cfg.colors?.primary || "#000000";
    const secondaryColor = cfg.colors?.secondary || "#333333";
    const accentColor = cfg.colors?.accent || "#666666";
    const textColor = cfg.colors?.text || "#000000";
    const bgColor = cfg.colors?.background || "#ffffff";
    const layout = cfg.layout || {};
    const showDivider = layout.showDivider !== false;
    const dividerStyle = layout.dividerStyle || "dashed";
    const showBorder = layout.showBorder === true;
    const borderStyle = layout.borderStyle || "solid";
    const titleAr = cfg.titleAr || "فاتورة بيع";

    const now = new Date();
    const dateStr = now.toLocaleDateString("ar-EG");
    const timeStr = now.toLocaleTimeString("ar-EG", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const divider = showDivider
      ? `<div style="border-top:1px ${dividerStyle} #000;margin:8px 0"></div>`
      : "";

    const headerHtml = cfg.header?.enabled
      ? `
    <div style="text-align:center;margin-bottom:12px;color:${primaryColor}">
      ${cfg.header?.companyLogo && company.logo ? `<img src="data:image/png;base64,${company.logo}" style="height:48px;margin-bottom:4px;object-fit:contain" />` : ""}
      ${cfg.header?.companyName && company.name ? `<div style="font-size:16px;font-weight:bold">${company.name}</div>` : ""}
      ${cfg.header?.companyAddress && company.address?.city ? `<div style="font-size:12px;line-height:1.625;color:${secondaryColor}">${[company.address.street, company.address.street2, company.address.city].filter(Boolean).join(", ")}</div>` : ""}
      ${cfg.header?.companyPhone && company.phone ? `<div style="font-size:12px;color:${secondaryColor}">${company.phone}</div>` : ""}
      ${cfg.header?.companyEmail && company.email ? `<div style="font-size:12px;color:${secondaryColor}">${company.email}</div>` : ""}
      ${cfg.header?.companyWebsite && company.website ? `<div style="font-size:12px;color:${secondaryColor}">${company.website}</div>` : ""}
      ${cfg.header?.companyVat && company.vat ? `<div style="font-size:12px;color:${secondaryColor}">الرقم الضريبي: ${company.vat}</div>` : ""}
    </div>
    ${divider}
  `
      : "";

    const titleHtml = `
    <div style="text-align:center;font-size:14px;font-weight:bold;margin-bottom:8px;color:${primaryColor}">${titleAr}</div>
    ${
      cfg.footer?.showOrderNumber ||
      cfg.footer?.showDate ||
      cfg.footer?.showTime
        ? `<div style="text-align:center;font-size:12px;margin-bottom:8px;color:${secondaryColor}">
      ${cfg.footer?.showOrderNumber ? `<div>${params.orderName}</div>` : ""}
      ${cfg.footer?.showDate || cfg.footer?.showTime ? `<div>${cfg.footer?.showDate ? dateStr : ""} ${cfg.footer?.showTime ? timeStr : ""}</div>` : ""}
    </div>`
        : ""
    }
    ${divider}
  `;

    const itemsHtml = cfg.items?.enabled
      ? `
    <table style="width:100%;border-collapse:collapse;font-size:12px">
      <thead>
        <tr>
          <th style="text-align:right;padding:4px 2px;border-bottom:1px solid ${primaryColor};color:${primaryColor};font-weight:bold">المنتج</th>
          ${cfg.items?.showQuantity ? `<th style="text-align:center;padding:4px 2px;border-bottom:1px solid ${primaryColor};color:${primaryColor};font-weight:bold">الكمية</th>` : ""}
          ${cfg.items?.showPrice ? `<th style="text-align:left;padding:4px 2px;border-bottom:1px solid ${primaryColor};color:${primaryColor};font-weight:bold">السعر</th>` : ""}
          ${cfg.items?.showTotal ? `<th style="text-align:left;padding:4px 2px;border-bottom:1px solid ${primaryColor};color:${primaryColor};font-weight:bold">الإجمالي</th>` : ""}
        </tr>
      </thead>
      <tbody>
        ${params.lastOrderItems
          .map(
            (item) => `
          <tr>
            <td style="text-align:right;padding:4px 2px">${item.product.name}</td>
            ${cfg.items?.showQuantity ? `<td style="text-align:center;padding:4px 2px">${item.quantity}</td>` : ""}
            ${cfg.items?.showPrice ? `<td style="text-align:left;padding:4px 2px">${item.price.toFixed(2)}</td>` : ""}
            ${cfg.items?.showTotal ? `<td style="text-align:left;padding:4px 2px">${(item.price * item.quantity).toFixed(2)}</td>` : ""}
          </tr>
        `,
          )
          .join("")}
      </tbody>
    </table>
    ${divider}
  `
      : "";

    const paymentsHtml = cfg.payments?.enabled
      ? `
    <table style="width:100%;border-collapse:collapse;font-size:12px">
      <tr><th style="text-align:right;padding:4px 0;color:${primaryColor};font-weight:bold" colspan="2">طرق الدفع</th></tr>
      ${params.lastOrderPayments
        .map(
          (p) => `
        <tr>
          ${cfg.payments?.showMethod ? `<td style="text-align:right;padding:2px 0">${p.methodName}</td>` : ""}
          ${cfg.payments?.showAmount ? `<td style="text-align:left;padding:2px 0">${p.amount.toFixed(2)} ${currency}</td>` : ""}
        </tr>
      `,
        )
        .join("")}
    </table>
    ${divider}
  `
      : "";

    const totalRows = [];
    if (cfg.totals?.enabled) {
      if (cfg.totals?.showSubtotal) {
        totalRows.push(
          `<tr><td style="text-align:right;padding:2px 0">المجموع</td><td style="text-align:left;padding:2px 0">${params.lastOrderSubtotal.toFixed(2)} ${currency}</td></tr>`,
        );
      }
      if (cfg.totals?.showDiscount && params.lastOrderDiscount > 0) {
        totalRows.push(
          `<tr><td style="text-align:right;padding:2px 0;color:${accentColor}">الخصم</td><td style="text-align:left;padding:2px 0;color:${accentColor}">-${params.lastOrderDiscount.toFixed(2)} ${currency}</td></tr>`,
        );
      }
      if (cfg.totals?.showServiceFee && params.lastOrderServiceFee > 0) {
        totalRows.push(
          `<tr><td style="text-align:right;padding:2px 0;color:${accentColor}">رسوم إضافية</td><td style="text-align:left;padding:2px 0;color:${accentColor}">+${params.lastOrderServiceFee.toFixed(2)} ${currency}</td></tr>`,
        );
      }
      if (cfg.totals?.showGrandTotal) {
        totalRows.push(
          `<tr style="font-weight:bold"><td style="text-align:right;padding:4px 0;border-top:1px solid ${primaryColor};color:${primaryColor}">الإجمالي</td><td style="text-align:left;padding:4px 0;border-top:1px solid ${primaryColor};color:${primaryColor}">${params.lastOrderGrandTotal.toFixed(2)} ${currency}</td></tr>`,
        );
      }
    }

    const totalsHtml =
      totalRows.length > 0
        ? `
    <table style="width:100%;border-collapse:collapse;font-size:12px">
      ${totalRows.join("")}
    </table>
    ${divider}
  `
        : "";

    const footerHtml = cfg.footer?.enabled
      ? `
    <div style="text-align:center;font-size:12px;line-height:1.625;color:${secondaryColor}">
      ${cfg.footer?.showThankYou ? `<div>${cfg.footer?.thankYouText || "شكراً لتسوقكم معنا"}</div>` : ""}
      ${cfg.footer?.showTerms && cfg.footer?.termsText ? `<div style="margin-top:4px">${cfg.footer.termsText}</div>` : ""}
    </div>
  `
      : "";

    const borderCss = showBorder
      ? `border:1px ${borderStyle} ${primaryColor};padding:8px;`
      : "padding:8px;";

    receiptWindow.document.write(`
    <!DOCTYPE html>
    <html dir="rtl">
    <head>
      <meta charset="utf-8" />
      <title>فاتورة - ${params.orderName}</title>
      <style>
        @page { margin: 0; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: ${fontFamily};
          font-size: ${fontSize}px;
          color: ${textColor};
          background: ${bgColor};
          width: ${paperWidth}px;
          margin: 0 auto;
        }
        .no-print { display: block; }
        @media print {
          .no-print { display: none !important; }
          body { width: 100%; }
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="text-align:center;padding:20px 0;">
        <button onclick="window.print()" style="padding:12px 40px;font-size:14px;font-weight:bold;background:#059669;color:white;border:none;border-radius:8px;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.15);">
          طباعة الفاتورة
        </button>
        <p style="margin-top:10px;font-size:12px;color:#888;">أو استخدم Ctrl+P للطباعة</p>
      </div>
      <div style="${borderCss}">
        ${headerHtml}
        ${titleHtml}
        ${itemsHtml}
        ${totalsHtml}
        ${paymentsHtml}
        ${footerHtml}
      </div>
    </body>
    </html>
  `);
    receiptWindow.document.close();
  }

  return { receiptConfig, receiptConfigLoading, fetchReceiptConfig, printReceipt };
}
