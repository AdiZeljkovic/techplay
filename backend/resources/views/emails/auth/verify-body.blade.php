{{-- The first thing a new member ever sees from TechPlay. --}}

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">

    <tr>
        <td style="font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:11px; font-weight:700; letter-spacing:0.16em; text-transform:uppercase; color:#DC143C; padding:0 0 14px 0;">
            One step left
        </td>
    </tr>

    <tr>
        <td class="h1" style="font-family:'Instrument Sans',-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:30px; line-height:36px; font-weight:700; color:#FFFFFF; padding:0 0 18px 0;">
            Confirm your email
        </td>
    </tr>

    <tr>
        <td style="font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:15px; line-height:25px; color:#B0B0BA; padding:0 0 8px 0;">
            @if($username)
                Welcome, <span style="color:#FFFFFF; font-weight:600;">{{ $username }}</span>.
            @else
                Welcome.
            @endif
            Confirm this address and your account is ready.
        </td>
    </tr>

    <tr>
        <td style="font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:15px; line-height:25px; color:#B0B0BA; padding:0 0 32px 0;">
            Until you do, you can look around but not post, rate or collect —
            we confirm addresses so that nobody can sign up as you.
        </td>
    </tr>

    <tr>
        <td align="center" style="padding:0 0 4px 0;">
            @include('emails.auth.button', ['url' => $url, 'label' => 'CONFIRM EMAIL'])
        </td>
    </tr>

    <tr>
        <td>
            @include('emails.auth.fallback', ['url' => $url])
        </td>
    </tr>

    {{-- Hairline as a filled row: Outlook drops border-top on a td often enough
         that it is not worth relying on. --}}
    <tr><td height="1" bgcolor="#26262C" style="background-color:#26262C; height:1px; line-height:1px; font-size:0; padding:0;">&nbsp;</td></tr>

    <tr>
        <td style="font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:13px; line-height:21px; color:#77777F; padding:22px 0 0 0;">
            This link stops working in {{ $expiresInMinutes }} minutes. If it has already
            expired, sign in and we will send another.
            <br /><br />
            If you did not create a TechPlay account, ignore this — nothing was
            set up, and without this confirmation the address is never used again.
        </td>
    </tr>

</table>
