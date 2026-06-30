import { jsPDF } from 'jspdf';

/**
 * Generates a beautifully styled PDF bill/invoice.
 * @param {object} bill - The bill data object
 */
export const generateBillPDF = (bill) => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const W = doc.internal.pageSize.getWidth();   // 210
    const H = doc.internal.pageSize.getHeight();  // 297

    // ─── Brand colors ────────────────────────────────────────────────
    const PRIMARY   = [37,  99,  235]; // blue-600
    const DARK      = [15,  23,  42];  // slate-900
    const MID       = [71,  85,  105]; // slate-600
    const LIGHT     = [241, 245, 249]; // slate-100
    const WHITE     = [255, 255, 255];
    const SUCCESS   = [16,  185, 129]; // emerald-500
    const DIVIDER   = [203, 213, 225]; // slate-300

    // ─── Helpers ──────────────────────────────────────────────────────
    const rgb  = (c) => ({ r: c[0], g: c[1], b: c[2] });
    const setFill   = (c) => doc.setFillColor(...c);
    const setDraw   = (c) => doc.setDrawColor(...c);
    const setColor  = (c) => doc.setTextColor(...c);
    const bold      = (sz) => { doc.setFont('helvetica', 'bold');   doc.setFontSize(sz); };
    const normal    = (sz) => { doc.setFont('helvetica', 'normal'); doc.setFontSize(sz); };
    const italic    = (sz) => { doc.setFont('helvetica', 'italic'); doc.setFontSize(sz); };

    // ─── HEADER GRADIENT BLOCK ────────────────────────────────────────
    // Simulate gradient with two overlapping rects
    setFill([25, 75, 200]);
    doc.rect(0, 0, W, 52, 'F');
    setFill(PRIMARY);
    doc.rect(0, 0, W * 0.6, 52, 'F');

    // Decorative circles (top-right flair)
    doc.setFillColor(255, 255, 255, 0.06);
    doc.circle(W - 10, -5, 38, 'F');
    doc.circle(W + 5, 30, 25, 'F');

    // Logo icon circle
    setFill(WHITE);
    doc.circle(26, 26, 14, 'F');
    setColor(PRIMARY);
    bold(16);
    doc.text('S', 26, 30, { align: 'center' });

    // Brand name & tagline
    setColor(WHITE);
    bold(22);
    doc.text('ScanSmart', 46, 22);
    normal(9);
    doc.text('Smart Retail Shopping System', 46, 30);

    // INVOICE badge (right side)
    setFill([255, 255, 255, 0.15]);
    doc.roundedRect(W - 50, 14, 40, 14, 3, 3, 'F');
    setColor(WHITE);
    bold(10);
    doc.text('INVOICE', W - 30, 23, { align: 'center' });

    // ─── BILL META STRIP ─────────────────────────────────────────────
    setFill(DARK);
    doc.rect(0, 52, W, 20, 'F');

    const billDate = new Date(bill.createdAt || bill.created_at || Date.now());
    const dateStr  = billDate.toLocaleDateString('en-IN', {
        day: '2-digit', month: 'long', year: 'numeric'
    });
    const timeStr  = billDate.toLocaleTimeString('en-IN', {
        hour: '2-digit', minute: '2-digit', hour12: true
    });

    setColor([148, 163, 184]); // slate-400
    normal(7.5);
    doc.text('BILL ID', 14, 60);
    doc.text('DATE', 80, 60);
    doc.text('TIME', 130, 60);
    doc.text('PAYMENT', 175, 60);

    setColor(WHITE);
    bold(8.5);
    doc.text(bill.billId || bill.bill_id || 'N/A', 14, 67);
    doc.text(dateStr, 80, 67);
    doc.text(timeStr, 130, 67);
    doc.text((bill.paymentMethod || bill.payment_method || 'UPI').toUpperCase(), 175, 67);

    // ─── ITEMS TABLE ─────────────────────────────────────────────────
    let y = 84;

    // Table header
    setFill(LIGHT);
    doc.rect(14, y - 5, W - 28, 10, 'F');
    setDraw(DIVIDER);
    doc.setLineWidth(0.3);
    doc.line(14, y - 5, W - 14, y - 5);
    doc.line(14, y + 5, W - 14, y + 5);

    setColor(MID);
    bold(8);
    doc.text('#',      18,  y + 1);
    doc.text('ITEM',   28,  y + 1);
    doc.text('QTY',   122,  y + 1, { align: 'center' });
    doc.text('UNIT PRICE', 152, y + 1, { align: 'right' });
    doc.text('AMOUNT',     W - 14, y + 1, { align: 'right' });

    y += 12;

    const items = bill.items || [];
    items.forEach((item, idx) => {
        const name   = (item.name || item.product?.name || 'Product').substring(0, 32);
        const qty    = item.quantity || 1;
        const price  = item.price || 0;
        const amount = item.subtotal || price * qty;

        // Alternate row background
        if (idx % 2 === 0) {
            setFill([248, 250, 252]);
            doc.rect(14, y - 5, W - 28, 9, 'F');
        }

        setColor(DARK);
        normal(8.5);
        doc.text(`${idx + 1}`, 18, y);
        doc.text(name, 28, y);

        setColor(MID);
        doc.text(String(qty), 122, y, { align: 'center' });
        doc.text(`Rs.${price.toFixed(2)}`, 152, y, { align: 'right' });

        setColor(DARK);
        bold(8.5);
        doc.text(`Rs.${amount.toFixed(2)}`, W - 14, y, { align: 'right' });

        // Returned tag
        if (item.is_returned || item.isReturned) {
            setFill([254, 226, 226]);
            doc.roundedRect(28, y - 4.5, 20, 5.5, 1, 1, 'F');
            setColor([239, 68, 68]);
            normal(6);
            doc.text('RETURNED', 38, y - 0.5, { align: 'center' });
        }

        y += 10;

        // Page break guard
        if (y > H - 70) {
            doc.addPage();
            y = 20;
        }
    });

    // ─── DIVIDER LINE ─────────────────────────────────────────────────
    setDraw(DIVIDER);
    doc.setLineWidth(0.4);
    doc.line(14, y, W - 14, y);
    y += 8;

    // ─── TOTALS BLOCK ────────────────────────────────────────────────
    const totalsX  = 120;
    const valX     = W - 14;
    const rowH     = 8;

    const addTotalRow = (label, value, colorLabel = MID, colorValue = DARK, isBold = false) => {
        setColor(colorLabel);
        normal(9);
        doc.text(label, totalsX, y);
        setColor(colorValue);
        if (isBold) bold(9); else normal(9);
        doc.text(value, valX, y, { align: 'right' });
        y += rowH;
    };

    addTotalRow('Subtotal', `Rs.${(bill.subtotal || 0).toFixed(2)}`);

    if (bill.discount > 0) {
        addTotalRow(
            `Discount${bill.discount_code || bill.discountCode ? ` (${bill.discount_code || bill.discountCode})` : ''}`,
            `-Rs.${bill.discount.toFixed(2)}`,
            SUCCESS, SUCCESS
        );
    }

    addTotalRow(`GST (${bill.tax_rate || bill.taxRate || 18}%)`, `Rs.${(bill.tax || 0).toFixed(2)}`);

    // Grand total row
    y += 2;
    setFill(PRIMARY);
    doc.roundedRect(totalsX - 6, y - 6, W - totalsX + 6 - 8, 12, 2, 2, 'F');
    setColor(WHITE);
    bold(10);
    doc.text('TOTAL PAID', totalsX, y + 1);
    doc.text(`Rs.${(bill.total || 0).toFixed(2)}`, valX, y + 1, { align: 'right' });
    y += 18;

    // ─── SAVINGS BANNER ───────────────────────────────────────────────
    if (bill.discount > 0) {
        setFill([209, 250, 229]); // emerald-100
        doc.roundedRect(14, y, W - 28, 12, 2, 2, 'F');
        setColor(SUCCESS);
        bold(9);
        doc.text(
            `🎉  You saved Rs.${bill.discount.toFixed(2)} on this order!`,
            W / 2, y + 7.5, { align: 'center' }
        );
        y += 18;
    }

    // ─── STATUS STAMP ────────────────────────────────────────────────
    const status = (bill.paymentStatus || bill.payment_status || 'completed').toUpperCase();
    const stampColor = status === 'COMPLETED' ? SUCCESS : [239, 68, 68];
    setDraw(stampColor);
    doc.setLineWidth(1.5);
    doc.roundedRect(W - 62, y - 15, 48, 16, 3, 3);
    setColor(stampColor);
    bold(12);
    doc.text(status, W - 38, y - 4, { align: 'center' });

    // ─── FOOTER ──────────────────────────────────────────────────────
    const footerY = H - 24;

    setFill(DARK);
    doc.rect(0, footerY, W, H - footerY, 'F');

    setColor([148, 163, 184]);
    normal(7.5);
    doc.text('Thank you for shopping with ScanSmart!', W / 2, footerY + 8, { align: 'center' });
    doc.text('This is a computer-generated invoice and requires no signature.', W / 2, footerY + 14, { align: 'center' });

    // Decorative bottom line
    setFill(PRIMARY);
    doc.rect(0, footerY, W, 1.5, 'F');

    // ─── PAGE NUMBER ─────────────────────────────────────────────────
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        setColor([148, 163, 184]);
        normal(7);
        doc.text(`Page ${i} of ${totalPages}`, W / 2, H - 3, { align: 'center' });
    }

    // ─── SAVE ────────────────────────────────────────────────────────
    doc.save(`ScanSmart-Invoice-${bill.billId || bill.bill_id || 'receipt'}.pdf`);
};
