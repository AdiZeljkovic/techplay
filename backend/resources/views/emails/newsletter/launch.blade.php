<!doctype html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
  <title>The new TechPlay is here</title>

  {{--
    Outlook renders mail through Word, not a browser. It ignores padding on
    everything except <td>, ignores display:inline-block, border-radius,
    max-width, and width/height on a <div>. A version of this template built
    from styled divs came back looking broken: the icon chips stretched into
    full-width bars, the buttons collapsed to flat red text with no shape, the
    metric numbers ran into their labels because display:block on a <strong>
    was dropped, and the layout spilled past the viewport because max-width
    meant nothing to it.

    So every box here is a real <td>: padding, background and borders live on
    table cells, widths are HTML attributes as well as CSS, and nothing that
    has to hold a shape is a div. border-radius is the one thing left to
    degrade — Outlook squares the corners, which reads as deliberate rather
    than broken.
  --}}
  <!--[if mso]>
  <xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
  <![endif]-->

  <style>
    html, body { margin:0 !important; padding:0 !important; width:100% !important; background:#08080A; }
    body { -webkit-font-smoothing:antialiased; -ms-text-size-adjust:100%; -webkit-text-size-adjust:100%; }
    table { border-collapse:collapse; border-spacing:0; mso-table-lspace:0pt; mso-table-rspace:0pt; }
    img { border:0; outline:none; display:block; -ms-interpolation-mode:bicubic; }
    a { text-decoration:none; }

    /* Word hyphenates a narrow column on its own and breaks words with a
       hyphen — "integra-tions", "defi-nitely". Nothing else does this, and
       there is no way to see it outside Outlook. */
    body, table, td, div, p, a, span, strong { mso-hyphenate:none; hyphens:none; -webkit-hyphens:none; }

    /* Phones. Outlook desktop ignores media queries, but it is fixed-width
       there anyway, so nothing below has to reach it. */
    @media screen and (max-width:620px) {
      .shell          { padding:16px 10px 28px !important; }
      .stack          { display:block !important; width:100% !important; }
      .hero-copy      { padding:30px 24px 6px !important; }
      .hero-art       { padding:0 24px 26px !important; }
      /* Buffy at full width is a 330px square that swallows the screen and
         pushes everything the mail is about below the fold. Held to 240. */
      .hero-art-inner { width:240px !important; }
      .hero-img       { width:238px !important; height:238px !important; }
      .h1             { font-size:32px !important; line-height:36px !important; letter-spacing:-1.2px !important; }
      .pad            { padding-left:22px !important; padding-right:22px !important; }
      .card-cell      { display:block !important; width:100% !important; padding:0 0 12px 0 !important; }
      .metric-num     { font-size:21px !important; }
      .metric-cell    { padding-left:4px !important; padding-right:4px !important; }
      /* The masthead stacks rather than shrinking. Hiding the tagline on
         narrow screens is the obvious move and it is off the table: every
         way of doing it is a zero-size or hidden element, which is what our
         filter scored us on in the first place. */
      .mast-logo      { display:block !important; width:100% !important; }
      .mast-line      { display:block !important; width:100% !important; text-align:left !important; padding:9px 0 0 !important; }
    }
  </style>
</head>
<body style="margin:0; padding:0; background:#08080A;">

  {{--
    No preheader. The line an inbox shows beside the subject is normally drawn
    hidden — zero height, zero opacity, padded with zero-width joiners. Our own
    mail server scored exactly that: ZERO_FONT 0.50, MANY_INVISIBLE_PARTS 0.80.
    Hidden text carrying words is how spam works, so every filter reads it that
    way whatever ours actually said. The first visible line does the job.
  --}}

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
                    <a href="{{ $appUrl }}"><img src="{{ $appUrl }}/techplay-logo.png" width="148" height="25" alt="TechPlay" style="display:block; width:148px; height:25px; border:0;"></a>
                  </td>
                  <td align="right" valign="middle" class="mast-line" style="font-family:'Segoe UI',Helvetica,Arial,sans-serif; font-size:12px; line-height:18px; color:#7C7C86;">
                    One&nbsp;Platform. Everything&nbsp;for&nbsp;Gamers.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          {{-- Hero --}}
          <tr>
            <td style="background:#0D0D11; border:1px solid #22222A; border-radius:20px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="344" valign="middle" class="stack hero-copy" style="width:344px; padding:38px 16px 38px 32px;">

                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="background:#1C0B11; border:1px solid #4A2029; border-radius:999px; padding:7px 12px; font-family:'Segoe UI',Helvetica,Arial,sans-serif; font-size:10px; line-height:12px; font-weight:700; letter-spacing:1.3px; color:#FF4D6A;">
                          THE NEW TECHPLAY IS LIVE
                        </td>
                      </tr>
                    </table>

                    <div class="h1" style="padding:18px 0 0; font-family:'Segoe UI',Helvetica,Arial,sans-serif; font-size:38px; line-height:42px; letter-spacing:-1.6px; font-weight:700; color:#FFFFFF;">
                      Your gaming&nbsp;life.<br>Now in one&nbsp;place.
                    </div>

                    <div style="padding:14px 0 0; font-family:'Segoe UI',Helvetica,Arial,sans-serif; font-size:15px; line-height:24px; color:#A9A9B4;">
                      We rebuilt TechPlay around you &mdash; your games, your progress, your achievements and your community.
                    </div>

                    {{-- The button gets its own line. Side by side with the
                         secondary link it was 310px of content in a 296px
                         column, so Word wrapped the label onto two lines and
                         the link ended up floating beside a tall red slab. --}}
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:24px;">
                      <tr>
                        <td style="background:#DC143C; border-radius:10px; padding:14px 22px;">
                          <a href="{{ $appUrl }}" style="font-family:'Segoe UI',Helvetica,Arial,sans-serif; font-size:14px; line-height:18px; font-weight:700; color:#FFFFFF; text-decoration:none; white-space:nowrap;">Explore the new TechPlay&nbsp;&rarr;</a>
                        </td>
                      </tr>
                    </table>

                    <div style="padding:15px 0 0; font-family:'Segoe UI',Helvetica,Arial,sans-serif; font-size:13px; line-height:18px;">
                      <a href="{{ $appUrl }}/profile" style="font-weight:600; color:#9A9AA4; text-decoration:none;">See your new profile&nbsp;&rarr;</a>
                    </div>

                  </td>

                  <td width="256" valign="middle" align="center" class="stack hero-art" style="width:256px; padding:30px 32px 30px 0;">
                    <table role="presentation" width="224" cellpadding="0" cellspacing="0" border="0" class="hero-art-inner" style="width:224px; background:#16090D; border:1px solid #3A222A; border-radius:16px;">
                      <tr>
                        <td style="padding:0;">
                          <img src="{{ $appUrl }}/images/buffy-portrait.jpg" width="222" height="222" alt="Professor Buffy, the TechPlay owl" class="hero-img" style="display:block; width:222px; height:222px; border:0; border-radius:15px 15px 0 0;">
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:11px 13px 13px; border-top:1px solid #2C1F24; font-family:'Segoe UI',Helvetica,Arial,sans-serif; font-size:12px; line-height:18px; color:#C9C9D2;">
                          <strong style="color:#FFFFFF;">Professor Buffy:</strong> &ldquo;Your backlog definitely didn&rsquo;t get smaller while you were away.&rdquo;
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr><td height="16" style="height:16px; line-height:16px; mso-line-height-rule:exactly;">&nbsp;</td></tr>

          {{-- What TechPlay is now, and the three numbers --}}
          <tr>
            <td style="background:#0D0D11; border:1px solid #22222A; border-radius:20px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td class="pad" style="padding:36px 32px 30px;">
                    <div style="font-family:'Segoe UI',Helvetica,Arial,sans-serif; font-size:11px; line-height:14px; font-weight:700; letter-spacing:1.3px; color:#FF4D6A;">MORE THAN A GAMING PORTAL</div>
                    <div style="padding:10px 0 0; font-family:'Segoe UI',Helvetica,Arial,sans-serif; font-size:25px; line-height:31px; letter-spacing:-.7px; font-weight:700; color:#FFFFFF;">TechPlay has evolved.</div>
                    <div style="padding:10px 0 0; font-family:'Segoe UI',Helvetica,Arial,sans-serif; font-size:14px; line-height:22px; color:#95959F;">News, reviews and guides are still here. But now they are only one part of a much bigger platform built to become your gaming home.</div>
                  </td>
                </tr>
                <tr><td height="1" style="height:1px; line-height:1px; mso-line-height-rule:exactly; background:#22222A;">&nbsp;</td></tr>
                <tr>
                  <td style="padding:0;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td width="33%" align="center" class="metric-cell" style="padding:24px 10px;">
                          <div class="metric-num" style="font-family:'Segoe UI',Helvetica,Arial,sans-serif; font-size:25px; line-height:30px; font-weight:700; letter-spacing:-.5px; color:#FFFFFF;">332,833</div>
                          <div style="padding:5px 0 0; font-family:'Segoe UI',Helvetica,Arial,sans-serif; font-size:11px; line-height:14px; letter-spacing:.9px; color:#787882;">GAMES</div>
                        </td>
                        <td width="34%" align="center" class="metric-cell" style="padding:24px 10px; border-left:1px solid #22222A; border-right:1px solid #22222A;">
                          <div class="metric-num" style="font-family:'Segoe UI',Helvetica,Arial,sans-serif; font-size:25px; line-height:30px; font-weight:700; letter-spacing:-.5px; color:#FFFFFF;">20</div>
                          <div style="padding:5px 0 0; font-family:'Segoe UI',Helvetica,Arial,sans-serif; font-size:11px; line-height:14px; letter-spacing:.9px; color:#787882;">RANKS</div>
                        </td>
                        <td width="33%" align="center" class="metric-cell" style="padding:24px 10px;">
                          <div class="metric-num" style="font-family:'Segoe UI',Helvetica,Arial,sans-serif; font-size:25px; line-height:30px; font-weight:700; letter-spacing:-.5px; color:#FFFFFF;">1</div>
                          <div style="padding:5px 0 0; font-family:'Segoe UI',Helvetica,Arial,sans-serif; font-size:11px; line-height:14px; letter-spacing:.9px; color:#787882;">GAMING IDENTITY</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr><td height="16" style="height:16px; line-height:16px; mso-line-height-rule:exactly;">&nbsp;</td></tr>

          {{-- The six features.

               The glyph chips are gone. The old ones were 34px divs, which
               Word stretched to the full width of the card, and half of the
               characters in them (the geometric shapes especially) fall back
               to a missing-glyph box in Outlook anyway. A crimson word above
               each title carries the same structure, renders identically
               everywhere, and reads better on a phone. --}}
          <tr>
            <td style="background:#0D0D11; border:1px solid #22222A; border-radius:20px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td class="pad" style="padding:36px 32px 24px;">
                    <div style="font-family:'Segoe UI',Helvetica,Arial,sans-serif; font-size:11px; line-height:14px; font-weight:700; letter-spacing:1.3px; color:#FF4D6A;">WHAT'S NEW</div>
                    <div style="padding:10px 0 0; font-family:'Segoe UI',Helvetica,Arial,sans-serif; font-size:25px; line-height:31px; letter-spacing:-.7px; font-weight:700; color:#FFFFFF;">Everything you do now connects.</div>
                    <div style="padding:10px 0 0; font-family:'Segoe UI',Helvetica,Arial,sans-serif; font-size:14px; line-height:22px; color:#95959F;">Build your library, track progress, earn XP and turn every visit into part of your TechPlay profile.</div>
                  </td>
                </tr>
                <tr>
                  <td class="pad" style="padding:0 32px 32px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      @foreach ([
                          [['COLLECTION', 'Your Game Library', 'Steam, Xbox, PlayStation, GOG and Epic in one shelf &mdash; plus anything you add by hand.'],
                           ['PROGRESSION', 'XP, Levels &amp; Ranks', 'Your activity finally means something. Climb twenty ranks, from Newcomer to Eternal.']],
                          [['REWARDS', 'Achievements', 'Sixty-seven of them, across your shelf, the community, and a few nobody has found yet.'],
                           ['DATABASE', '332,000+ Games', 'Search a catalogue the size of the medium, and add straight from it to your shelf.']],
                          [['CALENDAR', 'Release Calendar', 'What is launching next, and a reminder for the ones you actually care about.'],
                           ['GUIDANCE', 'Backlog Advisor', 'Too many games and no idea which one? It reads your shelf and picks for you.']],
                      ] as $row)
                        <tr>
                          @foreach ($row as $i => $card)
                            <td width="50%" valign="top" class="card-cell" style="width:50%; padding:0 {{ $i === 0 ? '6px' : '0' }} 12px {{ $i === 0 ? '0' : '6px' }};">
                              <table role="presentation" width="100%" height="100%" cellpadding="0" cellspacing="0" border="0" style="height:100%; background:#131318; border:1px solid #26262E; border-radius:14px;">
                                <tr>
                                  <td valign="top" style="padding:18px 18px 20px;">
                                    <div style="font-family:'Segoe UI',Helvetica,Arial,sans-serif; font-size:10px; line-height:13px; font-weight:700; letter-spacing:1.2px; color:#FF4D6A;">{{ $card[0] }}</div>
                                    <div style="padding:9px 0 0; font-family:'Segoe UI',Helvetica,Arial,sans-serif; font-size:16px; line-height:21px; font-weight:700; letter-spacing:-.3px; color:#FFFFFF;">{!! $card[1] !!}</div>
                                    <div style="padding:7px 0 0; font-family:'Segoe UI',Helvetica,Arial,sans-serif; font-size:13px; line-height:20px; color:#8B8B95;">{!! $card[2] !!}</div>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          @endforeach
                        </tr>
                      @endforeach
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr><td height="16" style="height:16px; line-height:16px; mso-line-height-rule:exactly;">&nbsp;</td></tr>

          {{-- The profile --}}
          <tr>
            <td style="background:#0D0D11; border:1px solid #22222A; border-radius:20px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td class="pad" style="padding:36px 32px 30px;">
                    <div style="font-family:'Segoe UI',Helvetica,Arial,sans-serif; font-size:11px; line-height:14px; font-weight:700; letter-spacing:1.3px; color:#FF4D6A;">YOUR PROFILE IS YOUR GAMING IDENTITY</div>
                    <div style="padding:10px 0 0; font-family:'Segoe UI',Helvetica,Arial,sans-serif; font-size:25px; line-height:31px; letter-spacing:-.7px; font-weight:700; color:#FFFFFF;">More than an account.</div>
                    <div style="padding:10px 0 18px; font-family:'Segoe UI',Helvetica,Arial,sans-serif; font-size:14px; line-height:22px; color:#95959F;">Your profile brings together your games, achievements, XP, rank, reviews, activity and friends. The more you use TechPlay, the more it becomes yours.</div>

                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      @foreach ([['Library', 'Playing Now', 'Achievements'], ['Reviews', 'Friends', 'Activity']] as $row)
                        <tr>
                          @foreach ($row as $i => $chip)
                            <td width="33%" valign="top" style="width:33.33%; padding:0 {{ $i === 2 ? '0' : '4px' }} 8px {{ $i === 0 ? '0' : '4px' }};">
                              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#131318; border:1px solid #26262E; border-radius:9px;">
                                <tr><td align="center" style="padding:10px 6px; font-family:'Segoe UI',Helvetica,Arial,sans-serif; font-size:12px; line-height:16px; color:#B4B4BF;">{{ $chip }}</td></tr>
                              </table>
                            </td>
                          @endforeach
                        </tr>
                      @endforeach
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr><td height="16" style="height:16px; line-height:16px; mso-line-height-rule:exactly;">&nbsp;</td></tr>

          {{-- Buffy's briefing and the last call to action --}}
          <tr>
            <td style="background:#0D0D11; border:1px solid #22222A; border-radius:20px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td class="pad" style="padding:32px 32px 34px;">

                    {{-- "Next up" used to sit loose between the briefing box
                         and the button — an orphan sentence belonging to
                         neither. It is Buffy talking, so it goes inside the
                         box, under a hairline, as the footnote it is. --}}
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#140A0E; border:1px solid #38161F; border-radius:16px;">
                      <tr>
                        <td width="64" valign="top" style="width:64px; padding:22px 0 18px 22px;">
                          <table role="presentation" width="42" cellpadding="0" cellspacing="0" border="0" style="width:42px;">
                            <tr>
                              <td width="42" height="42" align="center" valign="middle" style="width:42px; height:42px; background:#DC143C; border-radius:12px; font-family:'Segoe UI',Helvetica,Arial,sans-serif; font-size:18px; line-height:42px; font-weight:700; color:#FFFFFF;">B</td>
                            </tr>
                          </table>
                        </td>
                        <td valign="top" style="padding:22px 22px 18px 0;">
                          <div style="font-family:'Segoe UI',Helvetica,Arial,sans-serif; font-size:17px; line-height:23px; font-weight:700; letter-spacing:-.3px; color:#FFFFFF;">Buffy&rsquo;s briefing: we&rsquo;re just getting started.</div>
                          <div style="padding:9px 0 0; font-family:'Segoe UI',Helvetica,Arial,sans-serif; font-size:14px; line-height:22px; color:#B9A8AD;">The platform is live, but this is not the finish line. More store integrations, deeper Library tools and a proper community layer are already on the way.</div>
                        </td>
                      </tr>
                      <tr>
                        <td colspan="2" height="1" style="height:1px; line-height:1px; mso-line-height-rule:exactly; background:#38161F;">&nbsp;</td>
                      </tr>
                      <tr>
                        <td colspan="2" style="padding:16px 22px 18px; font-family:'Segoe UI',Helvetica,Arial,sans-serif; font-size:13px; line-height:21px; color:#A99298;">
                          <span style="color:#FF4D6A; font-weight:700; letter-spacing:.4px;">NEXT UP</span>&nbsp;&nbsp;deeper platform integrations, expanded Library features, community systems and more surprises across TechPlay.
                        </td>
                      </tr>
                    </table>

                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:26px;">
                      <tr>
                        <td style="background:#DC143C; border-radius:10px; padding:14px 22px;">
                          <a href="{{ $appUrl }}/settings?section=connections" style="font-family:'Segoe UI',Helvetica,Arial,sans-serif; font-size:14px; line-height:18px; font-weight:700; color:#FFFFFF; text-decoration:none; white-space:nowrap;">Link your first store&nbsp;&rarr;</a>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>
            </td>
          </tr>

          {{-- Footer --}}
          <tr><td style="padding:28px 60px 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td height="1" style="height:1px; line-height:1px; mso-line-height-rule:exactly; background:#1D1D24;">&nbsp;</td></tr></table></td></tr>
          <tr>
            <td align="center" style="padding:22px 20px 4px; font-family:'Segoe UI',Helvetica,Arial,sans-serif; font-size:11px; line-height:19px; color:#63636D;">
              You are receiving this because you created a TechPlay account.<br>
              <span style="color:#84848E;">TECHPLAY.GG</span> &nbsp;&middot;&nbsp; One Platform. Everything for Gamers.<br><br>
              <a href="{{ $appUrl }}/settings?section=notifications" style="color:#84848E; text-decoration:underline;">Email preferences</a>
              &nbsp;&middot;&nbsp;
              <a href="{{ $unsubscribeUrl ?? $appUrl.'/settings?section=notifications' }}" style="color:#84848E; text-decoration:underline;">Unsubscribe</a>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>
