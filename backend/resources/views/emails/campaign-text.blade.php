{{--
    The plain-text half.

    Not optional. A message with no text alternative scores against itself in
    every filter that looks, and this sender has no reputation to spend on that.
    It is also the version a screen reader and a watch will read.

    No tracked links here on purpose: rewriting a bare URL in plain text turns a
    readable address into forty characters of token, and the reader can see it.
    The clicks that matter are in the HTML half anyway.
--}}
{{ $subject }}

{!! trim($bodyText) !!}

--
@if ($recipient->source === 'form')
You are getting this because you signed up for the TechPlay newsletter at {{ $appUrl }}.
@else
You are getting this because you have a TechPlay account at {{ $appUrl }}.
@endif

Unsubscribe: {{ $unsubscribeUrl }}
