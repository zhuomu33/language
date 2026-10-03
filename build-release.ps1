$ErrorActionPreference = 'Stop'
$releaseDir = Join-Path $PSScriptRoot 'release'
New-Item -ItemType Directory -Path $releaseDir -Force | Out-Null
foreach ($name in @('ui-preview.html', 'manifest.webmanifest', 'sw.js', 'course-progress.js')) {
    Copy-Item -LiteralPath (Join-Path $PSScriptRoot $name) -Destination $releaseDir
}
$assetsDir = Join-Path $releaseDir 'assets'
New-Item -ItemType Directory -Path $assetsDir -Force | Out-Null
$assets = @{
    'lucide.min.js' = 'https://unpkg.com/lucide@0.468.0/dist/umd/lucide.min.js'
    'mountains.jpg' = 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1100&q=85'
    'forest.jpg' = 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1100&q=85'
}
$html = Get-Content -Raw -LiteralPath (Join-Path $PSScriptRoot 'ui-preview.html')
foreach ($asset in $assets.GetEnumerator()) {
    $assetPath = Join-Path $assetsDir $asset.Key
    if (!(Test-Path -LiteralPath $assetPath)) { Invoke-WebRequest -Uri $asset.Value -OutFile $assetPath -TimeoutSec 60 }
    if ((Get-Item -LiteralPath $assetPath).Length -eq 0) { throw "Empty asset: $($asset.Key)" }
    $html = $html.Replace($asset.Value, ('./assets/' + $asset.Key))
}
$html | Set-Content -LiteralPath (Join-Path $releaseDir 'ui-preview.html') -Encoding utf8
$html | Set-Content -LiteralPath (Join-Path $releaseDir 'index.html') -Encoding utf8
Add-Type -AssemblyName System.Drawing
foreach ($size in @(180,192,512)) {
    $bitmap = [System.Drawing.Bitmap]::new($size,$size)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.Clear([System.Drawing.ColorTranslator]::FromHtml('#C695EE'))
    $pen = [System.Drawing.Pen]::new([System.Drawing.ColorTranslator]::FromHtml('#30203e'),[single]($size * 0.027))
    $graphics.DrawRectangle($pen,[single]($size*.23),[single]($size*.28),[single]($size*.54),[single]($size*.44))
    $graphics.DrawLine($pen,[single]($size*.5),[single]($size*.28),[single]($size*.5),[single]($size*.77))
    $name = if($size -eq 180){'apple-touch-icon.png'}else{"icon-$size.png"}
    $bitmap.Save((Join-Path $releaseDir $name),[System.Drawing.Imaging.ImageFormat]::Png)
    $pen.Dispose(); $graphics.Dispose(); $bitmap.Dispose()
}
$checks = foreach ($name in @('index.html','ui-preview.html','manifest.webmanifest','sw.js','course-progress.js','apple-touch-icon.png','icon-192.png','icon-512.png')) {
    $item = Get-Item -LiteralPath (Join-Path $releaseDir $name)
    [pscustomobject]@{File=$name;Pass=($item.Length -gt 0)}
}
$manifest = Get-Content -Raw -LiteralPath (Join-Path $releaseDir 'manifest.webmanifest') | ConvertFrom-Json
foreach ($icon in $manifest.icons) {
    if (!(Test-Path -LiteralPath (Join-Path $releaseDir $icon.src))) { throw 'Missing icon' }
}
if ($html -match 'https://(unpkg.com|images.unsplash.com)') { throw 'External runtime asset remains' }
Compress-Archive -LiteralPath (Get-ChildItem -LiteralPath $releaseDir).FullName -DestinationPath (Join-Path $PSScriptRoot 'daily-page-release.zip') -Force
$checks | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $PSScriptRoot 'release-verification.tmp.json')
$checks | Format-Table
