<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Early Adopter cutoff
    |--------------------------------------------------------------------------
    | Accounts created before this moment unlock "Early Adopter". Set it to the
    | public launch date; move it only if you intend to widen the badge.
    */
    'early_adopter_before' => env('ACHIEVEMENT_EARLY_ADOPTER_BEFORE', '2027-01-01 00:00:00'),
];
