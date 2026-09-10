{{--
    The plain-text half this mail never had.

    A message carrying only HTML reads as a mailing to a filter — ours scored
    MIME_HTML_ONLY for exactly that on the account mail, and this one had the
    same problem and nobody had noticed because nothing was measuring it.
--}}
Confirm your TechPlay newsletter subscription

{!! trim((string) ($bodyCopyText ?? 'Thanks for signing up. Confirm this address and the newsletter starts arriving.')) !!}

Open this link:
{{ $verificationUrl }}

If you did not sign up, ignore this mail. The address is only added once it is confirmed, so doing nothing is enough.

--
TechPlay · {{ $appUrl }}
