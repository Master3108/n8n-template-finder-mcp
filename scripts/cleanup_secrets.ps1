$path = "C:\Users\Usuario\.gemini\antigravity\scratch\n8n-template-finder\templates"
$files = Get-ChildItem -Path $path -Filter *.json -Recurse
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    if ($content -match "pplx-[\w-]{20,}") {
        Write-Host "Cleaning Perplexity key in $($file.FullName)"
        $content = $content -replace "pplx-[\w-]{40,}", "YOUR_PERPLEXITY_API_KEY"
        $content | Set-Content $file.FullName
    }
    if ($content -match "sk-[\w-]{20,}") {
        Write-Host "Cleaning OpenAI key in $($file.FullName)"
        $content = $content -replace "sk-[\w-]{40,}", "YOUR_OPENAI_API_KEY"
        $content | Set-Content $file.FullName
    }
}
