<div style="background: #fff; border: 2px solid #000; border-radius: 0.625rem; box-shadow: 3px 3px 0 0 #000; padding: 1rem; max-width: 36rem;">
    <div style="display: flex; flex-direction: column; gap: 0.25rem;">
        {{-- Title --}}
        <div style="color: #1a0dab; font-size: 1.125rem; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; cursor: pointer;">
            {{ Str::limit($title ?? 'Page Title', 60) }}
        </div>

        {{-- URL --}}
        <div style="color: #006621; font-size: 0.875rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            {{ $url ?? 'https://techplay.gg/example' }}
        </div>

        {{-- Description --}}
        <div style="color: #4d5156; font-size: 0.875rem; line-height: 1.5;">
            {{ Str::limit($description ?? 'Meta description will appear here...', 160) }}
        </div>
    </div>

    {{-- Character counts --}}
    <div style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid #e5e7eb; display: flex; gap: 1rem; font-size: 0.75rem; font-weight: 600;">
        <span style="color: {{ strlen($title ?? '') > 60 ? '#f97316' : '#6b7280' }};">
            Title: {{ strlen($title ?? '') }}/60
        </span>
        <span style="color: {{ strlen($description ?? '') > 160 ? '#f97316' : '#6b7280' }};">
            Desc: {{ strlen($description ?? '') }}/160
        </span>
    </div>
</div>
