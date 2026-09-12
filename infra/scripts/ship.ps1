param(
  [string]$VpsHost = "root@76.13.133.211",
  [string]$IdentityFile = "$env:USERPROFILE\.ssh\id_ed25519"
)

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$tempRoot = [System.IO.Path]::GetFullPath([System.IO.Path]::GetTempPath())
$deploymentToken = [Guid]::NewGuid().ToString("N")
$releaseId = "{0}-{1}" -f [DateTime]::UtcNow.ToString("yyyyMMddTHHmmssfffZ"), $deploymentToken.Substring(0, 8)
$stagingRoot = Join-Path $tempRoot "ancient-greek-wonders-$deploymentToken"
$archive = Join-Path $tempRoot "ancient-greek-wonders-$deploymentToken.tar.gz"
$remoteArchive = "/tmp/ancient-greek-wonders-$deploymentToken.tar.gz"

try {
  Write-Host "Staging release $releaseId ..."
  New-Item -ItemType Directory -Path $stagingRoot | Out-Null

  Get-ChildItem -LiteralPath $repoRoot -Force |
    Where-Object { $_.Name -ne ".git" -and $_.Name -ne "node_modules" -and $_.Name -ne "_site" } |
    ForEach-Object {
      Copy-Item -LiteralPath $_.FullName -Destination $stagingRoot -Recurse -Force
    }

  Write-Host "Creating archive $archive ..."
  & tar.exe -czf $archive -C $stagingRoot .
  if ($LASTEXITCODE -ne 0) { throw "Could not create the deployment archive." }

  if (-not (Test-Path -LiteralPath $archive -PathType Leaf)) {
    throw "The deployment archive was not created."
  }

  Write-Host "Uploading to ${VpsHost}:${remoteArchive} ..."
  & scp -i $IdentityFile $archive "${VpsHost}:$remoteArchive"
  if ($LASTEXITCODE -ne 0) { throw "Could not upload the deployment archive." }

  $remoteScript = @'
set -eu

app_root=/opt/ancient-greek-wonders
release_id=$1
remote_archive=$2
release_dir="$app_root/releases/$release_id"

mkdir -p "$release_dir" "$app_root/infra"
tar -xzf "$remote_archive" -C "$release_dir"

install -m 0644 "$release_dir/infra/nginx.conf" "$app_root/infra/nginx.conf"
install -m 0644 "$release_dir/infra/compose.prod.yaml" "$app_root/infra/compose.prod.yaml"

ln -s "$release_dir" "$app_root/current.next"
mv -Tf "$app_root/current.next" "$app_root/current"

docker compose -f "$app_root/infra/compose.prod.yaml" up -d --force-recreate
rm -f "$remote_archive"

printf 'deployed %s\n' "$release_id"
'@

  Write-Host "Deploying on VPS ..."
  $remoteScript | & ssh -i $IdentityFile $VpsHost "bash -s -- '$releaseId' '$remoteArchive'"
  if ($LASTEXITCODE -ne 0) { throw "The remote deployment failed." }
}
finally {
  if (Test-Path -LiteralPath $archive) {
    Remove-Item -LiteralPath $archive -Force
  }

  if (Test-Path -LiteralPath $stagingRoot) {
    Remove-Item -LiteralPath $stagingRoot -Recurse -Force
  }
}

Write-Host "Ship completed successfully!"
