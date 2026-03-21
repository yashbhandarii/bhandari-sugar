const CMD = {
    INIT: new Uint8Array([0x1b, 0x40]),
    ALIGN_LEFT: new Uint8Array([0x1b, 0x61, 0x00]),
    ALIGN_CENTER: new Uint8Array([0x1b, 0x61, 0x01]),
    BOLD_ON: new Uint8Array([0x1b, 0x45, 0x01]),
    BOLD_OFF: new Uint8Array([0x1b, 0x45, 0x00]),
    DOUBLE_HEIGHT: new Uint8Array([0x1d, 0x21, 0x10]),
    NORMAL_SIZE: new Uint8Array([0x1d, 0x21, 0x00]),
    FEED_LINE: new Uint8Array([0x0a]),
    CUT: new Uint8Array([0x1d, 0x56, 0x00])
};

const CHARS_PER_LINE = 32;
const PAPER_WIDTH_MM = 57.5;
const PRINT_WIDTH_MM = 48;

const textEncoder = new TextEncoder();

function toBytes(text) {
    return textEncoder.encode(text);
}

function sanitizeText(value) {
    return String(value ?? '')
        .replace(/[^\x20-\x7E]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function formatMoney(value) {
    return `Rs ${Number(value || 0).toFixed(2)}`;
}

function formatDate(value) {
    const date = value ? new Date(value) : new Date();
    return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function divider(char = '-') {
    return char.repeat(CHARS_PER_LINE);
}

function fitText(value, length, align = 'left') {
    const text = sanitizeText(value);
    if (text.length >= length) {
        return text.slice(0, length);
    }

    if (align === 'right') {
        return text.padStart(length, ' ');
    }

    if (align === 'center') {
        const left = Math.floor((length - text.length) / 2);
        return `${' '.repeat(left)}${text}`.padEnd(length, ' ');
    }

    return text.padEnd(length, ' ');
}

function twoColumn(left, right) {
    const rightText = sanitizeText(right);
    const maxLeft = Math.max(1, CHARS_PER_LINE - rightText.length - 1);
    const leftText = sanitizeText(left).slice(0, maxLeft);
    return `${leftText}${' '.repeat(CHARS_PER_LINE - leftText.length - rightText.length)}${rightText}`;
}

function wrapText(value, width = CHARS_PER_LINE) {
    const text = sanitizeText(value);
    if (!text) return [''];

    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    words.forEach((word) => {
        if (!currentLine) {
            currentLine = word;
            return;
        }

        if (`${currentLine} ${word}`.length <= width) {
            currentLine = `${currentLine} ${word}`;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    });

    if (currentLine) {
        lines.push(currentLine);
    }

    return lines;
}

function getInvoiceItems(invoice) {
    return Array.isArray(invoice?.items) ? invoice.items : [];
}

function getInvoiceStatus(invoice) {
    const total = Number(invoice?.total_amount || 0);
    const paid = Number(invoice?.paid_amount || 0);
    const pending = total - paid;
    return pending <= 0 ? 'PAID' : 'UNPAID';
}

export function buildReceiptText(invoice) {
    const items = getInvoiceItems(invoice);
    const subtotal = Number(invoice?.base_amount ?? invoice?.subtotal ?? 0);
    const discount = Number(invoice?.discount_amount || 0);
    const cgst = Number(invoice?.cgst_amount || 0);
    const sgst = Number(invoice?.sgst_amount || 0);
    const total = Number(invoice?.total_amount || 0);
    const paid = Number(invoice?.paid_amount || 0);
    const pending = Number(invoice?.pending_amount ?? (total - paid));
    const status = getInvoiceStatus(invoice);

    const lines = [
        'BHANDARI SUGAR',
        'LALCHAND TRADERS',
        'GODOWN TAX INVOICE',
        divider('='),
        twoColumn('Invoice', sanitizeText(invoice?.invoice_number || 'NA')),
        twoColumn('Date', formatDate(invoice?.invoice_date)),
        ...wrapText(`Customer: ${sanitizeText(invoice?.name || 'Walk-in')}`, CHARS_PER_LINE),
        ...(invoice?.mobile ? wrapText(`Mobile: ${sanitizeText(invoice.mobile)}`, CHARS_PER_LINE) : []),
        divider('-'),
        'Item                Qty    Amt',
        divider('-')
    ];

    items.forEach((item) => {
        const itemName = sanitizeText(item.category || item.name || 'Item');
        const amount = Number(item.amount || (Number(item.bags || 0) * Number(item.rate || 0)));
        lines.push(...wrapText(itemName, 18));
        lines.push(twoColumn(`${item.bags || 0} x ${formatMoney(item.rate || 0)}`, formatMoney(amount)));
    });

    lines.push(
        divider('='),
        twoColumn('Taxable', formatMoney(subtotal)),
        ...(discount > 0 ? [twoColumn('Discount', `- ${formatMoney(discount)}`)] : []),
        twoColumn('CGST 2.5%', formatMoney(cgst)),
        twoColumn('SGST 2.5%', formatMoney(sgst)),
        twoColumn('Paid', formatMoney(paid)),
        twoColumn('Pending', formatMoney(pending)),
        divider('-'),
        fitText(`TOTAL ${formatMoney(total)}`, CHARS_PER_LINE, 'center'),
        fitText(`STATUS: ${status}`, CHARS_PER_LINE, 'center'),
        divider('='),
        fitText('Thank you for your business', CHARS_PER_LINE, 'center')
    );

    return lines.join('\n');
}

async function writeBytesInChunks(bytes, chunkSize, writeChunk) {
    for (let offset = 0; offset < bytes.length; offset += chunkSize) {
        const chunk = bytes.slice(offset, offset + chunkSize);
        await writeChunk(chunk);
    }
}

export function buildReceiptBytes(invoice) {
    const items = getInvoiceItems(invoice);
    const subtotal = Number(invoice?.base_amount ?? invoice?.subtotal ?? 0);
    const discount = Number(invoice?.discount_amount || 0);
    const cgst = Number(invoice?.cgst_amount || 0);
    const sgst = Number(invoice?.sgst_amount || 0);
    const total = Number(invoice?.total_amount || 0);
    const paid = Number(invoice?.paid_amount || 0);
    const pending = Number(invoice?.pending_amount ?? (total - paid));
    const status = getInvoiceStatus(invoice);
    const parts = [];

    const pushCommand = (command) => parts.push(command);
    const pushLine = (text = '') => {
        parts.push(toBytes(`${text}\n`));
    };
    const pushWrapped = (text, width = CHARS_PER_LINE) => {
        wrapText(text, width).forEach((line) => pushLine(line));
    };

    pushCommand(CMD.INIT);
    pushCommand(CMD.ALIGN_CENTER);
    pushCommand(CMD.BOLD_ON);
    pushCommand(CMD.DOUBLE_HEIGHT);
    pushLine(fitText('BHANDARI SUGAR', CHARS_PER_LINE, 'center'));
    pushCommand(CMD.NORMAL_SIZE);
    pushLine(fitText('LALCHAND TRADERS', CHARS_PER_LINE, 'center'));
    pushLine(fitText('GODOWN TAX INVOICE', CHARS_PER_LINE, 'center'));
    pushCommand(CMD.BOLD_OFF);
    pushLine(divider('='));

    pushCommand(CMD.ALIGN_LEFT);
    pushLine(twoColumn('Invoice', sanitizeText(invoice?.invoice_number || 'NA')));
    pushLine(twoColumn('Date', formatDate(invoice?.invoice_date)));
    pushWrapped(`Customer: ${sanitizeText(invoice?.name || 'Walk-in')}`, CHARS_PER_LINE);
    if (invoice?.mobile) {
        pushWrapped(`Mobile: ${sanitizeText(invoice.mobile)}`, CHARS_PER_LINE);
    }
    pushLine(divider('-'));

    pushCommand(CMD.BOLD_ON);
    pushLine('Item                Qty    Amt');
    pushCommand(CMD.BOLD_OFF);
    pushLine(divider('-'));

    items.forEach((item) => {
        const itemName = sanitizeText(item.category || item.name || 'Item');
        const amount = Number(item.amount || (Number(item.bags || 0) * Number(item.rate || 0)));
        wrapText(itemName, 18).forEach((line) => pushLine(line));
        pushLine(twoColumn(`${item.bags || 0} x ${formatMoney(item.rate || 0)}`, formatMoney(amount)));
    });

    pushLine(divider('='));
    pushLine(twoColumn('Taxable', formatMoney(subtotal)));
    if (discount > 0) {
        pushLine(twoColumn('Discount', `- ${formatMoney(discount)}`));
    }
    pushLine(twoColumn('CGST 2.5%', formatMoney(cgst)));
    pushLine(twoColumn('SGST 2.5%', formatMoney(sgst)));
    pushLine(twoColumn('Paid', formatMoney(paid)));
    pushLine(twoColumn('Pending', formatMoney(pending)));
    pushLine(divider('-'));
    pushCommand(CMD.ALIGN_CENTER);
    pushCommand(CMD.BOLD_ON);
    pushCommand(CMD.DOUBLE_HEIGHT);
    pushLine(fitText(`TOTAL ${formatMoney(total)}`, CHARS_PER_LINE, 'center'));
    pushCommand(CMD.NORMAL_SIZE);
    pushCommand(CMD.BOLD_OFF);
    pushLine(fitText(`STATUS: ${status}`, CHARS_PER_LINE, 'center'));
    pushLine(divider('='));
    pushLine(fitText('Thank you for your business', CHARS_PER_LINE, 'center'));
    pushLine('');
    pushLine('');
    pushCommand(CMD.CUT);

    const totalLength = parts.reduce((sum, part) => sum + part.length, 0);
    const bytes = new Uint8Array(totalLength);
    let offset = 0;

    parts.forEach((part) => {
        bytes.set(part, offset);
        offset += part.length;
    });

    return bytes;
}

export async function printViaBluetooth(bytes) {
    if (!navigator.bluetooth) {
        throw new Error('Web Bluetooth is not available in this browser.');
    }

    const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb']
    });

    if (!device.gatt) {
        throw new Error('Selected Bluetooth printer does not expose a writable GATT service.');
    }

    const server = await device.gatt.connect();

    try {
        const services = await server.getPrimaryServices();
        let writableCharacteristic = null;

        for (const service of services) {
            const characteristics = await service.getCharacteristics();
            writableCharacteristic = characteristics.find((characteristic) => characteristic.properties.write || characteristic.properties.writeWithoutResponse);
            if (writableCharacteristic) break;
        }

        if (!writableCharacteristic) {
            throw new Error('No writable Bluetooth characteristic found for this printer.');
        }

        const canWriteWithoutResponse = writableCharacteristic.properties.writeWithoutResponse
            && typeof writableCharacteristic.writeValueWithoutResponse === 'function';
        const writeChunk = (chunk) => (
            canWriteWithoutResponse
                ? writableCharacteristic.writeValueWithoutResponse(chunk)
                : writableCharacteristic.writeValue(chunk)
        );

        await writeBytesInChunks(bytes, 180, writeChunk);
    } finally {
        if (server.connected) {
            server.disconnect();
        }
    }
}

export async function printInvoice(invoice) {
    const bytes = buildReceiptBytes(invoice);
    return printViaBluetooth(bytes);
}

export async function shareInvoice(invoice) {
    if (!navigator.share) {
        throw new Error('Share is not available in this browser.');
    }

    const text = buildReceiptText(invoice);
    const data = {
        title: `Invoice ${invoice?.invoice_number || ''}`.trim(),
        text
    };

    if (navigator.canShare && !navigator.canShare(data)) {
        throw new Error('This browser cannot share the invoice text.');
    }

    await navigator.share(data);
}

export function printReceiptHTML(invoice) {
    const items = getInvoiceItems(invoice);
    const subtotal = Number(invoice?.base_amount ?? invoice?.subtotal ?? 0);
    const discount = Number(invoice?.discount_amount || 0);
    const cgst = Number(invoice?.cgst_amount || 0);
    const sgst = Number(invoice?.sgst_amount || 0);
    const total = Number(invoice?.total_amount || 0);
    const paid = Number(invoice?.paid_amount || 0);
    const pending = Number(invoice?.pending_amount ?? (total - paid));
    const status = getInvoiceStatus(invoice);
    const customerName = escapeHtml(invoice?.name || 'Walk-in');
    const customerMobile = invoice?.mobile ? escapeHtml(invoice.mobile) : '';

    const itemRows = items.map((item) => {
        const itemName = escapeHtml(item.category || item.name || 'Item');
        const quantity = Number(item.bags || 0);
        const rate = Number(item.rate || 0);
        const amount = Number(item.amount || (quantity * rate));

        return `
            <div class="item-block">
                <div class="item-name">${itemName}</div>
                <div class="row compact">
                    <span>${quantity} x ${formatMoney(rate)}</span>
                    <span>${formatMoney(amount)}</span>
                </div>
            </div>
        `;
    }).join('');

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <title>Thermal Invoice ${escapeHtml(invoice?.invoice_number || 'Invoice')}</title>
    <style>
        @page {
            size: ${PAPER_WIDTH_MM}mm auto;
            margin: 0;
        }

        :root {
            --paper-width: ${PAPER_WIDTH_MM}mm;
            --print-width: ${PRINT_WIDTH_MM}mm;
        }

        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            background: #fff;
            font-family: "Courier New", Courier, monospace;
            color: #000;
            width: var(--paper-width);
        }

        .receipt {
            width: var(--print-width);
            margin: 0 auto;
            padding: 2mm 0;
            font-size: 10px;
            line-height: 1.28;
        }

        .center {
            text-align: center;
        }

        .title {
            font-size: 15px;
            font-weight: 700;
            letter-spacing: 0.4px;
        }

        .subtitle {
            font-size: 10px;
            font-weight: 700;
            margin-top: 1mm;
        }

        .divider {
            border-top: 1px dashed #000;
            margin: 2mm 0;
        }

        .row {
            display: flex;
            justify-content: space-between;
            gap: 8px;
        }

        .row.compact {
            font-size: 9px;
        }

        .meta,
        .summary {
            display: grid;
            gap: 1mm;
        }

        .item-block {
            margin-bottom: 2mm;
        }

        .item-name {
            font-weight: 700;
            word-break: break-word;
        }

        .grand-total {
            border-top: 1px solid #000;
            border-bottom: 1px solid #000;
            margin-top: 2mm;
            padding: 1.2mm 0;
            font-size: 13px;
            font-weight: 700;
        }

        .status {
            margin-top: 2mm;
            text-align: center;
            font-weight: 700;
            letter-spacing: 0.6px;
        }

        .footer {
            margin-top: 3mm;
            text-align: center;
            font-size: 9px;
        }

        @media screen {
            body {
                background: #f5f5f5;
                padding: 16px 0;
            }

            .receipt {
                background: #fff;
                box-shadow: 0 10px 24px rgba(0, 0, 0, 0.12);
                padding: 3mm 2.5mm;
            }
        }
    </style>
</head>
<body>
    <div class="receipt">
        <div class="center title">BHANDARI SUGAR</div>
        <div class="center">LALCHAND TRADERS</div>
        <div class="center subtitle">GODOWN TAX INVOICE</div>

        <div class="divider"></div>

        <div class="meta">
            <div class="row"><span>Invoice</span><span>${escapeHtml(invoice?.invoice_number || 'NA')}</span></div>
            <div class="row"><span>Date</span><span>${escapeHtml(formatDate(invoice?.invoice_date))}</span></div>
            <div>Customer: ${customerName}</div>
            ${customerMobile ? `<div>Mobile: ${customerMobile}</div>` : ''}
        </div>

        <div class="divider"></div>

        <div class="row compact" style="font-weight:700;">
            <span>Item / Qty</span>
            <span>Amount</span>
        </div>
        <div class="divider"></div>

        ${itemRows}

        <div class="divider"></div>

        <div class="summary">
            <div class="row"><span>Taxable</span><span>${formatMoney(subtotal)}</span></div>
            ${discount > 0 ? `<div class="row"><span>Discount</span><span>- ${formatMoney(discount)}</span></div>` : ''}
            <div class="row"><span>CGST 2.5%</span><span>${formatMoney(cgst)}</span></div>
            <div class="row"><span>SGST 2.5%</span><span>${formatMoney(sgst)}</span></div>
            <div class="row"><span>Paid</span><span>${formatMoney(paid)}</span></div>
            <div class="row"><span>Pending</span><span>${formatMoney(pending)}</span></div>
        </div>

        <div class="grand-total row">
            <span>Total</span>
            <span>${formatMoney(total)}</span>
        </div>

        <div class="status">STATUS: ${status}</div>
        <div class="footer">58mm thermal print format</div>
        <div class="footer">Thank you for your business</div>
    </div>

    <script>
        window.onload = function () {
            window.print();
        };
    </script>
</body>
</html>
    `;

    const printWindow = window.open('', '_blank', 'width=420,height=720');
    if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
    } else {
        window.alert('Please allow popups to print the thermal invoice.');
    }
}

export function printPaymentReceiptHTML(payment) {
    const amount = Number(payment?.amount || 0);
    const discount = Number(payment?.discount || 0);
    const oldPending = Number(payment?.old_pending || 0);
    const newPending = Number(payment?.new_pending || 0);
    const dateStr = formatDate(payment?.date);
    const customerName = escapeHtml(payment?.customer_name || 'Customer');
    const mobile = payment?.mobile ? escapeHtml(payment.mobile) : '';
    const methodLabel = (payment?.method || 'cash').toUpperCase();

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <title>Payment Receipt</title>
    <style>
        @page {
            size: ${PAPER_WIDTH_MM}mm auto;
            margin: 0;
        }

        body {
            margin: 0;
            font-family: "Courier New", Courier, monospace;
            width: ${PAPER_WIDTH_MM}mm;
            color: #000;
        }

        .receipt {
            width: ${PRINT_WIDTH_MM}mm;
            margin: 0 auto;
            padding: 2mm 0;
            font-size: 10px;
            line-height: 1.28;
        }

        .center { text-align: center; }
        .title { font-size: 14px; font-weight: 700; }
        .divider { border-top: 1px dashed #000; margin: 2mm 0; }
        .row { display: flex; justify-content: space-between; gap: 8px; }
        .strong { font-weight: 700; }
        .balance { margin-top: 2mm; font-size: 12px; font-weight: 700; text-align: center; }
    </style>
</head>
<body>
    <div class="receipt">
        <div class="center title">BHANDARI SUGAR</div>
        <div class="center">PAYMENT RECEIPT</div>
        <div class="divider"></div>
        <div class="row"><span>Date</span><span>${escapeHtml(dateStr)}</span></div>
        ${payment?.invoice_id ? `<div class="row"><span>Invoice</span><span>${escapeHtml(String(payment.invoice_id))}</span></div>` : ''}
        <div class="divider"></div>
        <div class="strong">${customerName}</div>
        ${mobile ? `<div>Mobile: ${mobile}</div>` : ''}
        <div class="divider"></div>
        <div class="row"><span>Previous Pending</span><span>${formatMoney(oldPending)}</span></div>
        ${amount > 0 ? `<div class="row"><span>Payment Received</span><span>- ${formatMoney(amount)}</span></div>` : ''}
        ${discount > 0 ? `<div class="row"><span>Discount</span><span>- ${formatMoney(discount)}</span></div>` : ''}
        <div class="row"><span>Payment Mode</span><span>${escapeHtml(methodLabel)}</span></div>
        <div class="divider"></div>
        <div class="row strong"><span>New Pending</span><span>${formatMoney(newPending)}</span></div>
        <div class="balance">${newPending <= 0 ? 'ACCOUNT CLEARED' : `BALANCE ${formatMoney(newPending)}`}</div>
    </div>
    <script>
        window.onload = function () {
            window.print();
        };
    </script>
</body>
</html>
    `;

    const printWindow = window.open('', '_blank', 'width=420,height=720');
    if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
    } else {
        window.alert('Please allow popups to print the receipt.');
    }
}
