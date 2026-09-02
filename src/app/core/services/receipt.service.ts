import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import { OrderCheck } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class ReceiptService {
  download(check: OrderCheck): void {
    const document = new jsPDF({ unit: 'mm', format: 'a4' });
    const money = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' });
    const createdAt = new Intl.DateTimeFormat('it-IT', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(check.paidAt ?? check.generatedAt));
    let y = 20;

    document.setFont('helvetica', 'bold');
    document.setFontSize(22);
    document.text('Tavoo', 20, y);
    document.setFontSize(13);
    document.text(`Receipt #${check.orderId}`, 190, y, { align: 'right' });
    y += 10;

    document.setFont('helvetica', 'normal');
    document.setFontSize(10);
    document.text(`Table ${check.tableNumber}`, 20, y);
    document.text(`Waiter: ${check.waiterUsername}`, 75, y);
    document.text(createdAt, 190, y, { align: 'right' });
    y += 10;
    document.setDrawColor(210);
    document.line(20, y, 190, y);
    y += 7;

    document.setFont('helvetica', 'bold');
    document.text('Item', 20, y);
    document.text('Qty', 130, y, { align: 'right' });
    document.text('Unit', 158, y, { align: 'right' });
    document.text('Total', 190, y, { align: 'right' });
    y += 6;

    document.setFont('helvetica', 'normal');
    for (const item of check.items) {
      if (y > 270) {
        document.addPage();
        y = 20;
      }
      const itemName = document.splitTextToSize(item.menuItemName, 95) as string[];
      document.text(itemName, 20, y);
      document.text(String(item.quantity), 130, y, { align: 'right' });
      document.text(money.format(item.unitPrice), 158, y, { align: 'right' });
      document.text(money.format(item.totalAmount), 190, y, { align: 'right' });
      y += Math.max(7, itemName.length * 5);
    }

    if (check.copertoCount > 0) {
      document.text(`Coperto × ${check.copertoCount}`, 20, y);
      document.text(money.format(check.copertoUnitPrice), 158, y, { align: 'right' });
      document.text(money.format(check.copertoTotal), 190, y, { align: 'right' });
      y += 8;
    }

    document.line(115, y, 190, y);
    y += 7;
    document.text('Subtotal', 140, y, { align: 'right' });
    document.text(money.format(check.subtotal), 190, y, { align: 'right' });
    y += 6;
    document.text('Tax', 140, y, { align: 'right' });
    document.text(money.format(check.taxAmount), 190, y, { align: 'right' });
    y += 8;
    document.setFont('helvetica', 'bold');
    document.setFontSize(14);
    document.text('Total', 140, y, { align: 'right' });
    document.text(money.format(check.totalAmount), 190, y, { align: 'right' });
    y += 10;
    document.setFontSize(9);
    document.setFont('helvetica', 'normal');
    document.text(
      check.paymentMethod ? `Paid by ${check.paymentMethod}` : 'Payment pending',
      190,
      y,
      { align: 'right' },
    );

    document.save(`tavoo-receipt-${check.orderId}.pdf`);
  }
}
