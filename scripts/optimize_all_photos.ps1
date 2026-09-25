param (
    [string]$SupabaseUrl = "https://vbgukffszdsehtaemkpx.supabase.co",
    [string]$AnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZiZ3VrZmZzemRzZWh0YWVta3B4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwODg4MzcsImV4cCI6MjA3NTY2NDgzN30.Td1HB4Z4UGrZsEo9NC3OIvuBmkOPzi9kaym7Fpl0zDg"
)

Add-Type -AssemblyName System.Drawing

$headers = @{
    "apikey" = $AnonKey
    "Authorization" = "Bearer $AnonKey"
}

# 1. Fetch list of files in bucket
Write-Host "Fetching files from client-photos bucket..."
$listUrl = "$SupabaseUrl/storage/v1/object/list/client-photos"
$body = @{ prefix = ""; limit = 100; offset = 0; sortBy = @{ column = "name"; order = "asc" } } | ConvertTo-Json

$files = Invoke-RestMethod -Uri $listUrl -Method Post -Headers $headers -Body $body -ContentType "application/json"
Write-Host "Found $($files.Count) total objects in client-photos."

$tmpDir = [System.IO.Path]::Combine([System.IO.Path]::GetTempPath(), "opt_all_photos")
if (-not (Test-Path $tmpDir)) { New-Item -ItemType Directory -Force -Path $tmpDir | Out-Null }

$codecs = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders()
$jpegCodec = $null
foreach ($c in $codecs) {
    if ($c.MimeType -eq 'image/jpeg') { $jpegCodec = $c; break }
}
$encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
$encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]85)

$optimizedCount = 0
$totalSavedBytes = 0

foreach ($file in $files) {
    $name = $file.name
    $size = $file.metadata.size
    if ($null -eq $size) { $size = 0 }

    # Only optimize if > 100 KB
    if ($size -le 100000) {
        Write-Host "Skipping $name (already small: $([Math]::Round($size / 1024, 1)) KB)"
        continue
    }

    Write-Host "Optimizing $name ($([Math]::Round($size / 1024, 1)) KB)..."
    $fileUrl = "$SupabaseUrl/storage/v1/object/public/client-photos/$name"
    $rawPath = [System.IO.Path]::Combine($tmpDir, "raw_$name")
    $optPath = [System.IO.Path]::Combine($tmpDir, "opt_$name")

    try {
        Invoke-WebRequest -Uri $fileUrl -OutFile $rawPath
        $img = [System.Drawing.Image]::FromFile($rawPath)
        $origW = $img.Width
        $origH = $img.Height
        $maxDim = 500
        $ratio = [Math]::Min($maxDim / $origW, $maxDim / $origH)
        if ($ratio -ge 1.0) { $ratio = 1.0 }
        $newW = [int]($origW * $ratio)
        $newH = [int]($origH * $ratio)

        $bmp = New-Object System.Drawing.Bitmap($newW, $newH)
        $g = [System.Drawing.Graphics]::FromImage($bmp)
        $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $g.DrawImage($img, 0, 0, $newW, $newH)

        $bmp.Save($optPath, $jpegCodec, $encoderParams)
        $g.Dispose()
        $bmp.Dispose()
        $img.Dispose()

        $optBytes = [System.IO.File]::ReadAllBytes($optPath)
        $newSize = $optBytes.Length
        $saved = $size - $newSize
        $totalSavedBytes += $saved

        # Upload back to Supabase
        $uploadHeaders = @{
            "apikey" = $AnonKey
            "Authorization" = "Bearer $AnonKey"
            "x-upsert" = "true"
            "cache-control" = "31536000"
        }
        $uploadUrl = "$SupabaseUrl/storage/v1/object/client-photos/$name"
        $uploadRes = Invoke-RestMethod -Uri $uploadUrl -Method Post -Headers $uploadHeaders -Body $optBytes -ContentType "image/jpeg"

        Write-Host "  -> Done! Reduced from $([Math]::Round($size / 1024, 1)) KB to $([Math]::Round($newSize / 1024, 1)) KB ($([Math]::Round((1 - $newSize/$size)*100, 1))% smaller)"
        $optimizedCount++
    } catch {
        Write-Host "  -> Error optimizing $name : $_"
    } finally {
        if (Test-Path $rawPath) { Remove-Item $rawPath -Force -ErrorAction SilentlyContinue }
        if (Test-Path $optPath) { Remove-Item $optPath -Force -ErrorAction SilentlyContinue }
    }
}

Write-Host "`nCompleted! Optimized $optimizedCount images."
Write-Host "Total bandwidth saved: $([Math]::Round($totalSavedBytes / 1024 / 1024, 2)) MB"
