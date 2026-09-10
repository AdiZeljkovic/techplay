{{--
    A campaign, in the same shell as the account mail.

    Not a second design. Three were in circulation before the shared layout
    existed and none of them was TechPlay; a newsletter with its own look would
    make four. The footer differs because the permission differs — a member is
    written to because they hold an account, somebody who used the form asked —
    and because bulk mail has to carry a way out where an account mail must not.
--}}
@include('emails.auth.layout', [
    'title' => $subject,
    'appUrl' => $appUrl,
    'footerNote' => $recipient->source === 'form'
        ? 'You are getting this because you signed up for the TechPlay newsletter at <a href="'.$appUrl.'" style="color:#8A8A94; text-decoration:underline;">techplay.gg</a>.'
        : 'You are getting this because you have a TechPlay account at <a href="'.$appUrl.'" style="color:#8A8A94; text-decoration:underline;">techplay.gg</a>.',
    'footerExtra' => '<a href="'.e($unsubscribeUrl).'" data-no-track style="color:#8A8A94; text-decoration:underline;">Unsubscribe from these emails</a>',
    'slot' => $__env->make('emails.campaign-body', get_defined_vars())->render(),
])
