@component('mail::message')
# New Contact Form Message

**From:** {{ $senderName }} ({{ $senderEmail }})

**Subject:** {{ $subject }}

---

{{ $messageContent }}

---

@component('mail::button', ['url' => 'mailto:' . $senderEmail])
Reply to {{ $senderName }}
@endcomponent

Thanks,<br>
{{ config('app.name') }} Contact System

<small>This message was sent via the TechPlay.gg contact form.</small>
@endcomponent