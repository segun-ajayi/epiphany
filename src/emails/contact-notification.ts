import { CHURCH, IMAGES } from "@/data/church";

import { escapeHtml } from "@/lib/email.server";
type ContactTemplateData = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  subject?: string | null;
  message: string;
};

export function contactNotificationTemplate(data: ContactTemplateData) {
  const firstName = escapeHtml(data.firstName);
  const lastName = escapeHtml(data.lastName);
  const email = escapeHtml(data.email);
  const phone = escapeHtml(data.phone || "Not Provided");
  const subject = escapeHtml(data.subject || "No Subject");
  const message = escapeHtml(data.message).replace(/\n/g, "<br />");

  return `
    <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New Parish Inquiry - Anglican Church of the Epiphany, Houston</title>
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
      .responsive-grid {
        display: block !important;
        width: 100% !important;
      }
      .grid-gap-bottom {
        margin-bottom: 16px !important;
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
            <td style="background-color: #881337; padding: 28px 40px;" class="content-wrapper">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td width="48" style="vertical-align: middle;">
                    <table border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="line-height: 0; padding-right: 14px;">
                          <img src="${IMAGES.logo}" width="38" height="38" />
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td style="vertical-align: middle; text-align: left;">
                    <span style="color: #ffffff; font-size: 16px; font-weight: 700; letter-spacing: 0.05em; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: block; line-height: 1.2; text-transform: uppercase;">
                      ${CHURCH.name}
                    </span>
                    <span style="color: #fef08a; font-size: 11px; font-weight: 500; letter-spacing: 0.03em; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: block; margin-top: 2px;">
                      ${CHURCH.shortName}
                    </span>
                  </td>
                  <td align="right" style="vertical-align: middle;">
                    <span style="color: #ca8a04; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; background-color: #fef08a; padding: 5px 10px; border-radius: 4px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                      PARISH INQUIRY
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 40px 32px 40px;" class="content-wrapper">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="padding-bottom: 24px;">
                    <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #881337; line-height: 1.2; letter-spacing: -0.01em; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                      New Contact Submission
                    </h1>
                    <p style="margin: 6px 0 0 0; font-size: 14px; color: #57534e; line-height: 1.5;">
                      A web visitor has reached out to the Anglican Church of the Epiphany, Houston using the online contact form:
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="border-bottom: 1px solid #e7e5e4; padding-bottom: 12px;">&nbsp;</td>
                </tr>
                <tr>
                  <td height="24" style="font-size: 24px; line-height: 24px;">&nbsp;</td>
                </tr>
                <tr>
                  <td>
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td>
                          <table border="0" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                              <td width="280" valign="top" class="responsive-grid grid-gap-bottom">
                                <span style="display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #78716c; margin-bottom: 5px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                                  First Name
                                </span>
                                <div style="background-color: #faf9f6; border: 1px solid #e7e5e4; border-radius: 6px; padding: 12px 14px; font-size: 14px; color: #1c1917; font-weight: 500; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                                  ${firstName}
                                </div>
                              </td>
                              <td width="40" class="responsive-grid" style="font-size: 1px; line-height: 1px;">&nbsp;</td>
                              <td width="280" valign="top" class="responsive-grid">
                                <span style="display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #78716c; margin-bottom: 5px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                                  Last Name
                                </span>
                                <div style="background-color: #faf9f6; border: 1px solid #e7e5e4; border-radius: 6px; padding: 12px 14px; font-size: 14px; color: #1c1917; font-weight: 500; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                                  ${lastName}
                                </div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td height="18" style="font-size: 18px; line-height: 18px;">&nbsp;</td>
                      </tr>
                      <tr>
                        <td>
                          <table border="0" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                              <td width="280" valign="top" class="responsive-grid grid-gap-bottom">
                                <span style="display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #78716c; margin-bottom: 5px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                                  Email Address
                                </span>
                                <div style="background-color: #faf9f6; border: 1px solid #e7e5e4; border-radius: 6px; padding: 12px 14px; font-size: 14px; color: #881337; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                                  <a href="${email}" style="color: #881337; text-decoration: none;">${email}</a>
                                </div>
                              </td>
                              <td width="40" class="responsive-grid" style="font-size: 1px; line-height: 1px;">&nbsp;</td>
                              <td width="280" valign="top" class="responsive-grid">
                                <span style="display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #78716c; margin-bottom: 5px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                                  Phone Number
                                </span>
                                <div style="background-color: #faf9f6; border: 1px solid #e7e5e4; border-radius: 6px; padding: 12px 14px; font-size: 14px; color: #1c1917; font-weight: 500; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                                  ${phone}
                                </div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td height="18" style="font-size: 18px; line-height: 18px;">&nbsp;</td>
                      </tr>
                      <tr>
                        <td>
                          <span style="display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #78716c; margin-bottom: 5px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                            Subject Line
                          </span>
                          <div style="background-color: #faf9f6; border: 1px solid #e7e5e4; border-radius: 6px; padding: 12px 14px; font-size: 14px; color: #1c1917; font-weight: 600; line-height: 1.4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                            ${subject}
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td height="18" style="font-size: 18px; line-height: 18px;">&nbsp;</td>
                      </tr>
                      <tr>
                        <td>
                          <span style="display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #78716c; margin-bottom: 5px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                            Message Details
                          </span>
                          <div style="background-color: #ffffff; border: 1px solid #e7e5e4; border-radius: 8px; padding: 18px; font-size: 14px; color: #44403c; line-height: 1.6; min-height: 120px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                             ${message}
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td height="32" style="font-size: 32px; line-height: 32px;">&nbsp;</td>
                </tr>
                <tr>
                  <td align="center">
                    <table border="0" cellpadding="0" cellspacing="0" class="button-wrapper">
                      <tr>
                        <td align="center" style="background-color: #881337; border-radius: 6px;">
                          <a href="mailto:${email}?subject=RE: ${subject}" target="_blank" class="responsive-btn" style="display: inline-block; padding: 14px 28px; font-size: 14px; color: #ffffff; font-weight: 700; text-decoration: none; border-radius: 6px; letter-spacing: 0.02em; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                            Reply to Inquirer Directly
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color: #faf9f6; border-top: 1px solid #e7e5e4; padding: 32px 40px; text-align: center;" class="content-wrapper">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="padding-bottom: 10px;">
                    <span style="font-size: 12px; font-weight: 800; color: #881337; text-transform: uppercase; letter-spacing: 0.05em; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: block; line-height: 1.2;">
                      ${CHURCH.name}
                    </span>
                    <span style="display: block; font-size: 10px; color: #78716c; font-weight: 600; margin-top: 2px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                      ${CHURCH.shortName}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 18px; font-size: 12px; color: #57534e; line-height: 1.5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                    ${CHURCH.address}<br />
                    Phone: <a href="tel:${CHURCH.phone}" style="color: #57534e; text-decoration: none;">${CHURCH.phone}</a> &bull; Email: <a href="mailto:${CHURCH.email}" style="color: #881337; text-decoration: underline;">${CHURCH.email}</a>
                  </td>
                </tr>
                <tr>
                  <td style="border-top: 1px solid #e7e5e4; padding-top: 16px; font-size: 10px; color: #78716c; line-height: 1.4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                    This contact inquiry was automatically routed from your parish website contact form at https://acehou.org. Please handle pastoral requests and inquirer contact details with confidentiality.
                    <br /><br />
                    &copy; 2026 Anglican Church of the Epiphany, Houston TX. All rights reserved.
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
</html>
  `;
}
