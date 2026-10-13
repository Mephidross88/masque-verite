@echo off
rem Relais du suivi en direct du Masque de Verite (tools/2ship-live/relay.mjs) : double-cliquer pour le lancer pendant
rem qu'on joue, fermer la fenetre pour l'arreter. Arguments transmis au relais (ex. --pdb=chemin\2ship.pdb).
chcp 65001 >nul
title Relais Le Masque de Verite
cd /d "%~dp0"
where bun >nul 2>nul
if errorlevel 1 (
  echo Bun est introuvable : installez-le depuis https://bun.sh, ou prenez l'executable du relais dans les releases du projet.
  pause
  exit /b 1
)
bun tools\2ship-live\relay.mjs %*
echo.
echo Le relais s'est arrete.
pause
