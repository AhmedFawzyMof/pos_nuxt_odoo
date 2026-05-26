import { defineEventHandler, getQuery } from "h3";
import { connectToOdoo } from "~~/server/utils/client";
import { tryCatch } from "~~/server/utils/tryCatch";

export default defineEventHandler(async (event) => {
  const kpis = [
    {
      title: "إيرادات الفترة",
      value: "0.00 ج.م",
      change: "--",
      changeType: "positive",
      icon: "trending_up",
      color: "primary",
    },
    {
      title: "المصاريف التشغيلية",
      value: "0.00 ج.م",
      change: "--",
      changeType: "negative",
      icon: "payments",
      color: "error",
    },
    {
      title: "منتجات منخفضة المخزون",
      value: "0 منتج",
      change: "عاجل",
      changeType: "warning",
      icon: "warning",
      color: "secondary",
    },
    {
      title: "إجمالي العملاء",
      value: "0 عميل",
      change: "--",
      changeType: "positive",
      icon: "group",
      color: "tertiary",
    },
  ];

  const session = await getUserSession(event);
  if (!session.user) {
    return { success: false, error: "not authenticated" };
  }

  // ?date_from=2026-05-01&date_to=2026-05-25  (both optional, default = today)
  const { date_from, date_to } = getQuery(event);

  const odoo = connectToOdoo(
    session.odooUsername as string,
    session.odooPassword as string,
  );

  const [connectErr] = await tryCatch(odoo.connect());
  if (connectErr) {
    return {
      success: false,
      error: `Connection failed: ${connectErr.message}`,
    };
  }

  const [kpiErr, data] = await tryCatch(
    odoo.execute_kw("kpi.dashboard", "get_kpis", [
      {
        date_from: date_from ?? false,
        date_to: date_to ?? false,
      },
    ]),
  );
  if (kpiErr) {
    return { success: false, error: `KPI fetch failed: ${kpiErr.message}` };
  }

  const { total_revenue, total_expenses, low_stock_count, total_customers } =
    data as any;

  kpis[0]!.value = `${(total_revenue as number).toLocaleString("en-US", { minimumFractionDigits: 2 })} ج.م`;
  kpis[1]!.value = `${(total_expenses as number).toLocaleString("en-US", { minimumFractionDigits: 2 })} ج.م`;
  kpis[2]!.value = `${low_stock_count} منتج`;
  kpis[3]!.value = `${total_customers} عميل`;

  kpis[2]!.change = low_stock_count > 0 ? "عاجل" : "مستقر";
  kpis[2]!.changeType = low_stock_count > 0 ? "warning" : "positive";

  return { success: true, kpis, date_from, date_to };
});
