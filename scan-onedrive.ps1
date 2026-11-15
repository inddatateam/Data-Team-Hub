param(
  [Parameter(Mandatory = $false)]
  [string]$RootPath = "$env:OneDriveCommercial\IND.T Data Team - General",

  [Parameter(Mandatory = $false)]
  [int]$Depth = 0,

  [Parameter(Mandatory = $false)]
  [switch]$IncludeNested
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $RootPath)) {
  $folderName = Split-Path -Path $RootPath -Leaf
  $detectedRoot = $env:OneDriveCommercial
  if ($detectedRoot -and (Test-Path -LiteralPath $detectedRoot)) {
    $match = Get-ChildItem -LiteralPath $detectedRoot -Directory -Recurse -ErrorAction SilentlyContinue |
      Where-Object { $_.Name -eq $folderName } |
      Select-Object -First 1

    if ($match) {
      $RootPath = $match.FullName
    }
  }

  if (-not (Test-Path -LiteralPath $RootPath)) {
    Write-Host "Folder not found: $RootPath"
    Write-Host "Try running with the exact path, for example:"
    Write-Host ".\scan-onedrive.ps1 -RootPath `"C:\Users\YOURNAME\OneDrive - IND Technology\IND.T Data Team - General`""
    exit 1
  }
}

function Convert-ToFileUri {
  param([string]$Path)
  $fullPath = [System.IO.Path]::GetFullPath($Path)
  return ([System.Uri]$fullPath).AbsoluteUri
}

function Get-RelativePath {
  param([string]$FromPath, [string]$ToPath)

  $from = [System.IO.Path]::GetFullPath($FromPath)
  $to = [System.IO.Path]::GetFullPath($ToPath)

  if (-not $from.EndsWith([System.IO.Path]::DirectorySeparatorChar)) {
    $from = $from + [System.IO.Path]::DirectorySeparatorChar
  }

  $fromUri = New-Object System.Uri($from)
  $toUri = New-Object System.Uri($to)
  $relativeUri = $fromUri.MakeRelativeUri($toUri)
  return [System.Uri]::UnescapeDataString($relativeUri.ToString()).Replace("/", [System.IO.Path]::DirectorySeparatorChar)
}

function Get-Category {
  param([System.IO.FileSystemInfo]$Item)

  $name = $Item.Name.ToLowerInvariant()
  $extension = ""
  if ($Item -is [System.IO.FileInfo]) {
    $extension = $Item.Extension.ToLowerInvariant()
  }

  if ($name -match "power\s*bi|powerbi|pbi|dashboard|report" -or $extension -eq ".pbix") {
    return "Power BI"
  }

  if ($extension -in @(".xlsx", ".xls", ".xlsm", ".csv", ".tsv")) {
    return "Excel"
  }

  if ($name -match "data|source|raw|audit|customer|client|machine learning") {
    return "Data Sources"
  }

  if ($name -match "sop|document|docs|checklist|guide|recording" -or $extension -in @(".docx", ".doc", ".pdf", ".pptx", ".txt", ".md")) {
    return "Docs"
  }

  if ($name -match "automation|tool|script|alert") {
    return "Automation"
  }

  return "Data Sources"
}

function Get-Tags {
  param([System.IO.FileSystemInfo]$Item, [string]$Category)

  $tags = @($Category.ToLowerInvariant())

  if ($Item.PSIsContainer) {
    $tags += "folder"
  } else {
    $tags += $Item.Extension.TrimStart(".").ToLowerInvariant()
  }

  $Item.Name -split "[\s_\-().]+" |
    Where-Object { $_.Length -gt 2 } |
    Select-Object -First 4 |
    ForEach-Object { $tags += $_.ToLowerInvariant() }

  return @($tags | Where-Object { $_ } | Select-Object -Unique)
}

$root = Get-Item -LiteralPath $RootPath

if ($IncludeNested) {
  $items = Get-ChildItem -LiteralPath $RootPath -Force -Depth $Depth
} else {
  $items = Get-ChildItem -LiteralPath $RootPath -Force
}

$items = $items |
  Where-Object { -not $_.Name.StartsWith(".") } |
  Sort-Object -Property @{ Expression = "PSIsContainer"; Descending = $true }, FullName

$resources = foreach ($item in $items) {
  $relativePath = Get-RelativePath -FromPath $root.FullName -ToPath $item.FullName
  $category = Get-Category -Item $item
  $itemType = if ($item.PSIsContainer) { "folder" } else { "file" }

  [ordered]@{
    name = $item.Name
    category = $category
    url = Convert-ToFileUri -Path $item.FullName
    owner = "Data Team"
    description = "$itemType in OneDrive: $relativePath"
    tags = Get-Tags -Item $item -Category $category
    pinned = ($relativePath.Split([System.IO.Path]::DirectorySeparatorChar).Count -eq 1)
  }
}

$json = $resources | ConvertTo-Json -Depth 6
$output = "window.HUB_RESOURCES = $json;`n"
$outputPath = Join-Path $PSScriptRoot "resources.generated.js"
Set-Content -LiteralPath $outputPath -Value $output -Encoding UTF8

Write-Host "Generated $($resources.Count) resources:"
Write-Host $outputPath
