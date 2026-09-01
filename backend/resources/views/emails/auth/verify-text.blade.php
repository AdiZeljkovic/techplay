{{--
    The plain-text half of the message.

    A mail carrying only HTML looks like a mailing to a filter — ours scored
    MIME_HTML_ONLY for exactly that. Sending both parts as multipart/alternative
    is what a normal sender does, and it is also the version that reaches
    someone reading in a terminal, on a watch, or with images off.

    Not a transcription of the HTML: the same message, said plainly.
--}}
@if ($username){{ $username }}, one more step.@else One more step.@endif

Confirm this address and your TechPlay account is live — library, XP, ranks and everything on the profile.

Open this link:
{{ $url }}

The link works once and expires in {{ $expiresInMinutes }} minutes. If it has, sign in and ask for a fresh one.

If you did not create a TechPlay account, ignore this mail. Nothing was set up and the address will not be used again.

--
TechPlay · {{ $appUrl }}
