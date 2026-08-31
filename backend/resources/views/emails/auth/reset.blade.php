@include('emails.auth.layout', [
    'title' => 'Reset your password',
    'preheader' => 'A link to set a new password, good for ' . $expiresInMinutes . ' minutes.',
    'appUrl' => $appUrl,
    'slot' => $__env->make('emails.auth.reset-body', get_defined_vars())->render(),
])
