<div x-data="{
    state: $wire.entangle('{{ $getStatePath() }}'),
    title: $wire.entangle('data.seo_title'),
    defaultTitle: $wire.entangle('data.title'),
    description: $wire.entangle('data.seo_description'),
    defaultDescription: $wire.entangle('data.excerpt'),
    url: 'https://techplay.gg/news/example-slug',

    get displayTitle() {
        return this.title || this.defaultTitle || 'Page Title';
    },
    get displayDescription() {
        return this.description || this.defaultDescription || 'Start writing to see how your page will look in search engine results. This snippet preview updates in real-time.';
    }
}" style="margin-top: 1rem; padding: 1rem; background: #fff; border: 2px solid #000; border-radius: 0.625rem; box-shadow: 3px 3px 0 0 #000;">

    <div style="margin-bottom: 0.5rem; font-size: 0.75rem; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">
        Google Search Preview
    </div>

    <div style="font-family: sans-serif;">
        <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: #202124;">
            <div style="background: #e5e7eb; border-radius: 9999px; width: 1rem; height: 1rem; overflow: hidden; flex-shrink: 0;">
                <img src="/favicon.ico" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.6;" alt=""
                    onerror="this.style.display='none'">
            </div>
            <div style="display: flex; flex-direction: column; line-height: 1.2;">
                <span style="font-size: 0.75rem; font-weight: 600;">TechPlay.gg</span>
                <span style="font-size: 0.75rem; color: #6b7280;" x-text="url"></span>
            </div>
        </div>

        <h3 style="font-size: 1.125rem; color: #1a0dab; font-weight: 500; cursor: pointer; margin: 0.25rem 0 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"
            x-text="displayTitle">
        </h3>

        <div style="font-size: 0.875rem; color: #4d5156; margin-top: 0.25rem; max-width: 42rem; word-break: break-word;"
            x-text="displayDescription">
        </div>
    </div>
</div>
