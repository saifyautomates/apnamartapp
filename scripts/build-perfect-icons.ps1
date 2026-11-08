Add-Type -AssemblyName System.Drawing

$srcPath = Join-Path (Get-Location) "public\icons\central-mart-icon.jpg"
if (-not (Test-Path $srcPath)) {
    Write-Error "Source image not found: $srcPath"
    exit 1
}

$src = [System.Drawing.Bitmap]::FromFile($srcPath)

# 1. Exact crop of the green squircle badge (eliminating all 156px off-white background and grey shadow)
$cropRect = New-Object System.Drawing.Rectangle(156, 161, 710, 710)
$cropped = $src.Clone($cropRect, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

# 2. Master 710x710 32-bit ARGB with anti-aliased squircle clipping mask
$master = New-Object System.Drawing.Bitmap(710, 710, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$gMaster = [System.Drawing.Graphics]::FromImage($master)
$gMaster.Clear([System.Drawing.Color]::Transparent)
$gMaster.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$gMaster.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$gMaster.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$gMaster.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

$radius = 170
$diam = $radius * 2
$path = New-Object System.Drawing.Drawing2D.GraphicsPath
$path.AddArc(0, 0, $diam, $diam, 180, 90)
$path.AddArc(710 - $diam, 0, $diam, $diam, 270, 90)
$path.AddArc(710 - $diam, 710 - $diam, $diam, $diam, 0, 90)
$path.AddArc(0, 710 - $diam, $diam, $diam, 90, 90)
$path.CloseFigure()

$gMaster.SetClip($path)
$gMaster.DrawImage($cropped, 0, 0, 710, 710)
$gMaster.ResetClip()

$gMaster.Dispose()
$path.Dispose()
$cropped.Dispose()
$src.Dispose()

# Helper function to resize transparent ARGB image with high quality
function Export-TransparentPng($source, $targetPath, $size) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.Clear([System.Drawing.Color]::Transparent)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

    $g.DrawImage($source, 0, 0, $size, $size)
    $g.Dispose()

    if (Test-Path $targetPath) { Remove-Item $targetPath -Force }
    $bmp.Save($targetPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Exported: $targetPath ($size x $size)"
}

# 3. Export all clean transparent icons
Export-TransparentPng $master (Join-Path (Get-Location) "public\icons\icon-512.png") 512
Export-TransparentPng $master (Join-Path (Get-Location) "public\icons\icon-192.png") 192
Export-TransparentPng $master (Join-Path (Get-Location) "public\icons\apple-touch-icon.png") 180
Export-TransparentPng $master (Join-Path (Get-Location) "public\favicon.png") 48
Export-TransparentPng $master (Join-Path (Get-Location) "public\favicon-32x32.png") 32
Export-TransparentPng $master (Join-Path (Get-Location) "public\favicon-16x16.png") 16

# 4. Generate Maskable Icon: Full-bleed emerald green (#0c831f) edge-to-edge with badge in 80% safe zone
$maskBmp = New-Object System.Drawing.Bitmap(512, 512, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$gMask = [System.Drawing.Graphics]::FromImage($maskBmp)
$gMask.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$gMask.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$gMask.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

# Solid background fill
$greenBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 12, 131, 31))
$gMask.FillRectangle($greenBrush, 0, 0, 512, 512)
$greenBrush.Dispose()

# Draw badge centered in 80% safe zone (size: 410x410, offset: 51, 51)
$pad = 51
$innerSize = 410
$gMask.DrawImage($master, $pad, $pad, $innerSize, $innerSize)
$gMask.Dispose()

$maskPath = Join-Path (Get-Location) "public\icons\maskable-512.png"
if (Test-Path $maskPath) { Remove-Item $maskPath -Force }
$maskBmp.Save($maskPath, [System.Drawing.Imaging.ImageFormat]::Png)
$maskBmp.Dispose()
Write-Host "Exported: $maskPath (512x512 full-bleed maskable)"

$master.Dispose()
Write-Host "All transparent icons built successfully!"

