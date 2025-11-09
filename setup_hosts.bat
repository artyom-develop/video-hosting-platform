@echo off
REM Add xatube.local to Windows hosts file
REM Run this as Administrator

set HOSTSFILE=C:\Windows\System32\drivers\etc\hosts

REM Check if xatube.local already exists
findstr /i "xatube.local" "%HOSTSFILE%" >nul
if %errorlevel% equ 0 (
    echo xatube.local is already in hosts file
) else (
    echo Adding xatube.local to hosts file...
    echo 127.0.0.1 xatube.local >> "%HOSTSFILE%"
    echo Done! You can now access XaTube at http://xatube.local
)
