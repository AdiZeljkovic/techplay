{{--
    The shell every TechPlay account email is built in.

    Written as tables with bgcolor attributes rather than as the page it would be
    on the web, because Outlook on Windows renders mail through Word: no flex, no
    grid, no reliable border-radius, and CSS backgrounds it ignores outright. The
    attributes are what it actually reads.

    Three designs were in circulation before this — a deep blue vendor theme with
    Be Vietnam Pro, a white newsletter with Bootstrap's blue, and the contact
    form. None of them was TechPlay, which is crimson on near-black.

    Colours are solid hex, never rgba: Outlook drops the whole declaration and
    the element renders transparent, which on a dark ground means white text on
    white.

    `color-scheme` tells Apple Mail and Outlook.com this is already dark so they
    leave it alone. Without it a dark email gets auto-inverted into a grey mess.
--}}
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta name="color-scheme" content="dark" />
    <meta name="supported-color-schemes" content="dark" />
    <title>{{ $title }}</title>
    <!--[if mso]>
    <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
    <![endif]-->
    <style>
        /* Loads in Apple Mail and a few others; everywhere else the stack below
           carries it. No layout depends on the face arriving. */
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@600;700&display=swap');

        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
        body { margin: 0 !important; padding: 0 !important; width: 100% !important; }

        a { color: #FF4D6A; }

        /* Clients that force their own dark treatment still land on ours. */
        :root { color-scheme: dark; supported-color-schemes: dark; }

        @media only screen and (max-width: 620px) {
            .shell { width: 100% !important; }
            .pad { padding-left: 24px !important; padding-right: 24px !important; }
            .h1 { font-size: 26px !important; line-height: 32px !important; }
            .btn a { display: block !important; }
        }
    </style>
</head>
<body bgcolor="#0A0A0C" style="margin:0; padding:0; background-color:#0A0A0C;">

{{--
    No preheader.

    The line that shows beside the subject in an inbox list is drawn hidden —
    zero-height, zero-opacity, padded with zero-width joiners to stop the client
    spilling body text after it. Our mail server's filter scored exactly that:
    ZERO_FONT 0.50 for five zero-size elements, MANY_INVISIBLE_PARTS 0.80 for
    nine invisible ones. Hidden text carrying keywords is how spam works, so
    every filter reads it that way whatever it actually says.

    Hiding it some other way scores the same. So it is gone, and the first
    visible line of the message does the job instead.
--}}

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0A0A0C" style="background-color:#0A0A0C;">
    <tr>
        <td align="center" style="padding:40px 12px;">

                {{-- The logo, with the wordmark as its fallback.

                     Gmail and Outlook block images by default, so an <img> alone
                     would open every account email with a broken rectangle. The
                     alt text is styled to read as the wordmark when that happens:
                     blocked, it still says TECHPLAY in the right weight; loaded,
                     the real mark replaces it.

                     Served at 320px and displayed at 160 so it stays sharp on a
                     retina screen. Height is set explicitly because Outlook will
                     otherwise reserve the full 135px of the source and leave a
                     gap under it. --}}
                <tr>
                    <td align="center" style="padding:0 0 28px 0;">
                        <a href="{{ $appUrl }}" style="text-decoration:none; border:0;">
                            <img src="{{ $appUrl }}/techplay-logo.png"
                                 width="160" height="27" alt="TECHPLAY"
                                 style="display:block; width:160px; height:27px; border:0; outline:none; text-decoration:none;
                                        font-family:'Instrument Sans',-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
                                        font-size:22px; font-weight:700; letter-spacing:0.14em; color:#FFFFFF;" />
                        </a>
                    </td>
                </tr>

                {{-- The card. --}}
                <tr>
                    <td bgcolor="#141418" style="background-color:#141418; border-radius:10px;">
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">

                            {{-- The crimson rule the site carries under its nav.
                                 A coloured row rather than a border, because
                                 Outlook drops border-top on a td often enough. --}}
                            <tr>
                                {{-- No non-breaking space and no font-size:0 inside it.

                                       The cell held an &nbsp; sized to nothing so it
                                       would not grow, which is a zero-font element as
                                       far as a filter is concerned — and ours counted
                                       it. An empty cell with an explicit height and
                                       mso-line-height-rule holds the same three pixels
                                       in Outlook without any text to size away. --}}
                                  <td bgcolor="#DC143C" height="3" style="background-color:#DC143C; height:3px; mso-line-height-rule:exactly; line-height:3px;"></td>
                            </tr>

                            <tr>
                                <td class="pad" style="padding:44px 48px 40px 48px;">
                                    {!! $slot !!}
                                </td>
                            </tr>

                        </table>
                    </td>
                </tr>

                {{-- Footer. --}}
                <tr>
                    <td class="pad" style="padding:28px 48px 0 48px;">
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                                <td style="font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:12px; line-height:20px; color:#6E6E78;">
                                    Sent by TechPlay because someone used this address on
                                    <a href="{{ $appUrl }}" style="color:#8A8A94; text-decoration:underline;">techplay.gg</a>.
                                    This address does not accept replies.
                                    <br /><br />
                                    &copy; {{ date('Y') }} TechPlay
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
