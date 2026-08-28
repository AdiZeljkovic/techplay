<?php

/**
 * Ok, glad you are here
 * first we get a config instance, and set the settings
 * $config = HTMLPurifier_Config::createDefault();
 * $config->set('Core.Encoding', $this->config->get('purifier.encoding'));
 * $config->set('Cache.SerializerPath', $this->config->get('purifier.cachePath'));
 * if ( ! $this->config->get('purifier.finalize')) {
 *     $config->autoFinalize = false;
 * }
 * $config->loadArray($this->getConfig());
 *
 * You must NOT delete the default settings
 * anything in settings should be compacted with params that needed to instance HTMLPurifier_Config.
 *
 * @link http://htmlpurifier.org/live/configdoc/plain.html
 */

return [
    'encoding' => 'UTF-8',
    'finalize' => true,
    'ignoreNonStrings' => false,
    'cachePath' => storage_path('app/purifier'),
    'cacheFileMode' => 0755,
    'settings' => [
        'default' => [
            'HTML.Doctype' => 'HTML 4.01 Transitional',
            'HTML.Allowed' => 'div,b,strong,i,em,u,a[href|title],ul,ol,li,p[style],br,span[style],img[width|height|alt|src]',
            'CSS.AllowedProperties' => 'font,font-size,font-weight,font-style,font-family,text-decoration,padding-left,color,background-color,text-align',
            'AutoFormat.AutoParagraph' => true,
            'AutoFormat.RemoveEmpty' => true,
        ],
        // User-generated rich content (forum posts/threads). No iframes,
        // nofollow on links to deter spam.
        //
        // Images are allowed as of 2026-08-16, and only ours. A gaming forum
        // without screenshots is a gaming forum nobody posts a build or a
        // benchmark in — but an <img> pointing anywhere is a tracking pixel and
        // an IP log for everyone who opens the thread, so external sources are
        // refused outright. `URI.DisableExternalResources` measures "external"
        // against `URI.Host`, which is why the host is stated rather than left
        // to be guessed. Uploads go through ForumUploadController, which
        // re-encodes what it is given, so the URL that survives here always
        // points at a file we wrote ourselves.
        /*
         * Third-party catalogue text — game descriptions, and nothing else.
         *
         * Same as `forum` with one tag missing: `a`. HTMLPurifier drops the
         * tag and keeps what was inside it, so "the sequel to <a>V Tennis</a>"
         * becomes "the sequel to V Tennis" — the sentence survives, the link
         * does not.
         *
         * It matters because these descriptions come from MobyGames and carry
         * links back to MobyGames: 57,172 of them across 36,916 game pages,
         * measured 28 Aug 2026. They were nofollowed, so nothing leaked to
         * search — they simply sent readers to a rival catalogue from thirty-six
         * thousand of our own pages.
         *
         * Its own profile rather than a change to `forum`, because a forum post
         * is somebody deliberately linking somewhere and that has to keep
         * working.
         */
        'catalogue' => [
            'HTML.Allowed' => 'p,br,strong,b,em,i,u,s,ul,ol,li,blockquote,code,pre',
            'AutoFormat.RemoveEmpty' => true,
            'URI.DisableExternalResources' => true,
            'URI.AllowedSchemes' => ['http' => true, 'https' => true],
        ],

        'forum' => [
            'HTML.Allowed' => 'p,br,strong,b,em,i,u,s,a[href|title|rel],ul,ol,li,blockquote,code,pre,img[src|alt|width|height]',
            'AutoFormat.RemoveEmpty' => true,
            'HTML.Nofollow' => true,
            'URI.Base' => env('APP_URL', 'https://api-beta.techplay.gg'),
            'URI.Host' => parse_url((string) env('APP_URL', 'https://api-beta.techplay.gg'), PHP_URL_HOST),
            'URI.DisableExternalResources' => true,
            'URI.AllowedSchemes' => ['http' => true, 'https' => true],
        ],
        // Staff-authored content (articles, guides, reviews). Allows headings, images,
        // tables and whitelisted video embeds.
        'staff_content' => [
            'HTML.SafeIframe' => true,
            'URI.SafeIframeRegexp' => '%^(https?:)?//(www\.youtube(?:-nocookie)?\.com/embed/|player\.vimeo\.com/video/|player\.twitch\.tv/|open\.spotify\.com/embed/)%',
            'HTML.Allowed' => 'h2,h3,h4,h5,h6,p[style],br,hr,strong,b,em,i,u,s,a[href|title|target|rel],ul,ol,li,blockquote,code,pre,img[src|alt|title|width|height],table,thead,tbody,tr,th[colspan|rowspan],td[colspan|rowspan],figure,figcaption,iframe[src|width|height|frameborder|allowfullscreen],span[style],div[style]',
            'CSS.AllowedProperties' => 'font-weight,font-style,text-decoration,text-align,color,background-color,padding-left',
            'AutoFormat.RemoveEmpty' => false,
            'Attr.AllowedFrameTargets' => ['_blank'],
        ],
        'test' => [
            'Attr.EnableID' => 'true',
        ],
        'youtube' => [
            'HTML.SafeIframe' => 'true',
            'URI.SafeIframeRegexp' => '%^(http://|https://|//)(www.youtube.com/embed/|player.vimeo.com/video/)%',
        ],
        'custom_definition' => [
            'id' => 'html5-definitions',
            'rev' => 1,
            'debug' => false,
            'elements' => [
                // http://developers.whatwg.org/sections.html
                ['section', 'Block', 'Flow', 'Common'],
                ['nav',     'Block', 'Flow', 'Common'],
                ['article', 'Block', 'Flow', 'Common'],
                ['aside',   'Block', 'Flow', 'Common'],
                ['header',  'Block', 'Flow', 'Common'],
                ['footer',  'Block', 'Flow', 'Common'],

                // Content model actually excludes several tags, not modelled here
                ['address', 'Block', 'Flow', 'Common'],
                ['hgroup', 'Block', 'Required: h1 | h2 | h3 | h4 | h5 | h6', 'Common'],

                // http://developers.whatwg.org/grouping-content.html
                ['figure', 'Block', 'Optional: (figcaption, Flow) | (Flow, figcaption) | Flow', 'Common'],
                ['figcaption', 'Inline', 'Flow', 'Common'],

                // http://developers.whatwg.org/the-video-element.html#the-video-element
                ['video', 'Block', 'Optional: (source, Flow) | (Flow, source) | Flow', 'Common', [
                    'src' => 'URI',
                    'type' => 'Text',
                    'width' => 'Length',
                    'height' => 'Length',
                    'poster' => 'URI',
                    'preload' => 'Enum#auto,metadata,none',
                    'controls' => 'Bool',
                ]],
                ['source', 'Block', 'Flow', 'Common', [
                    'src' => 'URI',
                    'type' => 'Text',
                ]],

                // http://developers.whatwg.org/text-level-semantics.html
                ['s',    'Inline', 'Inline', 'Common'],
                ['var',  'Inline', 'Inline', 'Common'],
                ['sub',  'Inline', 'Inline', 'Common'],
                ['sup',  'Inline', 'Inline', 'Common'],
                ['mark', 'Inline', 'Inline', 'Common'],
                ['wbr',  'Inline', 'Empty', 'Core'],

                // http://developers.whatwg.org/edits.html
                ['ins', 'Block', 'Flow', 'Common', ['cite' => 'URI', 'datetime' => 'CDATA']],
                ['del', 'Block', 'Flow', 'Common', ['cite' => 'URI', 'datetime' => 'CDATA']],
            ],
            'attributes' => [
                ['iframe', 'allowfullscreen', 'Bool'],
                ['table', 'height', 'Text'],
                ['td', 'border', 'Text'],
                ['th', 'border', 'Text'],
                ['tr', 'width', 'Text'],
                ['tr', 'height', 'Text'],
                ['tr', 'border', 'Text'],
            ],
        ],
        'custom_attributes' => [
            ['a', 'target', 'Enum#_blank,_self,_target,_top'],
        ],
        'custom_elements' => [
            ['u', 'Inline', 'Inline', 'Common'],
        ],
    ],

];
