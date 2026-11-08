Add-Type -AssemblyName System.Drawing

$srcPath = Join-Path (Get-Location) "public\icons\central-mart-icon.jpg"
$src = [System.Drawing.Image]::FromFile($srcPath)

function Resize-Image($source, $targetPath, $width, $height, $isMaskable = $false) {
    $bmp = New-Object System.Drawing.Bitmap($width, $height)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

    if ($isMaskable) {
        # Fill with Central Mart emerald green background (#0c831f)
        $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 12, 131, 31))
        $g.FillRectangle($brush, 0, 0, $width, $height)
        $brush.Dispose()

        # Render source inside the 80% safe zone for Android circular/squircle mask
        $pad = [int]($width * 0.1)
        $innerW = $width - ($pad * 2)
        $innerH = $height - ($pad * 2)
        $destRect = New-Object System.Drawing.Rectangle($pad, $pad, $innerW, $innerH)
        $srcRect = New-Object System.Drawing.Rectangle(0, 0, $source.Width, $source.Height)
        $g.DrawImage($source, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
    } else {
        $destRect = New-Object System.Drawing.Rectangle(0, 0, $width, $height)
        $srcRect = New-Object System.Drawing.Rectangle(0, 0, $source.Width, $source.Height)
        $g.DrawImage($source, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
    }

    $g.Dispose()
    $bmp.Save($targetPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Created: $targetPath ($width x $height)"
}

Resize-Image $src (Join-Path (Get-Location) "public\icons\icon-512.png") 512 512 $false
Resize-Image $src (Join-Path (Get-Location) "public\icons\maskable-512.png") 512 512 $true
Resize-Image $src (Join-Path (Get-Location) "public\icons\icon-192.png") 192 192 $false
Resize-Image $src (Join-Path (Get-Location) "public\icons\apple-touch-icon.png") 180 180 $false
Resize-Image $src (Join-Path (Get-Location) "public\favicon.png") 64 64 $false

# Generate favicon.ico from 48x48 bitmap
$icoBmp = New-Object System.Drawing.Bitmap(48, 48)
$gIco = [System.Drawing.Graphics]::FromImage($icoBmp)
$gIco.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$gIco.DrawImage($src, 0, 0, 48, 48)
$gIco.Dispose()

$hIcon = $icoBmp.GetHicon()
$icon = [System.Drawing.Icon]::FromHandle($hIcon)
$icoPath = Join-Path (Get-Location) "public\favicon.ico"
if (Test-Path $icoPath) { Remove-Item $icoPath -Force }
$fs = [System.IO.File]::Create($icoPath)
$icon.Save($fs)
$fs.Close()
$icon.Dispose()
$icoBmp.Dispose()
Write-Host "Created: $icoPath (48x48 icon)"

$src.Dispose()
Write-Host "All Central Mart PWA icons generated successfully!"
