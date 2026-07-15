/**
 * Email Service — sends order confirmation emails via Brevo SMTP.
 *
 * Returns:
 *   { success: true, messageId: "..." }
 *   { success: false, error: "..." }
 *
 * Never exposes SMTP_PASS in logs. Never crashes the caller — errors are
 * caught and returned as { success: false } so the order is always saved.
 */

const nodemailer = require('nodemailer');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Escape dynamic values so they are safe to inject into HTML. */
const escapeHtml = (str) => {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/** Build a full public URL for a product image. */
const resolveImageUrl = (image) => {
  if (!image) return `${process.env.FRONTEND_URL || 'https://prfumerie-79sf.vercel.app'}/images/placeholder.jpg`;
  if (image.startsWith('http://') || image.startsWith('https://')) return image;
  const base = (process.env.FRONTEND_URL || 'https://prfumerie-79sf.vercel.app').replace(/\/+$/, '');
  return `${base}${image.startsWith('/') ? '' : '/'}${image}`;
};

/** Format a number as MAD price. */
const formatPrice = (amount) => {
  const num = Number(amount) || 0;
  return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' MAD';
};

/** Format a Date to a readable French string in Africa/Casablanca timezone. */
const formatDateTime = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('fr-FR', {
    timeZone: 'Africa/Casablanca',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// ---------------------------------------------------------------------------
// HTML template
// ---------------------------------------------------------------------------

const buildOrderConfirmationHtml = (order) => {
  const frontendUrl = (process.env.FRONTEND_URL || 'https://prfumerie-79sf.vercel.app').replace(/\/+$/, '');

  const itemsHtml = order.items
    .map((item) => {
      const subTotal = (Number(item.price) || 0) * (Number(item.quantity) || 0);
      return `
        <tr>
          <td style="padding: 16px 0; border-bottom: 1px solid #f0ebe3; vertical-align: middle;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td width="72" style="vertical-align: middle; padding-right: 16px;">
                  <img
                    src="${escapeHtml(resolveImageUrl(item.image))}"
                    alt="${escapeHtml(item.name)}"
                    width="64"
                    height="80"
                    style="display: block; width: 64px; height: 80px; object-fit: cover; border-radius: 6px; border: 1px solid #f0ebe3;"
                  />
                </td>
                <td style="vertical-align: middle;">
                  <div style="font-family: 'Georgia', 'Times New Roman', serif; font-size: 15px; font-weight: 600; color: #1a1a1a; margin-bottom: 4px;">
                    ${escapeHtml(item.name)}
                  </div>
                  <div style="font-size: 12px; color: #8a8580;">
                    ${escapeHtml(item.size || '')} · ${formatPrice(item.price)}
                  </div>
                </td>
                <td width="100" style="vertical-align: middle; text-align: center;">
                  <span style="font-size: 13px; color: #5a5550;">×${Number(item.quantity) || 1}</span>
                </td>
                <td width="100" style="vertical-align: middle; text-align: right;">
                  <span style="font-family: 'Georgia', 'Times New Roman', serif; font-size: 15px; font-weight: 700; color: #1a1a1a;">
                    ${formatPrice(subTotal)}
                  </span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `;
    })
    .join('');

  // Delivery info
  const delivery = order.delivery || {};
  const deliveryFullName = delivery.fullName && delivery.fullName !== 'Not provided' ? delivery.fullName : order.name;
  const deliveryPhone = delivery.phone && delivery.phone !== 'Not provided' ? delivery.phone : order.phone;
  const deliveryAddress = delivery.address && delivery.address !== 'Not provided' ? delivery.address : order.location;
  const deliveryCity = delivery.city && delivery.city !== 'Not provided' ? delivery.city : '';
  const deliveryPostal = delivery.postalCode && delivery.postalCode !== 'Not provided' ? delivery.postalCode : '';

  const paymentMethodLabels = {
    cash_on_delivery: 'Paiement à la livraison',
    card_fake: 'Carte bancaire (simulation)',
    paypal_fake: 'PayPal (simulation)',
  };

  const deliveryMethodLabels = {
    standard: 'Standard (3–5 jours)',
    express: 'Express (1–2 jours)',
  };

  const productsPrice = order.productsPrice || order.subtotal || 0;
  const deliveryPrice = order.deliveryPrice || order.shipping || 0;
  const totalPrice = order.totalPrice || order.total || 0;

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Confirmation de commande</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f7f5f2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f7f5f2;">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06);">

          <!-- ── Header ── -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a1a2e, #2a2418); padding: 40px 32px 32px; text-align: center;">
              <h1 style="margin: 0; font-family: 'Georgia', 'Times New Roman', serif; font-size: 28px; font-weight: 700; color: #c9a24d; letter-spacing: 4px; text-transform: uppercase;">
                Prfumerie
              </h1>
              <p style="margin: 8px 0 0; font-size: 13px; color: rgba(255,255,255,0.6); letter-spacing: 1px;">
                Confirmation de commande
              </p>
            </td>
          </tr>

          <!-- ── Thank you ── -->
          <tr>
            <td style="padding: 32px 32px 8px;">
              <p style="margin: 0 0 6px; font-family: 'Georgia', 'Times New Roman', serif; font-size: 20px; font-weight: 600; color: #1a1a1a;">
                Merci pour votre commande, ${escapeHtml(order.name || '')} ✦
              </p>
              <p style="margin: 0; font-size: 14px; line-height: 1.7; color: #5a5550;">
                Votre commande a bien été reçue. Nous vous contacterons prochainement pour confirmer la livraison.
              </p>
            </td>
          </tr>

          <!-- ── Order info block ── -->
          <tr>
            <td style="padding: 24px 32px 8px;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background: #faf8f5; border-radius: 10px; padding: 20px 24px;">
                <tr>
                  <td style="padding: 6px 0;">
                    <span style="font-size: 12px; color: #8a8580; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">N° de commande</span>
                    <br/>
                    <span style="font-size: 14px; font-weight: 600; color: #1a1a1a; font-family: 'Courier New', monospace;">#${escapeHtml(String(order._id || ''))}</span>
                  </td>
                  <td style="padding: 6px 0; text-align: right;">
                    <span style="font-size: 12px; color: #8a8580; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Date</span>
                    <br/>
                    <span style="font-size: 14px; color: #1a1a1a;">${escapeHtml(formatDateTime(order.createdAt))}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 6px 0;">
                    <span style="font-size: 12px; color: #8a8580; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Statut</span>
                    <br/>
                    <span style="display: inline-block; margin-top: 4px; padding: 3px 12px; background: #fef3c7; color: #92400e; border-radius: 999px; font-size: 12px; font-weight: 600;">
                      ${escapeHtml(order.status === 'pending' ? 'En attente' : order.status)}
                    </span>
                  </td>
                  <td style="padding: 6px 0; text-align: right;">
                    <span style="font-size: 12px; color: #8a8580; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Mode de paiement</span>
                    <br/>
                    <span style="font-size: 14px; color: #1a1a1a;">${escapeHtml(paymentMethodLabels[order.payment?.method] || order.payment?.method || 'Non spécifié')}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── Delivery address ── -->
          <tr>
            <td style="padding: 16px 32px 8px;">
              <h2 style="margin: 0 0 12px; font-family: 'Georgia', 'Times New Roman', serif; font-size: 15px; font-weight: 600; color: #1a1a1a; letter-spacing: 0.5px;">
                Adresse de livraison
              </h2>
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background: #faf8f5; border-radius: 10px; padding: 16px 20px;">
                <tr>
                  <td style="font-size: 14px; line-height: 1.8; color: #3a3530;">
                    <strong>${escapeHtml(deliveryFullName || '')}</strong><br/>
                    ${escapeHtml(deliveryAddress || '')}<br/>
                    ${deliveryCity ? escapeHtml(deliveryCity) + (deliveryPostal ? ' ' : '') : ''}${escapeHtml(deliveryPostal || '')}<br/>
                    <span style="font-size: 12px; color: #8a8580;">
                      📞 ${escapeHtml(deliveryPhone || 'Non renseigné')} &nbsp;·&nbsp;
                      🚚 ${escapeHtml(deliveryMethodLabels[delivery.deliveryMethod] || delivery.deliveryMethod || 'Standard')}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── Products table ── -->
          <tr>
            <td style="padding: 24px 32px 8px;">
              <h2 style="margin: 0 0 16px; font-family: 'Georgia', 'Times New Roman', serif; font-size: 15px; font-weight: 600; color: #1a1a1a; letter-spacing: 0.5px;">
                Produits commandés
              </h2>
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                ${itemsHtml}
              </table>
            </td>
          </tr>

          <!-- ── Totals ── -->
          <tr>
            <td style="padding: 8px 32px 24px;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-top: 2px solid #f0ebe3; padding-top: 16px;">
                <tr>
                  <td style="padding: 6px 0; font-size: 14px; color: #5a5550;">Sous-total</td>
                  <td style="padding: 6px 0; font-size: 14px; color: #1a1a1a; text-align: right;">${formatPrice(productsPrice)}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-size: 14px; color: #5a5550;">
                    Livraison
                    ${deliveryPrice === 0 ? ' <span style="color: #16a34a; font-weight: 600;">Gratuite</span>' : ''}
                  </td>
                  <td style="padding: 6px 0; font-size: 14px; color: #1a1a1a; text-align: right;">
                    ${deliveryPrice === 0 ? '0,00 MAD' : formatPrice(deliveryPrice)}
                  </td>
                </tr>
                ${order.discountAmount && order.discountAmount > 0 ? `
                <tr>
                  <td style="padding: 6px 0; font-size: 14px; color: #16a34a;">
                    Réduction${order.discountCode ? ' (' + escapeHtml(order.discountCode) + ')' : ''}
                  </td>
                  <td style="padding: 6px 0; font-size: 14px; color: #16a34a; text-align: right;">
                    −${formatPrice(order.discountAmount)}
                  </td>
                </tr>
                ` : ''}
                ${order.freeItemApplied && order.freeItemDiscount > 0 ? `
                <tr>
                  <td style="padding: 6px 0; font-size: 14px; color: #16a34a;">
                    🎁 Article gratuit (fidélité)
                  </td>
                  <td style="padding: 6px 0; font-size: 14px; color: #16a34a; text-align: right;">
                    −${formatPrice(order.freeItemDiscount)}
                  </td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 12px 0 0; border-top: 2px solid #c9a24d; font-family: 'Georgia', 'Times New Roman', serif; font-size: 18px; font-weight: 700; color: #1a1a1a;">Total</td>
                  <td style="padding: 12px 0 0; border-top: 2px solid #c9a24d; font-family: 'Georgia', 'Times New Roman', serif; font-size: 18px; font-weight: 700; color: #1a1a1a; text-align: right;">
                    ${formatPrice(totalPrice)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── View order button ── -->
          <tr>
            <td style="padding: 8px 32px 32px; text-align: center;">
              <a href="${escapeHtml(frontendUrl)}/orders" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #1a1a2e, #2a2418); color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 13px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase;">
                Voir ma commande
              </a>
            </td>
          </tr>

          <!-- ── Footer ── -->
          <tr>
            <td style="background: #faf8f5; padding: 32px; text-align: center;">
              <p style="margin: 0 0 12px; font-family: 'Georgia', 'Times New Roman', serif; font-size: 16px; color: #c9a24d; letter-spacing: 3px; text-transform: uppercase;">
                Prfumerie
              </p>
              <p style="margin: 0; font-size: 12px; line-height: 1.8; color: #8a8580;">
                Des questions ? Répondez à cet email ou contactez-nous.<br/>
                Merci de votre confiance. ✦
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

// ---------------------------------------------------------------------------
// Nodemailer transporter
// ---------------------------------------------------------------------------

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  const requiredVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'];
  const missing = requiredVars.filter((v) => !process.env[v]);
  if (missing.length > 0) {
    const msg = `Email service: missing environment variables: ${missing.join(', ')}`;
    console.warn(`[EMAIL] ${msg}`);
    return null; // caller will handle
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    // Timeout — stay well within the 9-second Express request timeout
    // to avoid 504 Gateway Timeout errors on Vercel.
    connectionTimeout: 6000,
    greetingTimeout: 5000,
    socketTimeout: 7000,
  });

  return transporter;
};

/**
 * Send an order confirmation email.
 *
 * @param {Object} order - Full Mongoose order document (plain object or document).
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
const sendOrderConfirmationEmail = async (order) => {
  if (!order || !order.email) {
    return { success: false, error: 'No recipient email address' };
  }

  const transporterInstance = getTransporter();
  if (!transporterInstance) {
    return { success: false, error: 'SMTP transporter not configured' };
  }

  const fromAddress = process.env.SMTP_FROM || '"Prfumerie" <mounadifibrahim1@gmail.com>';

  const mailOptions = {
    from: fromAddress,
    to: order.email,
    subject: `Prfumerie — Confirmation de votre commande #${String(order._id).slice(-8).toUpperCase()}`,
    html: buildOrderConfirmationHtml(order),
  };

  try {
    const info = await transporterInstance.sendMail(mailOptions);
    console.log(`[EMAIL] Order confirmation sent to ${order.email} — messageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    // Never log SMTP_PASS — only log safe details
    console.error(`[EMAIL] Failed to send confirmation to ${order.email}: ${error.message}`);
    return { success: false, error: error.message };
  }
};

module.exports = { sendOrderConfirmationEmail };
