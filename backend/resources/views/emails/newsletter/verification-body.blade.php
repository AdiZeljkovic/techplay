<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
        <td style="font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:11px; font-weight:700; letter-spacing:0.16em; text-transform:uppercase; color:#DC143C; padding:0 0 14px 0;">
            One step left
        </td>
    </tr>

    <tr>
        <td class="h1" style="font-family:'Instrument Sans',-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:30px; line-height:36px; font-weight:700; color:#FFFFFF; padding:0 0 18px 0;">
            {{ $heading ?? 'Confirm your subscription' }}
        </td>
    </tr>

    {{-- Blank lines make paragraphs, so the plain box in the admin behaves the
         way anybody writing in one expects. --}}
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
            @include('emails.auth.button', ['url' => $verificationUrl, 'label' => $ctaLabel ?? 'CONFIRM SUBSCRIPTION'])
        </td>
    </tr>

    <tr>
        <td>
            @include('emails.auth.fallback', ['url' => $verificationUrl])
        </td>
    </tr>
</table>
