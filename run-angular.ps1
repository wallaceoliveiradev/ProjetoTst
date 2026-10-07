$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$nodeDir = Join-Path $scriptDir 'node-portable\node-v24.19.0-win-x64'

if (-not (Test-Path "$nodeDir\node.exe")) {
    Write-Error "Node não encontrado em $nodeDir. Verifique se a pasta existe."
    exit 1
}

$env:Path = "$nodeDir;$env:Path"

Write-Host "Usando Node local: $nodeDir"
& "$nodeDir\node.exe" -v
& "$nodeDir\npm.cmd" -v
& "$nodeDir\npx.cmd" --yes ng serve
