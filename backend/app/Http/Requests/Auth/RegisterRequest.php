<?php

namespace App\Http\Requests\Auth;

use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;

class RegisterRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            /*
             * Three to thirty-two, and taken means taken however it is spelled.
             *
             * `unique:users,username` compares exactly, and PostgreSQL is
             * case-sensitive — but the column carries a unique index on
             * lower(username) since 31.08.2026. Signing up as XLBANANA47 while
             * XLBanana47 exists therefore passed validation and failed at the
             * insert: a 500 where the reader should have been told the name was
             * taken. The closure asks the same question the database will.
             *
             * The old bound was max:255 with no minimum, which allowed a
             * one-character name and one long enough to break every layout it
             * appeared in. Nobody registered is outside 3–32 today, so this
             * costs no existing member anything.
             */
            'username' => [
                'required', 'string', 'min:3', 'max:32', 'alpha_dash',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if (User::byUsername((string) $value)->exists()) {
                        $fail('That username is already taken.');
                    }
                },
            ],
            /*
             * The address has to be one that can actually receive mail.
             *
             * Three checks, in the order that costs least first.
             *
             * Nothing here blocks a country. A .ru address is not evidence of
             * anything, and the people who farm accounts use Gmail; a TLD ban
             * turns away readers and stops none of them.
             *
             * The strongest protection is not in this list at all: registration
             * hands back no token, and login refuses one, until the address is
             * confirmed. An address nobody can read is already an account that
             * can do nothing.
             */
            'email' => [
                'required', 'email:rfc', 'max:255', 'unique:users,email',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    $domain = mb_strtolower((string) Str::afterLast((string) $value, '@'));

                    if ($domain === '') {
                        return;
                    }

                    if (in_array($domain, config('registration.disposable_domains', []), true)) {
                        $fail('Please use an address you can receive mail at — that one is temporary.');

                        return;
                    }

                    // Measured at 1–12 ms for a real domain and about 1.8 s for
                    // a near-miss like `gmial.com`. The slow path is the typo,
                    // which is exactly the person worth stopping here: without
                    // this they wait for mail that was never deliverable.
                    if (config('registration.verify_mx') && ! $this->domainAcceptsMail($domain)) {
                        $fail("We could not find a mail server for {$domain}. Check the spelling.");
                    }
                },
            ],
            'password' => [
                'required',
                'string',
                'confirmed',
                Password::min(8)
                    ->mixedCase()
                    ->numbers()
                    ->symbols()
                    ->uncompromised(),
            ],
            'recaptcha_token' => ['nullable', 'string'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'password.min' => 'Password must be at least 8 characters.',
            'password.mixed' => 'Password must contain uppercase and lowercase letters.',
            'password.numbers' => 'Password must contain at least one number.',
            'password.symbols' => 'Password must contain at least one special character.',
        ];
    }

    /**
     * Can anything at this domain receive mail?
     *
     * An MX record is the usual answer, but a domain with only an A record is
     * still deliverable — the RFCs say to fall back to it, and a few small hosts
     * rely on that. Checking both keeps the rule from turning away real
     * addresses in order to catch fake ones.
     *
     * Cached for a day per domain, and the cache is what makes this affordable:
     * one lookup covers every later signup from gmail.com, and a resolver that
     * has gone slow is asked once rather than once per registration.
     *
     * A resolver failure is treated as a pass. If DNS is broken this is not the
     * place to find out, and refusing every registration because a lookup timed
     * out is a worse outcome than letting one bad address through.
     */
    private function domainAcceptsMail(string $domain): bool
    {
        return Cache::remember('mx:'.$domain, 86400, function () use ($domain) {
            try {
                return checkdnsrr($domain, 'MX') || checkdnsrr($domain, 'A');
            } catch (\Throwable) {
                return true;
            }
        });
    }
}
