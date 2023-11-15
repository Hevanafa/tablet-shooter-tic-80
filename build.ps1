# powershell -file .\build.ps1

tsc -p .\tsconfig.json;

# handle 4 spaces to save space
get-content .\game.js | ForEach-Object {
    $_ -replace "    ", " "
} | out-file -FilePath .\game_2.js

Write-Output "Saved as game_2.js"
Write-Output "It's recommended to use JS Minifier (at least for ES6)"
Write-Output "https://www.digitalocean.com/community/tools/minify"

