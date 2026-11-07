import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  // Allow CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { type, orderData } = req.body;

    if (!orderData) {
      return res.status(400).json({ error: 'orderData is required' });
    }

    const gmailUser = process.env.GMAIL_USER || process.env.VITE_GMAIL_USER || 'lyntrixtec@gmail.com';
    const gmailPass = process.env.GMAIL_APP_PASSWORD || process.env.VITE_GMAIL_APP_PASSWORD || 'kloq udzy vkyo spyk';

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailPass
      }
    });

    let subject = '';
    let htmlContent = '';
    let recipient = '';

    if (type === 'admin_alert') {
      recipient = 'lyntrixtec@gmail.com, ' + gmailUser;
      subject = `⚡ [NEW PROPOSAL DISPATCH] ${orderData.id} - ${orderData.name} (${orderData.service})`;
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <body style="margin: 0; padding: 0; background-color: #05070B; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #05070B; padding: 40px 15px;">
            <tr>
              <td align="center">
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background: #0A0E17; border: 1px solid rgba(0, 240, 255, 0.3); border-radius: 20px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.8);">
                  
                  <tr><td height="4" style="background: linear-gradient(90deg, #00F0FF, #3B82F6, #10B981);"></td></tr>

                  <tr>
                    <td style="padding: 30px 40px 10px 40px; text-align: center;">
                      <div style="display: inline-block; padding: 8px 16px; background: rgba(0, 240, 255, 0.08); border: 1px solid rgba(0, 240, 255, 0.3); border-radius: 10px; margin-bottom: 10px;">
                        <span style="font-family: monospace; font-size: 18px; font-weight: 800; color: #00F0FF;">⚡ LYNTRIX ADMIN DISPATCH</span>
                      </div>
                      <h2 style="color: #FFFFFF; font-size: 22px; margin: 10px 0 5px 0;">New Proposal Inquiry Logged</h2>
                      <p style="color: #64748B; font-size: 11px; font-family: monospace;">REAL-TIME LEAD TELEMETRY</p>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding: 20px 40px 30px 40px;">
                      <div style="background: #0E1524; border: 1px solid #1E293B; border-radius: 14px; padding: 25px;">
                        
                        <table width="100%" border="0" cellspacing="0" cellpadding="8" style="font-size: 13px; font-family: monospace;">
                          <tr>
                            <td style="color: #64748B; width: 35%;">Tracking ID:</td>
                            <td style="color: #00F0FF; font-weight: bold; font-size: 15px;">${orderData.id}</td>
                          </tr>
                          <tr>
                            <td style="color: #64748B;">Client Name:</td>
                            <td style="color: #FFFFFF; font-weight: bold;">${orderData.name}</td>
                          </tr>
                          <tr>
                            <td style="color: #64748B;">Corporate Email:</td>
                            <td style="color: #38BDF8;">${orderData.email}</td>
                          </tr>
                          <tr>
                            <td style="color: #64748B;">Phone / Hotline:</td>
                            <td style="color: #CBD5E1;">${orderData.phone || 'N/A'}</td>
                          </tr>
                          <tr>
                            <td style="color: #64748B;">Service Area:</td>
                            <td style="color: #FFFFFF; font-weight: bold;">${orderData.service}</td>
                          </tr>
                          <tr>
                            <td style="color: #64748B;">Architecture Scale:</td>
                            <td style="color: #A78BFA;">${orderData.scale || 'Enterprise'}</td>
                          </tr>
                          <tr>
                            <td style="color: #64748B;">Estimated Budget:</td>
                            <td style="color: #10B981; font-weight: bold; font-size: 15px;">${orderData.budget}</td>
                          </tr>
                        </table>

                        ${orderData.hasConsultation ? `
                          <div style="margin-top: 15px; padding: 15px; background: rgba(0, 240, 255, 0.08); border: 1px solid rgba(0, 240, 255, 0.3); border-radius: 12px;">
                            <div style="color: #00F0FF; font-size: 11px; font-weight: bold; font-family: monospace; text-transform: uppercase; margin-bottom: 8px;">
                              📅 REQUESTED 1-ON-1 ARCHITECTURE CONSULTATION
                            </div>
                            <table width="100%" border="0" cellspacing="0" cellpadding="4" style="font-size: 12px; font-family: monospace;">
                              <tr>
                                <td style="color: #94A3B8; width: 40%;">Scheduled Date:</td>
                                <td style="color: #FFFFFF; font-weight: bold;">${orderData.consultationDate}</td>
                              </tr>
                              <tr>
                                <td style="color: #94A3B8;">Time Slot:</td>
                                <td style="color: #10B981; font-weight: bold;">${orderData.consultationTime}</td>
                              </tr>
                              <tr>
                                <td style="color: #94A3B8;">Meeting Platform:</td>
                                <td style="color: #A78BFA; font-weight: bold;">${orderData.meetingPlatform}</td>
                              </tr>
                            </table>
                          </div>
                        ` : ''}

                        <div style="margin-top: 15px; padding: 15px; background: #07090E; border: 1px solid #1E293B; border-radius: 10px;">
                          <div style="color: #64748B; font-size: 10px; text-transform: uppercase; margin-bottom: 5px; font-family: monospace;">Client Requirements:</div>
                          <p style="color: #E2E8F0; font-size: 12px; line-height: 1.6; margin: 0; font-family: sans-serif;">${orderData.details}</p>
                        </div>

                      </div>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding: 20px 40px 30px 40px; border-top: 1px solid #1E293B; text-align: center; color: #475569; font-size: 11px; font-family: monospace;">
                      © ${new Date().getFullYear()} Lyntrix IT Services Sentinel.
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;
    } else if (type !== 'consultation_approved') {
      // Client order confirmation
      recipient = orderData.email;
      subject = orderData.hasConsultation 
        ? `📅 [Confirmed] Lyntrix Consultation & Proposal (${orderData.id}): ${orderData.consultationDate} at ${orderData.consultationTime}`
        : `✅ [Proposal Received & Accepted] Lyntrix IT Services: ${orderData.id} - ${orderData.service}`;
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <body style="margin: 0; padding: 0; background-color: #05070B; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #05070B; padding: 40px 15px;">
            <tr>
              <td align="center">
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background: #0A0E17; border: 1px solid rgba(0, 240, 255, 0.25); border-radius: 20px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.8);">
                  
                  <tr><td height="4" style="background: linear-gradient(90deg, #10B981, #00F0FF, #3B82F6);"></td></tr>

                  <tr>
                    <td style="padding: 35px 40px 15px 40px; text-align: center;">
                      <div style="display: inline-block; padding: 10px 18px; background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; margin-bottom: 12px;">
                        <span style="font-family: monospace; font-size: 18px; font-weight: 800; color: #10B981;">⚡ PROPOSAL ACCEPTED</span>
                      </div>
                      <h2 style="color: #FFFFFF; font-size: 22px; margin: 10px 0 5px 0;">Technical Proposal Received</h2>
                      <p style="color: #64748B; font-size: 11px; font-family: monospace;">LYNTRIX ENTERPRISE ADVISORY</p>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding: 10px 40px 30px 40px;">
                      <p style="color: #CBD5E1; font-size: 14px; line-height: 1.6;">
                        Dear <strong>${orderData.name}</strong>,<br><br>
                        Thank you for choosing <strong>Lyntrix IT Services</strong>. Your project proposal for <strong>${orderData.service}</strong> has been successfully accepted and assigned to our Senior Solutions Architecture Team.
                      </p>

                      <div style="background: #0E1524; border: 1px solid #1E293B; border-radius: 14px; padding: 20px; margin: 20px 0;">
                        <table width="100%" border="0" cellspacing="0" cellpadding="6" style="font-size: 13px; font-family: monospace;">
                          <tr>
                            <td style="color: #64748B; width: 40%;">Proposal Tracking ID:</td>
                            <td style="color: #00F0FF; font-weight: bold;">${orderData.id}</td>
                          </tr>
                          <tr>
                            <td style="color: #64748B;">Target Service:</td>
                            <td style="color: #FFFFFF; font-weight: bold;">${orderData.service}</td>
                          </tr>
                          <tr>
                            <td style="color: #64748B;">Estimated Budget:</td>
                            <td style="color: #10B981; font-weight: bold;">${orderData.budget}</td>
                          </tr>
                          <tr>
                            <td style="color: #64748B;">Status:</td>
                            <td style="color: #10B981; font-weight: bold;">Order Accepted & Discovery Scoped</td>
                          </tr>
                        </table>
                      </div>

                      ${orderData.hasConsultation ? `
                        <div style="background: linear-gradient(135deg, rgba(0, 240, 255, 0.12), rgba(59, 130, 246, 0.12)); border: 1px solid rgba(0, 240, 255, 0.4); border-radius: 16px; padding: 22px; margin: 20px 0;">
                          <div style="font-family: monospace; font-size: 12px; color: #00F0FF; text-transform: uppercase; font-weight: bold; margin-bottom: 12px;">
                            📅 CONFIRMED 1-ON-1 ARCHITECTURE CONSULTATION
                          </div>
                          <table width="100%" border="0" cellspacing="0" cellpadding="5" style="font-size: 13px; font-family: monospace;">
                            <tr>
                              <td style="color: #94A3B8; width: 40%;">Scheduled Date:</td>
                              <td style="color: #FFFFFF; font-weight: bold; font-size: 14px;">${orderData.consultationDate}</td>
                            </tr>
                            <tr>
                              <td style="color: #94A3B8;">Time Slot:</td>
                              <td style="color: #10B981; font-weight: bold; font-size: 14px;">${orderData.consultationTime}</td>
                            </tr>
                            <tr>
                              <td style="color: #94A3B8;">Meeting Platform:</td>
                              <td style="color: #A78BFA; font-weight: bold;">${orderData.meetingPlatform}</td>
                            </tr>
                          </table>
                          <div style="margin-top: 14px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.1); font-size: 12px; color: #CBD5E1; line-height: 1.5;">
                            ✨ Our Senior Solutions Architect will email you the official calendar invitation and ${orderData.meetingPlatform} meeting link prior to the session.
                          </div>
                        </div>
                      ` : ''}

                      <p style="color: #94A3B8; font-size: 13px; line-height: 1.6;">
                        Our Senior Architecture Lead will review your technical specifications and contact you within <strong>24 business hours</strong> to coordinate our discovery session.
                      </p>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding: 20px 40px 30px 40px; border-top: 1px solid #1E293B; text-align: center;">
                      <p style="margin: 0 0 5px 0; color: #475569; font-size: 11px; font-family: monospace;">
                        © ${new Date().getFullYear()} LYNTRIX IT SERVICES. All rights reserved.
                      </p>
                      <p style="margin: 0; color: #64748B; font-size: 11px;">
                        Enterprise Architecture • <a href="https://lyntrixtec.com" style="color: #00F0FF; text-decoration: none;">lyntrixtec.com</a>
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;
    } else if (type === 'consultation_approved') {
      recipient = orderData.email;
      const meetingLink = req.body.meetingLink || 'https://meet.google.com/lyntrix-arch-session';
      subject = `📅 [CONFIRMED] Lyntrix Architecture Consultation: ${orderData.consultationDate || 'Tomorrow'} at ${orderData.consultationTime || '10:00 AM'}`;
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <body style="margin: 0; padding: 0; background-color: #05070B; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #05070B; padding: 40px 15px;">
            <tr>
              <td align="center">
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background: #0A0E17; border: 1px solid rgba(0, 240, 255, 0.35); border-radius: 20px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.8);">
                  
                  <tr><td height="4" style="background: linear-gradient(90deg, #00F0FF, #10B981, #A78BFA);"></td></tr>

                  <tr>
                    <td style="padding: 35px 40px 15px 40px; text-align: center;">
                      <div style="display: inline-block; padding: 10px 18px; background: rgba(0, 240, 255, 0.1); border: 1px solid rgba(0, 240, 255, 0.4); border-radius: 12px; margin-bottom: 12px;">
                        <span style="font-family: monospace; font-size: 16px; font-weight: 800; color: #00F0FF;">📅 CONSULTATION APPROVED & CONFIRMED</span>
                      </div>
                      <h2 style="color: #FFFFFF; font-size: 22px; margin: 10px 0 5px 0;">1-on-1 Architecture Discovery Call</h2>
                      <p style="color: #64748B; font-size: 11px; font-family: monospace;">LYNTRIX EXECUTIVE ADVISORY</p>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding: 10px 40px 30px 40px;">
                      <p style="color: #CBD5E1; font-size: 14px; line-height: 1.6;">
                        Dear <strong>${orderData.name}</strong>,<br><br>
                        Great news! Your request for a <strong>Free 1-on-1 Architecture Consultation</strong> has been reviewed and officially approved by our Senior Solutions Lead.
                      </p>

                      <div style="background: linear-gradient(135deg, rgba(0, 240, 255, 0.12), rgba(16, 185, 129, 0.12)); border: 1px solid rgba(0, 240, 255, 0.4); border-radius: 16px; padding: 22px; margin: 20px 0;">
                        <table width="100%" border="0" cellspacing="0" cellpadding="6" style="font-size: 13px; font-family: monospace;">
                          <tr>
                            <td style="color: #94A3B8; width: 40%;">Confirmed Date:</td>
                            <td style="color: #FFFFFF; font-weight: bold; font-size: 15px;">${orderData.consultationDate || 'As Requested'}</td>
                          </tr>
                          <tr>
                            <td style="color: #94A3B8;">Confirmed Time Slot:</td>
                            <td style="color: #10B981; font-weight: bold; font-size: 15px;">${orderData.consultationTime || '10:00 AM IST'}</td>
                          </tr>
                          <tr>
                            <td style="color: #94A3B8;">Meeting Platform:</td>
                            <td style="color: #A78BFA; font-weight: bold;">${orderData.meetingPlatform || 'Google Meet'}</td>
                          </tr>
                          <tr>
                            <td style="color: #94A3B8;">Booking Reference:</td>
                            <td style="color: #00F0FF; font-weight: bold;">${orderData.id}</td>
                          </tr>
                        </table>
                      </div>

                      <div style="text-align: center; margin: 30px 0 20px 0;">
                        <a href="${meetingLink}" target="_blank" style="display: inline-block; padding: 14px 28px; background: linear-gradient(90deg, #00F0FF, #3B82F6); color: #05070B; font-family: monospace; font-size: 14px; font-weight: bold; text-decoration: none; border-radius: 12px; box-shadow: 0 10px 25px rgba(0, 240, 255, 0.3);">
                          🎥 JOIN VIDEO CALL LINK
                        </a>
                        <div style="margin-top: 8px; font-size: 11px; font-family: monospace; color: #64748B;">
                          Direct Link: <a href="${meetingLink}" style="color: #00F0FF;">${meetingLink}</a>
                        </div>
                      </div>

                      <p style="color: #94A3B8; font-size: 12px; line-height: 1.6;">
                        <strong>Need to reschedule?</strong> Contact our hotline or WhatsApp at <strong>+94 71 455 7857</strong> or email <strong>lyntrixtec@gmail.com</strong>.
                      </p>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding: 20px 40px 30px 40px; border-top: 1px solid #1E293B; text-align: center;">
                      <p style="margin: 0 0 5px 0; color: #475569; font-size: 11px; font-family: monospace;">
                        © ${new Date().getFullYear()} LYNTRIX IT SERVICES. All rights reserved.
                      </p>
                      <p style="margin: 0; color: #64748B; font-size: 11px;">
                        Enterprise Architecture • Hotline/WhatsApp: +94 71 455 7857 • lyntrixtec@gmail.com
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;
    }

    const info = await transporter.sendMail({
      from: `"Lyntrix Enterprise" <${gmailUser}>`,
      to: recipient,
      subject: subject,
      html: htmlContent
    });

    return res.status(200).json({
      success: true,
      messageId: info.messageId,
      recipient,
      timestamp: new Date().toLocaleTimeString()
    });
  } catch (err) {
    console.error('Nodemailer Email Error:', err);
    return res.status(500).json({
      error: 'Failed to send email via Nodemailer',
      details: err.message
    });
  }
}
