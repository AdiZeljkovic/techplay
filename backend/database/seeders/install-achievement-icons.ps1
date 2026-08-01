# Copies the reviewed achievement artwork into storage under stable names.
# Run from the repo root:  ./backend/database/seeders/install-achievement-icons.ps1
# Then:                    php artisan db:seed --class=AchievementIconSeeder

param(
    [string]$Source = "$env:USERPROFILE\Desktop\Achivments",
    [string]$Target = "$PSScriptRoot\..\..\storage\app\public\achievements"
)

$map = @{
    'Paket 1*' = @{ 1='game-hunter'; 2='in-the-zone'; 3='friendly'; 4='gamer-tag'; 5='multi-platform';
                    6='battlestation'; 7='verified-gamer'; 8='first-steps'; 9='active-voice'; 10='conversation-starter' }
    'Paket 2*' = @{ 1='rising-star'; 2='prolific-poster'; 3='forum-legend'; 4='discussion-leader'; 5='community-pillar';
                    6='recognized'; 7='level-5'; 8='level-10'; 9='level-25'; 10='level-50' }
    'Paket 3*' = @{ 1='socialite'; 2='beloved'; 3='early-adopter'; 4='techplay-patron'; 5='legacy-supporter';
                    6='collector'; 7='gear-collector'; 8='first-opinion'; 9='critic'; 10='voice-of-the-people' }
    'Paket 4*' = @{ 1='growing-library'; 2='librarian'; 3='game-hoarder'; 4='dedicated-collector'; 5='platform-pioneer';
                    6='cross-platform-gamer'; 7='shelf-starter'; 8='serious-shelf'; 9='the-vault'; 10='museum-curator' }
    'Paket 5*' = @{ 1='finisher'; 2='completionist'; 3='master-of-games'; 4='first-blood'; 5='ten-down';
                    6='backlog-slayer'; 7='backlog-conqueror'; 8='juggler'; 9='dreamer'; 10='window-shopper' }
    'Paket 6*' = @{ 1='dedicated'; 2='consistent'; 3='warming-up'; 4='one-week-strong'; 5='iron-habit';
                    6='unbreakable'; 7='plugged-in'; 8='discord-native'; 9='problem-solver'; 10='solution-machine' }
    'Paket 7*' = @{ 1='agenda-setter'; 2='essayist'; 3='popular'; 4='local-legend'; 5='hall-of-fame'; 6='elite-member' }
}

# NOTE: pack 1 indices 1 and 2 are swapped versus filename order on purpose —
# the compass (file 2) is Game Hunter, the crosshair (file 1) is In the Zone.
$map['Paket 1*'] = @{ 1='in-the-zone'; 2='game-hunter'; 3='friendly'; 4='gamer-tag'; 5='multi-platform';
                      6='battlestation'; 7='verified-gamer'; 8='first-steps'; 9='active-voice'; 10='conversation-starter' }

if (-not (Test-Path $Target)) { New-Item -ItemType Directory -Force -Path $Target | Out-Null }

$copied = 0
foreach ($pattern in $map.Keys) {
    $dir = Get-ChildItem -Path $Source -Directory | Where-Object { $_.Name -like $pattern } | Select-Object -First 1
    if (-not $dir) { Write-Warning "No folder matching '$pattern'"; continue }

    foreach ($index in $map[$pattern].Keys) {
        $file = Get-ChildItem -Path $dir.FullName -Filter "*($index).png" | Select-Object -First 1
        if (-not $file) { Write-Warning "$($dir.Name): no file with index ($index)"; continue }

        $name = $map[$pattern][$index]
        Copy-Item $file.FullName (Join-Path $Target "$name.png") -Force
        $copied++
    }
}

Write-Output "Copied $copied icons to $Target"
