{{--
    The same link as plain text.

    Buttons get stripped by strict corporate filters and by some clients that
    rewrite anchors; when that happens the reader is left with a message that
    tells them to press something that is not there. The URL is wrapped in a
    bordered block so it reads as a thing to copy rather than as body text, and
    word-break keeps a signed URL from stretching the layout on a phone.
--}}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 0 0;">
    <tr>
        <td style="font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:13px; line-height:20px; color:#77777F; padding:0 0 10px 0;">
            Or paste this into your browser:
        </td>
    </tr>
    <tr>
        <td bgcolor="#0F0F13" style="background-color:#0F0F13; border-radius:6px; padding:14px 16px;">
            <a href="{{ $url }}" style="font-family:Consolas,Monaco,'Courier New',monospace; font-size:12px; line-height:19px; color:#FF4D6A; text-decoration:none; word-break:break-all;">{{ $url }}</a>
        </td>
    </tr>
</table>
