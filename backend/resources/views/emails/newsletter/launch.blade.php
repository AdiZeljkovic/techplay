<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>The new TechPlay is here</title>
  <style>
    html, body { margin:0 !important; padding:0 !important; width:100% !important; background:#050506; }
    body { font-family: Arial, Helvetica, sans-serif; -webkit-font-smoothing:antialiased; }
    table { border-collapse:collapse !important; border-spacing:0 !important; }
    img { border:0; display:block; max-width:100%; }
    a { text-decoration:none; }
    .shell { width:100%; background:#050506; padding:34px 16px 48px; }
    .container { width:100%; max-width:680px; margin:0 auto; }
    .topbar { color:#8f8f98; font-size:12px; line-height:18px; }
    .logo { color:#ffffff; font-weight:900; letter-spacing:-1px; font-size:24px; }
    .logo-mark { display:inline-block; vertical-align:middle; width:26px; height:26px; line-height:26px; text-align:center; border-radius:7px; background:#DC143C; color:#fff; font-size:13px; margin-right:9px; letter-spacing:-.6px; }
    .panel { background:#0d0d10; border:1px solid #24242a; border-radius:22px; overflow:hidden; box-shadow:0 20px 80px rgba(0,0,0,.45); }
    .hero { background:#0c0c0f; }
    .eyebrow { display:inline-block; padding:7px 10px; border-radius:999px; border:1px solid #48202b; background:#1b0c11; color:#FF4D6A; font-weight:800; font-size:10px; letter-spacing:1.4px; }
    h1 { margin:16px 0 14px; color:#fff; font-size:42px; line-height:44px; letter-spacing:-1.9px; }
    .lead { margin:0; color:#b7b7c0; font-size:16px; line-height:25px; }
    .cta { display:inline-block; margin-top:24px; padding:14px 20px; border-radius:12px; background:#DC143C; color:#fff !important; font-weight:800; font-size:14px; box-shadow:0 10px 32px rgba(220,20,60,.22); }
    .subcta { display:inline-block; margin:24px 0 0 10px; color:#a9a9b2 !important; font-weight:700; font-size:13px; }
    .hero-art { background:radial-gradient(circle at 50% 50%, rgba(220,20,60,.22), rgba(220,20,60,0) 63%); }
    .buffy-frame { margin:20px 20px 20px 0; border:1px solid #322127; border-radius:18px; overflow:hidden; background:#15090d; }
    .buffy-note { color:#dadbe0; font-size:12px; line-height:18px; padding:10px 12px 12px; border-top:1px solid #2a2024; }
    .buffy-note b { color:#fff; }
    .section { padding:42px 34px; }
    .section-kicker { color:#FF4D6A; font-size:11px; letter-spacing:1.35px; font-weight:900; text-transform:uppercase; }
    .section-title { margin:9px 0 10px; color:#fff; font-size:26px; line-height:32px; letter-spacing:-.8px; }
    .section-copy { margin:0; color:#9f9fa8; font-size:14px; line-height:22px; }
    .feature { background:#121216; border:1px solid #27272d; border-radius:16px; padding:18px; height:100%; }
    .feature-icon { width:34px; height:34px; border-radius:10px; background:#1c0b10; border:1px solid #4c1724; color:#FF4D6A; text-align:center; line-height:34px; font-size:16px; font-weight:900; }
    .feature h3 { margin:14px 0 7px; color:#fff; font-size:16px; line-height:21px; }
    .feature p { margin:0; color:#92929c; font-size:13px; line-height:20px; }
    .metric { text-align:center; padding:22px 12px; }
    .metric strong { display:block; color:#fff; font-size:24px; line-height:28px; letter-spacing:-.6px; }
    .metric span { color:#7f7f89; font-size:11px; text-transform:uppercase; letter-spacing:1px; }
    .divider { height:1px; background:#24242a; }
    .briefing { background:#130a0d; border:1px solid #3a1721; border-radius:18px; padding:22px; }
    .briefing-title { color:#fff; font-size:18px; line-height:24px; font-weight:900; }
    .briefing-copy { margin:8px 0 0; color:#c1adb2; font-size:14px; line-height:22px; }
    .coming { color:#fff; font-size:13px; line-height:20px; }
    .coming span { color:#FF4D6A; font-weight:800; }
    .footer { color:#696971; font-size:11px; line-height:18px; text-align:center; padding:26px 24px 10px; }
    .footer a { color:#85858e; text-decoration:underline; }
    @media screen and (max-width: 620px) {
      .shell { padding:14px 8px 30px !important; }
      .mobile-block, .mobile-block td { display:block !important; width:100% !important; }
      .hero-copy { padding:30px 24px 14px !important; }
      .hero-art-cell { padding:0 24px 24px !important; }
      .buffy-frame { margin:0 !important; }
      h1 { font-size:34px !important; line-height:37px !important; }
      .section { padding:34px 22px !important; }
      .feature-cell { display:block !important; width:100% !important; padding:0 0 12px !important; }
      .metric-cell { width:33.333% !important; }
      .subcta { display:block !important; margin:13px 0 0 !important; }
    }
  </style>
</head>
<body>
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
  <table role="presentation" width="100%" class="shell">
    <tr><td align="center">
      <table role="presentation" width="100%" class="container">
        <tr>
          <td style="padding:0 6px 18px;">
            <table role="presentation" width="100%">
              <tr>
                <td align="left"><a href="https://techplay.gg" style="text-decoration:none;"><img src="https://techplay.gg/techplay-logo.png" width="150" height="25" alt="TECHPLAY" style="display:block; border:0; width:150px; height:auto;"></a></td>
                <td align="right" class="topbar">One Platform. Everything for Gamers.</td>
              </tr>
            </table>
          </td>
        </tr>

        <tr><td class="panel hero">
          <table role="presentation" width="100%" class="mobile-block">
            <tr>
              <td width="58%" valign="middle" class="hero-copy" style="padding:42px 20px 42px 36px;">
                <span class="eyebrow">THE NEW TECHPLAY IS LIVE</span>
                <h1>Your gaming life.<br>Now in one place.</h1>
                <p class="lead">We rebuilt TechPlay around you — your games, your progress, your achievements and your community.</p>
                <a href="https://techplay.gg" class="cta">Explore the new TechPlay →</a>
                <a href="https://techplay.gg" class="subcta">See what changed</a>
              </td>
              <td width="42%" valign="middle" class="hero-art hero-art-cell">
                <div class="buffy-frame">
                  <img src="https://techplay.gg/images/buffy-portrait.jpg" width="100%" alt="Professor Buffy, the TechPlay owl" style="display:block; width:100%; height:auto; border:0;">
                  <div class="buffy-note"><b>Professor Buffy:</b> “Your backlog definitely didn’t get smaller while you were away.”</div>
                </div>
              </td>
            </tr>
          </table>
        </td></tr>

        <tr><td style="height:18px"></td></tr>

        <tr><td class="panel">
          <div class="section">
            <div class="section-kicker">MORE THAN A GAMING PORTAL</div>
            <div class="section-title">TechPlay has evolved.</div>
            <p class="section-copy">News, reviews and guides are still here. But now they are only one part of a much bigger platform built to become your gaming home.</p>
          </div>
          <div class="divider"></div>
          <table role="presentation" width="100%">
            <tr>
              <td width="33.33%" class="metric metric-cell"><strong>332,833</strong><span>Games</span></td>
              <td width="33.33%" class="metric metric-cell" style="border-left:1px solid #24242a;border-right:1px solid #24242a;"><strong>20</strong><span>Ranks</span></td>
              <td width="33.33%" class="metric metric-cell"><strong>1</strong><span>Gaming identity</span></td>
            </tr>
          </table>
        </td></tr>

        <tr><td style="height:18px"></td></tr>

        <tr><td class="panel">
          <div class="section" style="padding-bottom:24px;">
            <div class="section-kicker">WHAT'S NEW</div>
            <div class="section-title">Everything you do now connects.</div>
            <p class="section-copy">Build your library, track progress, earn XP and turn every visit into part of your TechPlay profile.</p>
          </div>
          <table role="presentation" width="100%" style="padding:0 24px 26px;">
            <tr>
              <td width="50%" valign="top" class="feature-cell" style="padding:0 6px 12px 24px;">
                <div class="feature"><div class="feature-icon">▣</div><h3>Your Game Library</h3><p>Bring your games together, organize your collection and keep your gaming history in one place.</p></div>
              </td>
              <td width="50%" valign="top" class="feature-cell" style="padding:0 24px 12px 6px;">
                <div class="feature"><div class="feature-icon">XP</div><h3>XP, Levels & Ranks</h3><p>Your activity finally means something. Earn XP, level up and climb from Newcomer all the way to Eternal.</p></div>
              </td>
            </tr>
            <tr>
              <td width="50%" valign="top" class="feature-cell" style="padding:0 6px 12px 24px;">
                <div class="feature"><div class="feature-icon">★</div><h3>Achievements</h3><p>Unlock badges through games, community activity and hidden challenges across the platform.</p></div>
              </td>
              <td width="50%" valign="top" class="feature-cell" style="padding:0 24px 12px 6px;">
                <div class="feature"><div class="feature-icon">∞</div><h3>332,000+ Games</h3><p>Explore a huge game database, discover something new and add titles directly to your library.</p></div>
              </td>
            </tr>
            <tr>
              <td width="50%" valign="top" class="feature-cell" style="padding:0 6px 28px 24px;">
                <div class="feature"><div class="feature-icon">◫</div><h3>Release Calendar</h3><p>See what is launching next and keep track of the games you actually care about.</p></div>
              </td>
              <td width="50%" valign="top" class="feature-cell" style="padding:0 24px 28px 6px;">
                <div class="feature"><div class="feature-icon">→</div><h3>Backlog Advisor</h3><p>Too many games, no idea what to play? Let TechPlay help you choose your next one.</p></div>
              </td>
            </tr>
          </table>
        </td></tr>

        <tr><td style="height:18px"></td></tr>

        <tr><td class="panel">
          <div class="section">
            <div class="section-kicker">YOUR PROFILE = YOUR GAMING IDENTITY</div>
            <div class="section-title">More than an account.</div>
            <p class="section-copy">Your profile now brings together your games, achievements, XP, rank, reviews, activity and friends. The more you use TechPlay, the more your profile becomes yours.</p>
            <div style="height:20px"></div>
            <table role="presentation" width="100%"><tr>
              <td style="padding:11px 12px;background:#111116;border:1px solid #292930;border-radius:12px;color:#b8b8c0;font-size:12px;line-height:18px;">Library&nbsp;&nbsp;•&nbsp;&nbsp;Playing Now&nbsp;&nbsp;•&nbsp;&nbsp;Achievements&nbsp;&nbsp;•&nbsp;&nbsp;Reviews&nbsp;&nbsp;•&nbsp;&nbsp;Friends&nbsp;&nbsp;•&nbsp;&nbsp;Activity</td>
            </tr></table>
          </div>
        </td></tr>

        <tr><td style="height:18px"></td></tr>

        <tr><td class="panel">
          <div class="section">
            <div class="briefing">
              <table role="presentation" width="100%"><tr>
                <td width="42" valign="top"><div style="width:34px;height:34px;border-radius:10px;background:#DC143C;color:#fff;text-align:center;line-height:34px;font-weight:900;font-size:16px;">B</div></td>
                <td valign="top">
                  <div class="briefing-title">Buffy's briefing: we're just getting started.</div>
                  <p class="briefing-copy">The new platform is live, but this is not the finish line. More integrations, deeper community features and new ways to use your gaming data are already on the way.</p>
                </td>
              </tr></table>
            </div>
            <div style="height:24px"></div>
            <div class="coming"><span>Next up:</span> deeper platform integrations, expanded Library features, community systems and more surprises across TechPlay.</div>
            <a href="https://techplay.gg" class="cta">Return to TechPlay →</a>
          </div>
        </td></tr>

        <tr><td class="footer">
          You received this email because you created a TechPlay account.<br>
          <span style="color:#8a8a93;">TECHPLAY.GG</span> &nbsp;•&nbsp; One Platform. Everything for Gamers.<br><br>
          <a href="#">Manage preferences</a> &nbsp;•&nbsp; <a href="#">Unsubscribe</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>