$ErrorActionPreference = 'Stop'
$engineDir = Join-Path $PSScriptRoot '../src-tauri/engines'
New-Item -ItemType Directory -Force $engineDir | Out-Null
function Resolve-Engine([string]$Name) {
    $candidateFiles = @()
    $command = Get-Command $Name -ErrorAction SilentlyContinue
    if ($command) { $candidateFiles += Get-Item -LiteralPath $command.Source }
    $engineRoots = @("$env:ProgramData/chocolatey/lib/$Name", "$env:ProgramFiles/$Name", "$env:LOCALAPPDATA/$Name")
    foreach ($engineRoot in $engineRoots) {
        if (Test-Path -LiteralPath $engineRoot) {
            $candidateFiles += Get-ChildItem -LiteralPath $engineRoot -Filter "$Name.exe" -Recurse -File
        }
    }
    $engineFile = $candidateFiles | Sort-Object Length -Descending | Select-Object -First 1
    if (-not $engineFile -or $engineFile.Length -lt 1MB) { throw "No se encontró el ejecutable real de $Name (los shims no son portables)." }
    return $engineFile.FullName
}
$ffmpegPath = Resolve-Engine 'ffmpeg'
Copy-Item -LiteralPath $ffmpegPath -Destination (Join-Path $engineDir 'ffmpeg.bin')
$pandocPath = Resolve-Engine 'pandoc'
Copy-Item -LiteralPath $pandocPath -Destination (Join-Path $engineDir 'pandoc.bin')
Write-Host 'Motores preparados. Utilizá versiones estáticas para el portable.'
