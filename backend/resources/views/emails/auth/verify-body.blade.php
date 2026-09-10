{{-- The first thing a new member ever sees from TechPlay. --}}

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">

    <tr>
        <td style="font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:11px; font-weight:700; letter-spacing:0.16em; text-transform:uppercase; color:#DC143C; padding:0 0 14px 0;">
            One step left
        </td>
    </tr>

    <tr>
        <td class="h1" style="font-family:'Instrument Sans',-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:30px; line-height:36px; font-weight:700; color:#FFFFFF; padding:0 0 18px 0;">
            {{ $heading ?? 'Confirm your email' }}
        </td>
    </tr>

    <tr>
        <td style="font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:15px; line-height:25px; color:#B0B0BA; padding:0 0 8px 0;">
            {{-- The greeting stays here rather than moving into the editable
                 copy: a member with no username would otherwise be greeted as
                 "Welcome, ." and no amount of careful writing in the admin can
                 prevent that. --}}
            @if($username)
                Welcome, <span style="color:#FFFFFF; font-weight:600;">{{ $username }}</span>.
            @else
                Welcome.
            @endif
        </td>
    </tr>

    {{-- The editable part. A blank line starts a new paragraph, which is how
         anybody writing in a plain box expects it to behave, and the last one
         carries the gap down to the button. --}}
    @php($paragraphs = array_filter(array_map('trim', preg_split('/\R{2,}/', trim((string) ($bodyCopy ?? ''))) ?: [])))
    @foreach($paragraphs as $paragraph)
        <tr>
            <td style="font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:15px; line-height:25px; color:#B0B0BA; padding:0 0 {{ $loop->last ? '32px' : '8px' }} 0;">
                {!! nl2br(e($paragraph)) !!}
            </td>
        </tr>
    @endforeach

    <tr>
        <td align="center" style="padding:0 0 4px 0;">
            @include('emails.auth.button', ['url' => $url, 'label' => $ctaLabel ?? 'CONFIRM EMAIL'])
        </td>
    </tr>

    <tr>
        <td>
            @include('emails.auth.fallback', ['url' => $url])
        </td>
    </tr>

    {{-- Hairline as a filled row: Outlook drops border-top on a td often enough
         that it is not worth relying on. --}}
    <tr><td height="1" bgcolor="#26262C" style="background-color:#26262C; height:1px; mso-line-height-rule:exactly; line-height:1px; padding:0;"></td></tr>

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
