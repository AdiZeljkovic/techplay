{{--
    A button Outlook can draw.

    Outlook on Windows ignores padding on an anchor, so a styled <a> collapses to
    underlined text with no shape at all. The VML rectangle below is what it
    draws instead; every other client skips the conditional comment and uses the
    anchor. The two are kept the same size and colour by hand — there is no way
    to share values between them.
--}}
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" class="btn" style="margin:0 auto;">
    <tr>
        <td align="center">
            <!--[if mso]>
            <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word"
                         href="{{ $url }}" style="height:52px;v-text-anchor:middle;width:280px;" arcsize="12%"
                         strokecolor="#DC143C" fillcolor="#DC143C">
                <w:anchorlock/>
                <center style="color:#FFFFFF;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;letter-spacing:0.06em;">
                    {{ $label }}
                </center>
            </v:roundrect>
            <![endif]-->
            <!--[if !mso]><!-- -->
            <a href="{{ $url }}"
               style="background-color:#DC143C; border-radius:6px; color:#FFFFFF; display:inline-block;
                      font-family:'Instrument Sans',-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
                      font-size:15px; font-weight:700; letter-spacing:0.06em; line-height:52px;
                      text-align:center; text-decoration:none; width:280px; -webkit-text-size-adjust:none;">
                {{ $label }}
            </a>
            <!--<![endif]-->
        </td>
    </tr>
</table>
