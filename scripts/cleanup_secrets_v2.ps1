$path = "C:\Users\Usuario\.gemini\antigravity\scratch\n8n-template-finder"
$files = Get-ChildItem -Path $path -Exclude "node_modules", ".git" -Recurse | Where-Object { $_.PSIsContainer -eq $false }
foreach ($file in $files) {
    try {
        $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
        if ($null -ne $content) {
            $changed = $false
            if ($content -match "pplx-[a-zA-Z0-9]{20,}") {
                Write-Host "Cleaning Perplexity key in $($file.FullName)"
                $content = $content -replace "pplx-[a-zA-Z0-9]{20,}", "YOUR_PERPLEXITY_API_KEY"
                $changed = $true
            }
            if ($content -match "sk-[a-zA-Z0-9]{20,}") {
                Write-Host "Cleaning OpenAI key in $($file.FullName)"
                $content = $content -replace "sk-[a-zA-Z0-9]{20,}", "YOUR_OPENAI_API_KEY"
                $changed = $true
            }
            if ($changed) {
                $content | Set-Content $file.FullName
            }
        }
    }
    catch {
        # Skip binary files or access errors
    }
}
