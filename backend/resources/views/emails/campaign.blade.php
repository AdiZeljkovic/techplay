{{--
    A campaign, in the shell the launch announcement used.

    That mail is the one design here that was built and tested against real
    clients, and its comments record what it cost: a version made of styled
    divs came back from Outlook with the chips stretched into bars, the buttons
    collapsed to flat red text and the layout spilling past the viewport,
    because Word renders mail and ignores padding on anything but a <td>. So
    every box below is a real table cell, widths are HTML attributes as well as
    CSS, and nothing that has to hold a shape is a div.

    What the launch mail hard-coded, this asks for: the eyebrow, the headline,
    the intro and the button are fields, and all of them are optional. Left
    empty the message is a masthead, the writing and the footer, which is the
    right shape for a short note and the wrong thing to force a hero onto.

    No preheader, and not by oversight. The hidden line an inbox shows beside
    the subject scored ZERO_FONT 0.50 and MANY_INVISIBLE_PARTS 0.80 against our
    own mail server, because hidden text carrying words is how spam works and no
    filter can tell our intent from anyone else's. The first visible line does
    that job.
--}}
<!doctype html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
  <title>{{ $subject }}</title>

  <!--[if mso]>
  <xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
  <![endif]-->

  <style>
    html, body { margin:0 !important; padding:0 !important; width:100% !important; background:#08080A; }
    body { -webkit-font-smoothing:antialiased; -ms-text-size-adjust:100%; -webkit-text-size-adjust:100%; }
    table { border-collapse:collapse; border-spacing:0; mso-table-lspace:0pt; mso-table-rspace:0pt; }
    img { border:0; outline:none; display:block; -ms-interpolation-mode:bicubic; }
    a { text-decoration:none; }

    /* Word hyphenates a narrow column on its own — "integra-tions". Nothing
       else does this and there is no way to see it outside Outlook. */
    body, table, td, div, p, a, span, strong { mso-hyphenate:none; hyphens:none; -webkit-hyphens:none; }

    /* The written body. Styled here rather than left to whatever markup the
       editor pasted, because a <p> with no font falls back to Times New Roman
       in Word — on a near-black ground. */
    .cbody p { margin:0 0 16px 0; font-family:'Segoe UI',Helvetica,Arial,sans-serif; font-size:15px; line-height:25px; color:#A9A9B4; }
    .cbody h1, .cbody h2, .cbody h3 { margin:26px 0 12px 0; font-family:'Segoe UI',Helvetica,Arial,sans-serif; font-weight:700; color:#FFFFFF; letter-spacing:-0.4px; }
    .cbody h1 { font-size:26px; line-height:32px; }
    .cbody h2 { font-size:21px; line-height:27px; }
    .cbody h3 { font-size:17px; line-height:23px; }
    .cbody a { color:#FF4D6A; text-decoration:underline; }
    .cbody strong { color:#FFFFFF; }
    .cbody ul, .cbody ol { margin:0 0 16px 0; padding-left:20px; font-family:'Segoe UI',Helvetica,Arial,sans-serif; font-size:15px; line-height:25px; color:#A9A9B4; }
    .cbody li { margin:0 0 8px 0; }
    .cbody blockquote { margin:0 0 16px 0; padding:2px 0 2px 16px; border-left:3px solid #DC143C; font-family:'Segoe UI',Helvetica,Arial,sans-serif; font-size:15px; line-height:25px; color:#8E8E99; }
    .cbody img { max-width:100%; height:auto; border-radius:10px; margin:6px 0 18px; }
    .cbody hr { border:0; border-top:1px solid #22222A; margin:26px 0; }

    @media screen and (max-width:620px) {
      .shell     { padding:16px 10px 28px !important; }
      .pad       { padding-left:22px !important; padding-right:22px !important; }
      .h1        { font-size:30px !important; line-height:34px !important; letter-spacing:-1.1px !important; }
      /* The masthead stacks rather than hiding its tagline: every way of
         hiding it is a zero-size element, which is what our filter scored. */
      .mast-logo { display:block !important; width:100% !important; }
      .mast-line { display:block !important; width:100% !important; text-align:left !important; padding:9px 0 0 !important; }
    }
  </style>
</head>
<body style="margin:0; padding:0; background:#08080A;">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#08080A;">
    <tr>
      <td align="center" class="shell" style="padding:32px 16px 44px;">

        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:600px;">

          {{-- Masthead --}}
          <tr>
            <td style="padding:0 4px 16px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="left" valign="middle" class="mast-logo">
                    <a href="{{ $appUrl }}" data-no-track><img src="{{ $appUrl }}/techplay-logo.png" width="148" height="25" alt="TechPlay" style="display:block; width:148px; height:25px; border:0;"></a>
                  </td>
                  <td align="right" valign="middle" class="mast-line" style="font-family:'Segoe UI',Helvetica,Arial,sans-serif; font-size:12px; line-height:18px; color:#7C7C86;">
                    One&nbsp;Platform. Everything&nbsp;for&nbsp;Gamers.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          {{-- Hero, only when there is something to put in it. --}}
          @if ($campaign->hero_headline || $campaign->hero_image)
            <tr>
              <td style="background:#0D0D11; border:1px solid #22222A; border-radius:20px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">

                  @if ($campaign->hero_image)
                    <tr>
                      <td style="padding:0;">
                        <img src="{{ $campaign->heroImageUrl() }}" width="598" alt="" style="display:block; width:100%; max-width:598px; height:auto; border-radius:20px 20px 0 0;">
                      </td>
                    </tr>
                  @endif

                  <tr>
                    <td class="pad" style="padding:34px 32px 34px;">

                      @if ($campaign->hero_eyebrow)
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td style="background:#1C0B11; border:1px solid #4A2029; border-radius:999px; padding:7px 12px; font-family:'Segoe UI',Helvetica,Arial,sans-serif; font-size:10px; line-height:12px; font-weight:700; letter-spacing:1.3px; color:#FF4D6A;">
                              {{ mb_strtoupper($campaign->hero_eyebrow) }}
                            </td>
                          </tr>
                        </table>
                      @endif

                      @if ($campaign->hero_headline)
                        <div class="h1" style="padding:{{ $campaign->hero_eyebrow ? '18px' : '0' }} 0 0; font-family:'Segoe UI',Helvetica,Arial,sans-serif; font-size:36px; line-height:41px; letter-spacing:-1.5px; font-weight:700; color:#FFFFFF;">
                          {{ $campaign->hero_headline }}
                        </div>
                      @endif

                      @if ($campaign->hero_intro)
                        <div style="padding:14px 0 0; font-family:'Segoe UI',Helvetica,Arial,sans-serif; font-size:15px; line-height:24px; color:#A9A9B4;">
                          {{ $campaign->hero_intro }}
                        </div>
                      @endif

                      {{-- A button needs both halves; one without the other is
                           either a label that does nothing or a link with no
                           words in it. --}}
                      @if ($campaign->hero_cta_label && $campaign->hero_cta_url)
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:24px;">
                          <tr>
                            <td style="background:#DC143C; border-radius:10px; padding:14px 22px;">
                              <a href="{{ $heroCtaUrl }}" style="font-family:'Segoe UI',Helvetica,Arial,sans-serif; font-size:14px; line-height:18px; font-weight:700; color:#FFFFFF; text-decoration:none; white-space:nowrap;">{{ $campaign->hero_cta_label }}&nbsp;&rarr;</a>
                            </td>
                          </tr>
                        </table>
                      @endif

                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          @endif

          {{-- The writing --}}
          <tr>
            <td class="pad" style="padding:{{ ($campaign->hero_headline || $campaign->hero_image) ? '28px' : '4px' }} 4px 0;">
              <div class="cbody">
                {!! $bodyHtml !!}
              </div>
            </td>
          </tr>

          {{-- Footer --}}
          <tr>
            <td class="pad" style="padding:26px 4px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="border-top:1px solid #1C1C24; padding:20px 0 0; font-family:'Segoe UI',Helvetica,Arial,sans-serif; font-size:12px; line-height:20px; color:#6E6E78;">
                    @if ($recipient->source === 'form')
                      You are getting this because you signed up for the TechPlay newsletter at
                      <a href="{{ $appUrl }}" data-no-track style="color:#8A8A94; text-decoration:underline;">techplay.gg</a>.
                    @else
                      You are getting this because you have a TechPlay account at
                      <a href="{{ $appUrl }}" data-no-track style="color:#8A8A94; text-decoration:underline;">techplay.gg</a>.
                    @endif
                    <br><br>
                    {{-- Never rewritten for tracking, and never given a
                         fallback. The way out has to work when everything else
                         has failed: somebody who cannot unsubscribe reports the
                         mail as spam instead, and that is the one thing a
                         sender with no reputation cannot afford. --}}
                    <a href="{{ $unsubscribeUrl }}" data-no-track style="color:#8A8A94; text-decoration:underline;">Unsubscribe from these emails</a>
                    <br><br>
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

  {{-- Last, and outside every styled block. --}}
  <img src="{{ $pixelUrl }}" width="1" height="1" alt="" style="display:block; width:1px; height:1px; border:0;">
</body>
</html>
