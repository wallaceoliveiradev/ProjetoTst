@echo off
set "NODE_DIR=%~dp0node-portable\node-v24.19.0-win-x64"
cd /d "%~dp0"
set "PATH=%NODE_DIR%;%PATH%"
"%NODE_DIR%\node.exe" -v
call "%NODE_DIR%\npm.cmd" -v
call "%NODE_DIR%\npx.cmd" --version
echo Starting Angular with downloaded Node...
call "%NODE_DIR%\npx.cmd" --yes ng serve
pause

cd C:\Users\rosa.miguel\projeto-tst-main
run-angular.cmd
