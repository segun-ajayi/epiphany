import { CHURCH, IMAGES } from "@/data/church";
import { escapeHtml } from "@/lib/email.server";

type NewsletterWelcomeData = {
  name?: string;
  email?: string;
};

export function newsletterWelcomeTemplate(data?: NewsletterWelcomeData) {
  const name = escapeHtml(data?.name?.trim());
  const email = escapeHtml(data?.email);

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Thank You for Subscribing!</title>
  <style type="text/css">
    body {
      margin: 0;
      padding: 0;
      min-width: 100%;
      background-color: #faf9f6;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }
    table {
      border-collapse: collapse;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    img {
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
    }
    @media only screen and (max-width: 600px) {
      .email-container {
        width: 100% !important;
        max-width: 100% !important;
        padding-left: 16px !important;
        padding-right: 16px !important;
      }
      .content-wrapper {
        padding: 24px !important;
      }
      .button-wrapper {
        width: 100% !important;
        text-align: center !important;
      }
      .responsive-btn {
        display: block !important;
        width: 100% !important;
        box-sizing: border-box !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; width: 100% !important; background-color: #faf9f6; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #faf9f6; padding: 48px 0;">
    <tr>
      <td align="center" valign="top">
        <table border="0" cellpadding="0" cellspacing="0" width="600" class="email-container" style="background-color: #ffffff; border-radius: 12px; border: 1px solid #e7e5e4; overflow: hidden; box-shadow: 0 4px 10px -1px rgba(68, 64, 60, 0.05);">
          <tr>
            <td height="5" style="background-color: #ca8a04; font-size: 5px; line-height: 5px;">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding: 36px 40px 16px 40px; text-align: center;" class="content-wrapper">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <table border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="line-height: 0; padding-bottom: 14px;">
                          <svg width="42" height="42" src="${IMAGES.logo}" />
                        </td>
                      </tr>
                      <tr>
                        <td align="center">
                          <span style="color: #881337; font-size: 18px; font-weight: 800; letter-spacing: 0.06em; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; text-transform: uppercase; display: block; line-height: 1.2;">
                            ${CHURCH.name}
                          </span>
                          <span style="color: #ca8a04; font-size: 11px; font-weight: 600; letter-spacing: 0.03em; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: block; margin-top: 4px;">
                            ${CHURCH.shortName}
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 12px 40px;" class="content-wrapper">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fdf2f8; border-radius: 12px; border: 1px dashed #fbcfe8;">
                <tr>
                  <td style="padding: 28px 24px; text-align: center;">
                    <div style="font-size: 38px; line-height: 1; margin-bottom: 12px; display: inline-block;">
                      ⛪✨✉️
                    </div>
                    <h2 style="margin: 0; font-size: 18px; font-weight: 700; color: #881337; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                      Subscription Confirmed!
                    </h2>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px 40px 40px;" class="content-wrapper">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="padding-bottom: 20px;">
                    <p style="margin: 0; font-size: 15px; color: #1c1917; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                      Hello ${name},
                    </p>
                    <h1 style="margin: 8px 0 0 0; font-size: 22px; font-weight: 800; color: #881337; line-height: 1.3; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                      Welcome to our Newsletter!
                    </h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 28px; font-size: 14px; color: #44403c; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                    We are absolutely delighted to have you join our mailing list. At the ${CHURCH.name}, we are dedicated to growing in faith, worship, and community in Houston, Texas. Each week, we share spiritual reflections, parish announcements, details about Sunday worship, midweek Bible studies, and upcoming fellowship opportunities.
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-bottom: 32px;">
                    <table border="0" cellpadding="0" cellspacing="0" class="button-wrapper">
                      <tr>
                        <td align="center" style="background-color: #881337; border-radius: 6px; box-shadow: 0 4px 6px -1px rgba(136, 19, 55, 0.15);">
                          <a href="${CHURCH.social.facebook}" target="_blank" class="responsive-btn" style="display: inline-block; padding: 14px 28px; font-size: 14px; color: #ffffff; font-weight: 700; text-decoration: none; border-radius: 6px; letter-spacing: 0.02em; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                            Connect on Our Facebook Page
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td>
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-top: 1px solid #e7e5e4; padding-top: 24px;">
                      <tr>
                        <td style="font-size: 12px; font-weight: 800; color: #881337; padding-bottom: 12px; text-transform: uppercase; letter-spacing: 0.05em; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                          Here is what to expect next:
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <table border="0" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                              <td width="24" style="vertical-align: top; padding-bottom: 12px; font-size: 16px; line-height: 1;">⛪</td>
                              <td style="vertical-align: top; padding-bottom: 12px; font-size: 13px; color: #57534e; line-height: 1.5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                                <strong style="color: #1c1917;">Sunday Liturgy updates:</strong> Weekly bulletins, scripture readings, Holy Communion schedules, and sermon details.
                              </td>
                            </tr>
                            <tr>
                              <td width="24" style="vertical-align: top; padding-bottom: 12px; font-size: 16px; line-height: 1;">📖</td>
                              <td style="vertical-align: top; padding-bottom: 12px; font-size: 13px; color: #57534e; line-height: 1.5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                                <strong style="color: #1c1917;">Community Fellowship:</strong> Midweek small group gatherings, Bible studies, and prayer circles.
                              </td>
                            </tr>
                            <tr>
                              <td width="24" style="vertical-align: top; font-size: 16px; line-height: 1;">🌟</td>
                              <td style="vertical-align: top; font-size: 13px; color: #57534e; line-height: 1.5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                                <strong style="color: #1c1917;">Parish Announcements:</strong> Feast day celebrations, youth and family activities, community service events, and prayer requests.
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color: #faf9f6; border-top: 1px solid #e7e5e4; padding: 24px 40px; text-align: center;" class="content-wrapper">
              <span style="font-size: 12px; color: #a22492; line-height: 1.4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                Need assistance or prayer? Please reach out to <a href="mailto:${CHURCH.email}" style="color: #a22492; text-decoration: none; font-weight: 600;">our parish office</a> or call <a href="tel:${CHURCH.phone}" style="color: #a22492; text-decoration: none; font-weight: 600;">${CHURCH.phone}</a>.
              </span>
            </td>
          </tr>
          <tr>
            <td style="background-color: #a22492; padding: 32px 40px; text-align: center;" class="content-wrapper">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="padding-bottom: 10px;">
                    <span style="font-size: 13px; font-weight: 800; color: #ffffff; text-transform: uppercase; letter-spacing: 0.05em; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: block;">
                      ${CHURCH.name}
                    </span>
                    <span style="font-size: 10px; color: #fef08a; font-weight: 600; display: block; margin-top: 2px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                      ${CHURCH.shortName}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 18px; font-size: 11px; color: #fecdd3; line-height: 1.5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                    ${CHURCH.address}<br />
                    Phone: ${CHURCH.phone} &bull; Email: <a href="mailto:${CHURCH.email}" style="color: #ffffff; text-decoration: underline;">${CHURCH.email}</a>
                  </td>
                </tr>
                <tr>
                  <td style="border-top: 1px solid #9f1239; padding-top: 16px; font-size: 10px; color: #fda4af; line-height: 1.4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                    You are receiving this automated message because you signed up to receive newsletter updates from Anglican Church of the Epiphany. If this was in error, or you wish to stop receiving updates, you can <a href="https://acehou.org/unsubscribe?email=${email}" style="color: #ffffff; text-decoration: underline;">unsubscribe instantly</a> at any time.
                    <br /><br />
                    &copy; 2026 Anglican Church of the Epiphany. All rights reserved.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
