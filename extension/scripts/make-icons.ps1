Add-Type -AssemblyName System.Drawing

foreach ($size in 16, 48, 128) {
    $bmp = New-Object System.Drawing.Bitmap $size, $size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = 'AntiAlias'
    $g.Clear([System.Drawing.Color]::Transparent)

    # Indigo rounded tile background
    $brush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 99, 102, 241))
    $r = [int]($size * 0.22)
    $tile = New-Object System.Drawing.Drawing2D.GraphicsPath
    $tile.AddArc(0, 0, $r * 2, $r * 2, 180, 90)
    $tile.AddArc($size - $r * 2, 0, $r * 2, $r * 2, 270, 90)
    $tile.AddArc($size - $r * 2, $size - $r * 2, $r * 2, $r * 2, 0, 90)
    $tile.AddArc(0, $size - $r * 2, $r * 2, $r * 2, 90, 90)
    $tile.CloseAllFigures()
    $g.FillPath($brush, $tile)

    # Lock shackle
    $light = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 238, 242, 255))
    $pen = New-Object System.Drawing.Pen ($light, [float]([Math]::Max(2, $size * 0.09)))
    $ax = [int]($size * 0.29)
    $ay = [int]($size * 0.20)
    $aw = [int]($size * 0.42)
    $ah = [int]($size * 0.42)
    $g.DrawArc($pen, $ax, $ay, $aw, $ah, 180, 200)

    # Lock body
    $bodyW = [int]($size * 0.50)
    $bodyH = [int]($size * 0.36)
    $bx = [int](($size - $bodyW) / 2)
    $by = [int]($size * 0.52)
    $g.FillRectangle($light, $bx, $by, $bodyW, $bodyH)

    # Keyhole
    $hole = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 99, 102, 241))
    $holeD = [int]($size * 0.12)
    $g.FillEllipse($hole, [int]($size / 2 - $holeD / 2), [int]($by + $bodyH * 0.3), $holeD, $holeD)

    $outDir = Join-Path $PSScriptRoot '..\icons'
    New-Item -ItemType Directory -Force -Path $outDir | Out-Null
    $bmp.Save((Join-Path $outDir "icon$size.png"), [System.Drawing.Imaging.ImageFormat]::Png)

    $g.Dispose(); $bmp.Dispose()
}
Write-Output 'icons written'
