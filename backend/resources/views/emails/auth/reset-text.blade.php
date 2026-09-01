{{--
    The plain-text half. See verify-text for why it exists.
--}}
@if ($username){{ $username }}, let's get you back in.@else Let's get you back in.@endif

Somebody asked to reset the password on this TechPlay account. If that was you, set a new one here:

{{ $url }}

The link works once and expires in {{ $expiresInMinutes }} minutes.

If it was not you, nothing has changed and you can ignore this mail. Your password stays as it is until somebody opens that link.

--
TechPlay · {{ $appUrl }}
