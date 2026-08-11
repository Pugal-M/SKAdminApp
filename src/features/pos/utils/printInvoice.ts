import { CartItem } from '../store/usePOSStore';

interface InvoiceData {
  invoiceNumber: string;
  cart: CartItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: string;
  customerName?: string;
}

export const printInvoice = (data: InvoiceData) => {
  const printWindow = window.open('', '_blank', 'width=400,height=600');
  if (!printWindow) {
    console.error('Popup blocked. Cannot print invoice.');
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Invoice ${data.invoiceNumber}</title>
        <style>
          @page { margin: 0; }
          body {
            font-family: 'Courier New', Courier, monospace;
            margin: 0;
            padding: 10px;
            width: 80mm; /* Thermal printer width */
            color: #000;
          }
          .header { text-align: center; margin-bottom: 20px; }
          .header h1 { margin: 0; font-size: 1.2rem; }
          .header p { margin: 2px 0; font-size: 0.8rem; }
          
          .divider { border-top: 1px dashed #000; margin: 10px 0; }
          
          .items { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
          .items th { text-align: left; border-bottom: 1px dashed #000; padding-bottom: 5px; }
          .items td { padding: 5px 0; vertical-align: top; }
          .items .qty { text-align: center; }
          .items .price { text-align: right; }
          
          .totals { width: 100%; font-size: 0.8rem; margin-top: 10px; }
          .totals td { padding: 3px 0; }
          .totals .label { text-align: left; }
          .totals .value { text-align: right; }
          .totals .grand-total { font-weight: bold; font-size: 1rem; border-top: 1px dashed #000; padding-top: 5px; }
          
          .footer { text-align: center; margin-top: 20px; font-size: 0.8rem; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>SKCart Store</h1>
          <p>123 Retail Ave, Shop City</p>
          <p>GSTIN: 27ABCDE1234F1Z5</p>
          <p>Date: ${new Date().toLocaleString()}</p>
          <p>Receipt: ${data.invoiceNumber}</p>
        </div>
        
        <table class="items">
          <thead>
            <tr>
              <th>Item</th>
              <th class="qty">Qty</th>
              <th class="price">Amt</th>
            </tr>
          </thead>
          <tbody>
            ${data.cart.map(item => `
              <tr>
                <td>${item.name.substring(0, 15)}</td>
                <td class="qty">${item.quantity}</td>
                <td class="price">${item.subtotal.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="divider"></div>
        
        <table class="totals">
          <tr>
            <td class="label">Subtotal:</td>
            <td class="value">₹${data.subtotal.toFixed(2)}</td>
          </tr>
          ${data.discount > 0 ? `
          <tr>
            <td class="label">Discount:</td>
            <td class="value">-₹${data.discount.toFixed(2)}</td>
          </tr>
          ` : ''}
          ${data.tax > 0 ? `
          <tr>
            <td class="label">Tax:</td>
            <td class="value">+₹${data.tax.toFixed(2)}</td>
          </tr>
          ` : ''}
          <tr>
            <td class="label grand-total">Total:</td>
            <td class="value grand-total">₹${data.total.toFixed(2)}</td>
          </tr>
          <tr>
            <td class="label">Paid via:</td>
            <td class="value">${data.paymentMethod}</td>
          </tr>
        </table>
        
        <div class="footer">
          <div style="margin: 15px 0;">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(data.invoiceNumber)}" alt="QR Code" width="80" height="80" />
            <p style="font-size: 0.6rem; margin-top: 5px;">Scan for digital copy</p>
          </div>
          <p>Thank you for shopping with us!</p>
          <p>Please visit again.</p>
        </div>
        
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          }
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
};
