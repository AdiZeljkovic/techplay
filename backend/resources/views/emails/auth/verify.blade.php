@include('emails.auth.layout', [
    'title' => 'Confirm your email',
    'preheader' => 'One tap and your TechPlay account is live.',
    'appUrl' => $appUrl,
    'slot' => $__env->make('emails.auth.verify-body', get_defined_vars())->render(),
])
