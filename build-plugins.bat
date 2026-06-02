@echo off
setlocal enabledelayedexpansion

set "TARGET_DIR=%~1"
if "%TARGET_DIR%"=="" set "TARGET_DIR=target\debug"

echo [BUILD] Compiling workspace plugin crates...
cargo build -p hello_plugin --release
if errorlevel 1 (
    echo [BUILD] ERROR: Plugin compilation failed
    exit /b 1
)

set "PROJECT_DIR=%~dp0"
if "%PROJECT_DIR:~-1%"=="\" set "PROJECT_DIR=%PROJECT_DIR:~0,-1"

set "PLUGINS_DIR=%PROJECT_DIR%\plugins"
set "WORKSPACE_TARGET=%PROJECT_DIR%\target\release"

rem Copy each plugin's DLL back to its source directory
for /d %%D in ("%PLUGINS_DIR%\*") do (
    if exist "%%D\plugin.json" (
        set "plugin_dir=%%D"
        set "plugin_name=%%~nxD"

        rem Read dll field: find the line with "dll", extract value between quotes
        set "dll_name="
        for /f "tokens=2 delims=:," %%A in ('findstr /i "\"dll\"" "%%D\plugin.json"') do (
            for /f "tokens=2 delims=\"" %%B in ("%%A") do (
                set "dll_name=%%B"
            )
        )

        if defined dll_name (
            set "src_dll=%WORKSPACE_TARGET%\!dll_name!"
            if exist "!src_dll!" (
                copy /y "!src_dll!" "%%D\!dll_name!" >nul
                echo [BUILD] Copied: !dll_name!
            ) else (
                echo [BUILD] WARNING: DLL not found: !src_dll!
            )
        )
    )
)

rem Deploy plugins to target directory
set "output_plugins=%TARGET_DIR%\plugins"
if not exist "%output_plugins%" mkdir "%output_plugins%"

for /d %%D in ("%PLUGINS_DIR%\*") do (
    if exist "%%D\plugin.json" (
        set "plugin_name=%%~nxD"
        set "dst_dir=%output_plugins%\!plugin_name!"
        if not exist "!dst_dir!" mkdir "!dst_dir!"

        rem Read dll field
        set "dll_name="
        for /f "tokens=2 delims=:," %%A in ('findstr /i "\"dll\"" "%%D\plugin.json"') do (
            for /f "tokens=2 delims=\"" %%B in ("%%A") do (
                set "dll_name=%%B"
            )
        )

        rem Copy DLL
        if defined dll_name if exist "%%D\!dll_name!" (
            copy /y "%%D\!dll_name!" "!dst_dir!\" >nul
        )

        rem Copy plugin.json
        copy /y "%%D\plugin.json" "!dst_dir!\" >nul

        rem Copy renderer directory
        if exist "%%D\renderer" (
            if not exist "!dst_dir!\renderer" mkdir "!dst_dir!\renderer"
            xcopy /y /q "%%D\renderer\*" "!dst_dir!\renderer\" >nul 2>nul
        )

        echo [BUILD] Deployed: !plugin_name!
    )
)

echo [BUILD] Done
