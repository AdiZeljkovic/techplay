{{--
    Password reset.

    Written to be reassuring rather than urgent. Most people who open this asked
    for it; the ones who did not are the reason the last paragraph exists, and it
    says the useful thing — that ignoring the mail is itself the safe action, and
    that nobody can be locked out by someone else requesting a reset.
--}}

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">

    <tr>
        <td style="font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:11px; font-weight:700; letter-spacing:0.16em; text-transform:uppercase; color:#DC143C; padding:0 0 14px 0;">
            Account access
        </td>
    </tr>

    <tr>
        <td class="h1" style="font-family:'Instrument Sans',-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:30px; line-height:36px; font-weight:700; color:#FFFFFF; padding:0 0 18px 0;">
            Set a new password
        </td>
    </tr>

    <tr>
        <td style="font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:15px; line-height:25px; color:#B0B0BA; padding:0 0 32px 0;">
            @if($username)
                <span style="color:#FFFFFF; font-weight:600;">{{ $username }}</span> —
            @endif
            somebody asked to reset the password on this account. If that was you,
            the button below takes you straight to a new one.
        </td>
    </tr>

    <tr>
        <td align="center" style="padding:0 0 4px 0;">
            @include('emails.auth.button', ['url' => $url, 'label' => 'SET NEW PASSWORD'])
        </td>
    </tr>

    <tr>
        <td>
            @include('emails.auth.fallback', ['url' => $url])
        </td>
    </tr>

    <tr><td height="1" bgcolor="#26262C" style="background-color:#26262C; height:1px; mso-line-height-rule:exactly; line-height:1px; padding:0;"></td></tr>

    <tr>
        <td style="font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:13px; line-height:21px; color:#77777F; padding:22px 0 0 0;">
            The link is good for {{ $expiresInMinutes }} minutes and can be used once.
            <br /><br />
            <span style="color:#B0B0BA;">If you did not ask for this, you do not have to do anything.</span>
            Your password has not changed and cannot change until somebody opens
            the link above. Nobody can lock you out by requesting a reset.
        </td>
    </tr>

</table>
