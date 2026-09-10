{{--
    The plain-text half.

    Not optional. A message carrying only HTML scores against itself in every
    filter that looks — ours returned MIME_HTML_ONLY for exactly that — and this
    is also the version a screen reader and a watch read.

    Links are left bare on purpose. Rewriting a readable address into forty
    characters of tracking token is something the reader can see, and the clicks
    worth counting are in the HTML half anyway.
--}}
{{ $subject }}
@if ($campaign->hero_headline)

{{ trim($campaign->hero_headline) }}
@endif
@if ($campaign->hero_intro)

{{ trim($campaign->hero_intro) }}
@endif
@if ($campaign->hero_cta_label && $campaign->hero_cta_url)

{{ trim($campaign->hero_cta_label) }}: {{ $campaign->hero_cta_url }}
@endif

{!! trim($bodyText) !!}

--
@if ($recipient->source === 'form')
You are getting this because you signed up for the TechPlay newsletter at {{ $appUrl }}.
@else
You are getting this because you have a TechPlay account at {{ $appUrl }}.
@endif

Unsubscribe: {{ $unsubscribeUrl }}
