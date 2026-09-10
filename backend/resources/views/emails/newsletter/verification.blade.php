{{--
    Confirming a newsletter signup, in the design the rest of the mail uses.

    This file was the last of the three unrelated email designs still in
    circulation — a white card on #f4f4f4 with a Bootstrap-blue button, no
    plain-text half, no dark-mode declaration, and an <h2> in #333. The shared
    layout replaced the other two and this one was missed, so somebody who
    signed up got a white email from a site that is crimson on near-black.

    Wording comes from the newsletter-verification template when there is one;
    the link never does.
--}}
@include('emails.auth.layout', [
    'title' => $heading ?? 'Confirm your subscription',
    'appUrl' => $appUrl,
    'footerNote' => 'You are getting this because this address was typed into the newsletter form at <a href="'.$appUrl.'" style="color:#8A8A94; text-decoration:underline;">techplay.gg</a>. If that was not you, ignore this and nothing happens — the address is only added once it is confirmed.',
    'slot' => $__env->make('emails.newsletter.verification-body', get_defined_vars())->render(),
])
