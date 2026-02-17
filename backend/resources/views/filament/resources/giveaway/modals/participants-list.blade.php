@if($entries->isEmpty())
    <div class="p-8 text-center">
        <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
            </svg>
        </div>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">No Participants Yet</h3>
        <p class="text-sm text-gray-500 dark:text-gray-400">There are no entries with points for this giveaway.</p>
    </div>
@else
    <div class="overflow-x-auto">
        <table class="w-full text-sm">
            <thead class="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <tr>
                    <th class="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">#</th>
                    <th class="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Username</th>
                    <th class="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Email</th>
                    <th class="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-300">Points</th>
                    <th class="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-300">Win Chance</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                @foreach($entries as $index => $entry)
                    <tr class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td class="px-4 py-3 text-gray-500 dark:text-gray-400">{{ $index + 1 }}</td>
                        <td class="px-4 py-3">
                            <div class="flex items-center gap-2">
                                <div class="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-xs">
                                    {{ strtoupper(substr($entry->user->username ?? '?', 0, 2)) }}
                                </div>
                                <span class="font-medium text-gray-900 dark:text-white">
                                    {{ $entry->user->username ?? 'Unknown User' }}
                                </span>
                            </div>
                        </td>
                        <td class="px-4 py-3 text-gray-600 dark:text-gray-400">
                            <span class="font-mono text-xs">{{ $entry->user->email ?? 'N/A' }}</span>
                        </td>
                        <td class="px-4 py-3 text-right">
                            <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                                {{ number_format($entry->total_points) }}
                            </span>
                        </td>
                        <td class="px-4 py-3 text-right">
                            @php
                                $winChance = $totalPool > 0 ? ($entry->total_points / $totalPool) * 100 : 0;
                                $barWidth = min($winChance, 100);
                            @endphp
                            <div class="flex items-center justify-end gap-2">
                                <div class="flex-1 max-w-[80px] h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div class="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all" style="width: {{ $barWidth }}%"></div>
                                </div>
                                <span class="font-semibold text-gray-900 dark:text-white min-w-[50px] text-right">
                                    {{ number_format($winChance, 2) }}%
                                </span>
                            </div>
                        </td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    </div>

    <div class="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <p class="text-xs text-gray-600 dark:text-gray-400 text-center">
            💡 Higher points = better chance to win. You can select winner manually or use auto-pick.
        </p>
    </div>
@endif
