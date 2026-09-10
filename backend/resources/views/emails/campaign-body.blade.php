{{--
    The words somebody wrote, plus the pixel.

    The body arrives already rewritten: every outbound link points through the
    click counter, done in CampaignBody rather than asked of the person writing
    the mail. It is printed unescaped because it is HTML the editor composed in
    the admin — the same trust the site's article bodies get, and it goes
    through SanitizationService on the way in for the same reason.

    Typography is set here rather than left to the editor's markup, because a
    pasted paragraph carries whatever styling came with it and Outlook renders
    mail through Word: a <p> with no explicit font falls back to Times New
    Roman on a dark ground.
--}}
<div style="font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:16px; line-height:26px; color:#D4D4DC;">
    <style>
        .cbody p { margin: 0 0 16px 0; }
        .cbody h1, .cbody h2, .cbody h3 {
            font-family: 'Instrument Sans', -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #FFFFFF; font-weight: 700; margin: 0 0 12px 0; line-height: 1.25;
        }
        .cbody h1 { font-size: 26px; }
        .cbody h2 { font-size: 21px; }
        .cbody h3 { font-size: 17px; }
        .cbody a { color: #FF4D6A; }
        .cbody ul, .cbody ol { margin: 0 0 16px 0; padding-left: 22px; }
        .cbody li { margin: 0 0 8px 0; }
        .cbody img { max-width: 100%; height: auto; }
        .cbody hr { border: 0; border-top: 1px solid #26262E; margin: 24px 0; }
        .cbody blockquote {
            margin: 0 0 16px 0; padding: 8px 0 8px 16px;
            border-left: 3px solid #DC143C; color: #A8A8B4;
        }
    </style>

    <div class="cbody">
        {!! $bodyHtml !!}
    </div>
</div>

{{-- Last, and outside the styled block, so nothing can lay anything over it. --}}
<img src="{{ $pixelUrl }}" width="1" height="1" alt="" style="display:block; width:1px; height:1px; border:0;" />
