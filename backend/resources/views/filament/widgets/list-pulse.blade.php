@php
    $pulse = $this->getPulse();
    $lead = $pulse['lead'];
@endphp

{{--
    One strip, not a row of boxes.

    The dashboard console rule, applied above a list: size carries rank, so the
    lead figure is set large and everything else is support type on the same
    surface. Giving each number its own bordered card would say "these are four
    different things" about four readings of one thing.
--}}
<section class="tp-panel tp-pulse">
    <div class="tp-pulse__lead">
        <span class="tp-eyebrow">{{ $lead['label'] }}</span>
        <strong class="tp-huge tp-tone-{{ $lead['tone'] ?? 'idle' }}">
            {{ $lead['value'] }}@if (filled($lead['unit'] ?? null))<span class="tp-huge__unit">{{ $lead['unit'] }}</span>@endif
        </strong>
        @if (filled($pulse['note'] ?? null))
            <span class="tp-sub">{{ $pulse['note'] }}</span>
        @endif
    </div>

    @if (! empty($pulse['figures']))
        <div class="tp-pulse__figures">
            @foreach ($pulse['figures'] as $figure)
                <div class="tp-pulse__figure">
                    <span class="tp-eyebrow tp-eyebrow--tight">{{ $figure['label'] }}</span>
                    <span class="tp-pulse__n {{ isset($figure['tone']) ? 'tp-tone-'.$figure['tone'] : '' }}">{{ $figure['value'] }}</span>
                </div>
            @endforeach
        </div>
    @endif
</section>
