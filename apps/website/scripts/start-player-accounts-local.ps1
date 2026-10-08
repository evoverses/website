param(
 [ValidateSet('Start','Stop')][string]$Mode='Start',
 [string]$AccountRepo='D:\documents\GitHub\evoverses-beta-account-bridge',
 [string]$RunRoot='D:\documents\GitHub\evoverses-beta-account-bridge\Saved\EpicAccountLocal-8bb710d070f047de90e266c231af0157',
 [string]$NodePath='C:\Users\DanManchester\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
)
$ErrorActionPreference='Stop'
$AccountRepo=[IO.Path]::GetFullPath($AccountRepo)
$RunRoot=[IO.Path]::GetFullPath($RunRoot)
if ((Split-Path $RunRoot -Parent) -ne (Join-Path $AccountRepo 'Saved') -or (Split-Path $RunRoot -Leaf) -notmatch '^EpicAccountLocal-[a-f0-9]{32}$') { throw 'Use the explicitly reviewed isolated Epic run directory.' }
$serviceScript=Join-Path $PSScriptRoot 'player-accounts-local.cjs'
$legacyServiceScript=Join-Path $AccountRepo 'Prototypes\player_economy\scripts\epic-local-service.cjs'
$ownerPath=Join-Path $RunRoot 'website-service-owner.json'
if ($Mode -eq 'Stop') {
 if (!(Test-Path $ownerPath)) { throw 'No website-owned service record exists.' }
 $owner=Get-Content $ownerPath -Raw | ConvertFrom-Json
 $ownedScript=if ($owner.serviceScript) {$owner.serviceScript} else {$legacyServiceScript}
 if ($ownedScript -ne $serviceScript -and $ownedScript -ne $legacyServiceScript) { throw 'Unrecognised service ownership record.' }
 $service=Get-CimInstance Win32_Process -Filter "ProcessId=$($owner.pid)"
 if ($service) {
  if ($service.Name -ne 'node.exe' -or !$service.CommandLine.Contains($ownedScript) -or !$service.CommandLine.Contains($RunRoot) -or $service.CreationDate.ToUniversalTime().ToString('o') -ne $owner.created) { throw 'Process ownership changed; nothing was stopped.' }
  Set-Content (Join-Path $RunRoot 'stop.txt') 'Stop owned website account test' -Encoding ASCII
  $deadline=[DateTime]::UtcNow.AddSeconds(15)
  while (!(Test-Path (Join-Path $RunRoot 'stopped.json')) -and [DateTime]::UtcNow -lt $deadline) { Start-Sleep -Milliseconds 100 }
  if (!(Test-Path (Join-Path $RunRoot 'stopped.json'))) { throw 'Service did not confirm database closure.' }
 }
 Write-Output 'Local player service stopped; no game/editor process touched.'
 return
}
foreach ($file in @('expected-context.json','reviewed-context.json','verified-context.json','Database')) { if (!(Test-Path (Join-Path $RunRoot $file))) { throw 'Use a previously verified and reviewed account run.' } }
$running=@(Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object {$_.CommandLine -and $_.CommandLine.Contains($RunRoot)})
if ($running.Count) { throw 'A service already uses this run directory. Do not open the database twice.' }
foreach ($file in @('ready.json','stop.txt','stopped.json')) { Remove-Item (Join-Path $RunRoot $file) -ErrorAction SilentlyContinue }
$service=Start-Process $NodePath -ArgumentList @("`"$serviceScript`"","`"$AccountRepo`"","`"$RunRoot`"") -PassThru -NoNewWindow -RedirectStandardOutput (Join-Path $RunRoot 'website-service.stdout.log') -RedirectStandardError (Join-Path $RunRoot 'website-service.stderr.log')
[void]$service.Handle
$process=Get-CimInstance Win32_Process -Filter "ProcessId=$($service.Id)"
@{pid=$service.Id;serviceScript=$serviceScript;created=$process.CreationDate.ToUniversalTime().ToString('o')} | ConvertTo-Json | Set-Content $ownerPath -Encoding ASCII
$deadline=[DateTime]::UtcNow.AddSeconds(60)
while (!(Test-Path (Join-Path $RunRoot 'ready.json')) -and !$service.HasExited -and [DateTime]::UtcNow -lt $deadline) { Start-Sleep -Milliseconds 100 }
if (!(Test-Path (Join-Path $RunRoot 'ready.json'))) { Set-Content (Join-Path $RunRoot 'stop.txt') 'Stop failed website test' -Encoding ASCII; throw 'Local account service did not start. Provider details omitted.' }
$ready=Get-Content (Join-Path $RunRoot 'ready.json') -Raw | ConvertFrom-Json
if ($ready.mode -ne 'Account' -or $ready.websiteClientId -notmatch '^[A-Za-z0-9]{16,128}$' -or $ready.apiUrl -notmatch '^http://127\.0\.0\.1:[1-9][0-9]{0,4}$') { throw 'Invalid local service readiness record.' }
Write-Output 'Local player service ready for website and game account tests.'
Write-Output 'It closes after eight hours and revokes local sessions; restart this script to test again.'
Write-Output 'Only the local account service was started; no game/editor, other animation thread or AWS resources touched.'
