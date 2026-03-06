@if($entries->isEmpty())
    <div style="padding: 2rem; text-align: center; border: 2px solid #000; border-radius: 0.625rem; background: #fff; box-shadow: 3px 3px 0 0 #000;">
        <div style="width: 3.5rem; height: 3.5rem; margin: 0 auto 1rem; border-radius: 9999px; background: #f1f5f9; border: 2px solid #000; display: flex; align-items: center; justify-content: center;">
            <svg style="width: 1.75rem; height: 1.75rem; color: #94a3b8;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
            </svg>
        </div>
        <h3 style="font-size: 1rem; font-weight: 900; color: #0f172a; margin: 0 0 0.5rem;">No Participants Yet</h3>
        <p style="font-size: 0.875rem; color: #6b7280; margin: 0;">There are no entries with points for this giveaway.</p>
    </div>
@else
    <div style="border: 2px solid #000; border-radius: 0.625rem; overflow: hidden; box-shadow: 3px 3px 0 0 #000;">
        <div style="overflow-x: auto;">
            <table style="width: 100%; font-size: 0.875rem; border-collapse: collapse;">
                <thead style="background: #f8fafc; border-bottom: 2px solid #000;">
                    <tr>
                        <th style="padding: 0.75rem 1rem; text-align: left; font-weight: 800; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: #374151;">#</th>
                        <th style="padding: 0.75rem 1rem; text-align: left; font-weight: 800; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: #374151;">Username</th>
                        <th style="padding: 0.75rem 1rem; text-align: left; font-weight: 800; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: #374151;">Email</th>
                        <th style="padding: 0.75rem 1rem; text-align: right; font-weight: 800; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: #374151;">Points</th>
                        <th style="padding: 0.75rem 1rem; text-align: right; font-weight: 800; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: #374151;">Win Chance</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($entries as $index => $entry)
                        <tr style="border-top: 1px solid #e5e7eb;">
                            <td style="padding: 0.75rem 1rem; color: #6b7280; font-weight: 600;">{{ $index + 1 }}</td>
                            <td style="padding: 0.75rem 1rem;">
                                <div style="display: flex; align-items: center; gap: 0.625rem;">
                                    <div style="width: 2rem; height: 2rem; border-radius: 9999px; border: 2px solid #000; background: linear-gradient(135deg, #7c3aed, #db2777); display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 800; font-size: 0.75rem; flex-shrink: 0;">
                                        {{ strtoupper(substr($entry->user->username ?? '?', 0, 2)) }}
                                    </div>
                                    <span style="font-weight: 700; color: #0f172a;">
                                        {{ $entry->user->username ?? 'Unknown User' }}
                                    </span>
                                </div>
                            </td>
                            <td style="padding: 0.75rem 1rem; color: #6b7280; font-family: monospace; font-size: 0.8125rem;">
                                {{ $entry->user->email ?? 'N/A' }}
                            </td>
                            <td style="padding: 0.75rem 1rem; text-align: right;">
                                <span style="display: inline-flex; align-items: center; padding: 0.2rem 0.625rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 800; background: #dbeafe; color: #1d4ed8; border: 1.5px solid #1d4ed8;">
                                    {{ number_format($entry->total_points) }}
                                </span>
                            </td>
                            <td style="padding: 0.75rem 1rem; text-align: right;">
                                @php
                                    $winChance = $totalPool > 0 ? ($entry->total_points / $totalPool) * 100 : 0;
                                    $barWidth = min($winChance, 100);
                                @endphp
                                <div style="display: flex; align-items: center; justify-content: flex-end; gap: 0.5rem;">
                                    <div style="width: 5rem; height: 6px; background: #e5e7eb; border-radius: 9999px; overflow: hidden; border: 1px solid #000;">
                                        <div style="height: 100%; width: {{ $barWidth }}%; background: #10b981; border-radius: 9999px;"></div>
                                    </div>
                                    <span style="font-weight: 700; color: #0f172a; min-width: 3.5rem; text-align: right;">
                                        {{ number_format($winChance, 2) }}%
                                    </span>
                                </div>
                            </td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>

        <div style="padding: 0.75rem 1rem; background: #f8fafc; border-top: 2px solid #000;">
            <p style="font-size: 0.75rem; color: #6b7280; text-align: center; margin: 0; font-weight: 600;">
                💡 Higher points = better chance to win. You can select winner manually or use auto-pick.
            </p>
        </div>
    </div>
@endif
