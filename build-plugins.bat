@echo off
setlocal enabledelayedexpansion

set "PROFILE=%~1"
if "%PROFILE%"=="" set "PROFILE=debug"
if /i "%PROFILE%"=="release" (
    set "CARGO_ARGS=--release"
    set "CARGO_PROFILE=release"
) else (
    set "CARGO_ARGS="
    set "CARGO_PROFILE=debug"
)

set "PROJECT_DIR=%~dp0"
if "%PROJECT_DIR:~-1%"=="\" set "PROJECT_DIR=%PROJECT_DIR:~0,-1%"

set "PLUGINS_DIR=%PROJECT_DIR%\plugins"
set "WORKSPACE_TARGET=%PROJECT_DIR%\target\%CARGO_PROFILE%"

rem Build each plugin from plugins directory
echo [BUILD] Compiling workspace plugins (%CARGO_PROFILE%)...
set "BUILD_OK=1"
for /d %%D in ("%PLUGINS_DIR%\*") do (
    if exist "%%D\plugin.json" (
        set "plugin_name=%%~nxD"
        echo [BUILD] Building plugin: !plugin_name!
        cargo build -p !plugin_name! %CARGO_ARGS%
        if errorlevel 1 (
            echo [BUILD] ERROR: Plugin !plugin_name! compilation failed
            set "BUILD_OK=0"
        )
    )
)
if not "!BUILD_OK!"=="1" exit /b 1

rem Deploy plugins to target directory
set "output_plugins=%WORKSPACE_TARGET%\plugins"
if not exist "%output_plugins%" mkdir "%output_plugins%"

for /d %%D in ("%PLUGINS_DIR%\*") do (
    if exist "%%D\plugin.json" (
        set "plugin_name=%%~nxD"
        set "plugin_src=%%D"
        set "dst_dir=%output_plugins%\!plugin_name!"
        if not exist "!dst_dir!" mkdir "!dst_dir!"

        rem Read dll field from plugin.json via PowerShell
        set "dll_name="
        for /f "usebackq delims=" %%A in (`powershell -NoProfile -Command "(Get-Content -Encoding UTF8 '!plugin_src!\plugin.json' ^| ConvertFrom-Json).dll"`) do (
            set "dll_name=%%~A"
        )

        rem Copy DLL from target directly
        if defined dll_name (
            set "src_dll=%WORKSPACE_TARGET%\!dll_name!"
            if exist "!src_dll!" (
                copy /y "!src_dll!" "!dst_dir!\" >nul
            ) else (
                echo [BUILD] WARNING: DLL not found: !src_dll!
            )
        ) else (
            echo [BUILD] WARNING: Could not read dll field from !plugin_name!\plugin.json
        )

        rem Copy plugin.json
        copy /y "!plugin_src!\plugin.json" "!dst_dir!\" >nul

        rem Copy renderer directory recursively
        if exist "!plugin_src!\renderer" (
            xcopy /y /e /q /i "!plugin_src!\renderer" "!dst_dir!\renderer\" >nul 2>nul
        )

        rem Build Vue component if package.json exists
        if exist "!plugin_src!\renderer\package.json" (
            echo [BUILD] Building Vue component for: !plugin_name!
            pushd "!plugin_src!\renderer"
            if exist "node_modules" (
                call npm run build
            ) else (
                echo [BUILD] Installing dependencies for: !plugin_name!
                call npm install --ignore-scripts
                call npm run build
            )
            popd
            if exist "!plugin_src!\renderer\dist" (
                xcopy /y /e /q /i "!plugin_src!\renderer\dist" "!dst_dir!\renderer\dist\" >nul 2>nul
            )
        )

        echo [BUILD] Deployed: !plugin_name!
    )
)

echo [BUILD] Done
