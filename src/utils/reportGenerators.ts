import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { Order, StoreSettings } from '../lib/types';

const formatCurrency = (amount: number) => `Rs ${amount.toFixed(2)}`;

// Helper to add header to PDF
const addPdfHeader = (doc: jsPDF, title: string, settings: StoreSettings | null, dateRange?: string) => {
  const restaurantName = settings?.restaurant_name || 'Restaurant Report';
  const logoUrl = settings?.logo_url;

  doc.setFontSize(18);
  doc.text(restaurantName, 14, 20);
  
  doc.setFontSize(14);
  doc.text(title, 14, 30);
  
  if (dateRange) {
    doc.setFontSize(10);
    doc.text(dateRange, 14, 38);
  }

  doc.setFontSize(10);
  doc.text(`Generated on: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 46);
  
  // Add a line
  doc.setLineWidth(0.5);
  doc.line(14, 50, 196, 50);
};

export const generateAnnualIncomeSummary = (orders: any[], year: number, settings: StoreSettings | null) => {
  const doc = new jsPDF();
  
  // Filter orders for the year
  const yearOrders = orders.filter(o => new Date(o.created_at).getFullYear() === year);
  
  // Aggregate by month
  const monthlyData = Array(12).fill(0).map((_, i) => ({
    month: format(new Date(year, i, 1), 'MMMM'),
    orders: 0,
    revenue: 0
  }));

  yearOrders.forEach(order => {
    const month = new Date(order.created_at).getMonth();
    monthlyData[month].orders += 1;
    monthlyData[month].revenue += order.total;
  });

  addPdfHeader(doc, `Annual Income Summary - ${year}`, settings);

  const tableData = monthlyData.map(d => [
    d.month,
    d.orders,
    formatCurrency(d.revenue),
    d.orders > 0 ? formatCurrency(d.revenue / d.orders) : '-'
  ]);

  // Add Totals Row
  const totalOrders = yearOrders.length;
  const totalRevenue = yearOrders.reduce((sum, o) => sum + o.total, 0);
  
  tableData.push([
    'TOTAL',
    totalOrders,
    formatCurrency(totalRevenue),
    totalOrders > 0 ? formatCurrency(totalRevenue / totalOrders) : '-'
  ]);

  autoTable(doc, {
    startY: 55,
    head: [['Month', 'Total Orders', 'Total Revenue', 'Avg Ticket']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [226, 94, 62] }, // Primary color
    footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' }
  });

  doc.save(`Annual_Income_Summary_${year}.pdf`);
};

export const generateDailySalesLedger = (orders: any[], settings: StoreSettings | null) => {
  const data = orders.map(order => ({
    Date: format(new Date(order.created_at), 'dd/MM/yyyy HH:mm'),
    'Order ID': order.order_code,
    Customer: order.customer_name,
    Subtotal: (order.total - (order.vat_amount || 0)).toFixed(2),
    VAT: (order.vat_amount || 0).toFixed(2),
    Total: order.total.toFixed(2),
    'Payment Method': order.payment_method.toUpperCase()
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Daily Sales');
  
  XLSX.writeFile(wb, `Daily_Sales_Ledger_${format(new Date(), 'yyyyMMdd')}.xlsx`);
};

export const generateMonthlySummary = (orders: any[], month: number, year: number, settings: StoreSettings | null) => {
  const doc = new jsPDF();
  
  const monthName = format(new Date(year, month, 1), 'MMMM yyyy');
  
  // Filter orders for the month
  const monthOrders = orders.filter(o => {
    const d = new Date(o.created_at);
    return d.getMonth() === month && d.getFullYear() === year;
  });

  // Aggregate by day
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dailyData = Array(daysInMonth).fill(0).map((_, i) => ({
    day: i + 1,
    orders: 0,
    revenue: 0
  }));

  monthOrders.forEach(order => {
    const day = new Date(order.created_at).getDate();
    dailyData[day - 1].orders += 1;
    dailyData[day - 1].revenue += order.total;
  });

  addPdfHeader(doc, `Monthly Summary - ${monthName}`, settings);

  const tableData = dailyData.map(d => [
    format(new Date(year, month, d.day), 'dd/MM/yyyy'),
    d.orders,
    formatCurrency(d.revenue)
  ]);

  // Add Totals
  const totalOrders = monthOrders.length;
  const totalRevenue = monthOrders.reduce((sum, o) => sum + o.total, 0);

  tableData.push([
    'TOTAL',
    totalOrders,
    formatCurrency(totalRevenue)
  ]);

  autoTable(doc, {
    startY: 55,
    head: [['Date', 'Daily Orders', 'Daily Revenue']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [226, 94, 62] }
  });

  doc.save(`Monthly_Summary_${monthName.replace(' ', '_')}.pdf`);
};

export const generateGstVatReturn = (orders: any[], settings: StoreSettings | null) => {
  const totalSales = orders.reduce((sum, o) => sum + o.total, 0);
  const totalVat = orders.reduce((sum, o) => sum + (o.vat_amount || 0), 0);
  const taxableSales = totalSales - totalVat;

  const summaryData = [
    { Item: 'Total Sales (Inclusive of VAT)', Amount: totalSales.toFixed(2) },
    { Item: 'Total VAT Collected', Amount: totalVat.toFixed(2) },
    { Item: 'Taxable Sales (Exclusive of VAT)', Amount: taxableSales.toFixed(2) },
    { Item: 'VAT Rate', Amount: `${settings?.vat_percentage || 0}%` }
  ];

  const detailData = orders.map(order => ({
    'Order ID': order.order_code,
    Date: format(new Date(order.created_at), 'dd/MM/yyyy'),
    'Total Amount': order.total.toFixed(2),
    'VAT Amount': (order.vat_amount || 0).toFixed(2),
    'Taxable Amount': (order.total - (order.vat_amount || 0)).toFixed(2)
  }));

  const wb = XLSX.utils.book_new();
  
  const wsSummary = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'VAT Summary');
  
  const wsDetail = XLSX.utils.json_to_sheet(detailData);
  XLSX.utils.book_append_sheet(wb, wsDetail, 'Transaction Details');

  XLSX.writeFile(wb, `VAT_Return_${format(new Date(), 'yyyyMMdd')}.xlsx`);
};

export const generateItemSalesAnalysis = (orders: any[], settings: StoreSettings | null) => {
  const itemMap = new Map<string, { category: string, quantity: number, revenue: number }>();
  let totalRevenue = 0;

  orders.forEach(order => {
    order.order_items.forEach((item: any) => {
      const current = itemMap.get(item.name) || { category: 'Unknown', quantity: 0, revenue: 0 };
      
      // Try to find category from menu_items if joined, or fallback
      // Since order_items might not have category directly if not joined properly in query
      // But reportsService joins order_items(*), which might not include menu_items(*)
      // Let's assume we can get it or just use 'Unknown' if not available
      // Actually, order_items usually has menu_item_id. We might need to fetch menu items separately or rely on what's available.
      // For now, let's just aggregate by name.
      
      const itemRevenue = item.price * item.quantity;
      itemMap.set(item.name, {
        category: item.menu_items?.category || 'General', // Assuming the join includes menu_items or we accept it might be missing
        quantity: current.quantity + item.quantity,
        revenue: current.revenue + itemRevenue
      });
      totalRevenue += itemRevenue;
    });
  });

  const data = Array.from(itemMap.entries()).map(([name, stats]) => ({
    'Item Name': name,
    'Quantity Sold': stats.quantity,
    'Revenue': stats.revenue.toFixed(2),
    '% of Total Sales': totalRevenue > 0 ? ((stats.revenue / totalRevenue) * 100).toFixed(2) + '%' : '0%'
  })).sort((a, b) => parseFloat(b.Revenue) - parseFloat(a.Revenue));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Item Analysis');

  XLSX.writeFile(wb, `Item_Sales_Analysis_${format(new Date(), 'yyyyMMdd')}.xlsx`);
};
