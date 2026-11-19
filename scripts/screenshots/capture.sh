#!/bin/bash
# Captures the README screenshots from the example app's showcase scenes.
#
#   scripts/screenshots/capture.sh <out_dir>
#
# Needs Metro running (yarn example start), the debug example app installed on:
#   IOS26  simulator UDID, iPhone 17 Pro on iOS 26
#   IOS18  simulator UDID, iPhone 16 Pro on iOS 18
#   ANDROID adb serial of a Pixel 9 emulator (adb reverse tcp:8081 tcp:8081 done)
# and axe (brew install cameroncooke/axe/axe) for the simulator taps.
# The prompt shots have no keyboard: turn the software keyboard off on each simulator
# (DeviceHub: Device > Keyboard > Toggle Software Keyboard). On Android the prompt asks for
# an always-visible keyboard, so on a scratch emulator turn Gboard off for the run:
#   adb shell pm disable-user --user 0 com.google.android.inputmethod.latin   (enable after)
# SCENES, APPEARANCES and PLATFORMS narrow a run, e.g. SCENES=notes PLATFORMS=android.
# Writes <out_dir>/<platform>-<scene>-<light|dark>.png, framed by
# scripts/screenshots/frame.py.
set -euo pipefail

OUT=${1:?usage: capture.sh <out_dir>}
SCENES=${SCENES:-album notes}
APPEARANCES=${APPEARANCES:-light dark}
PLATFORMS=${PLATFORMS:-ios26 ios18 android}
BUNDLE=alert.example
mkdir -p "$OUT"

ios_status_bar() {
  xcrun simctl status_bar "$1" override --time 9:41 --dataNetwork wifi --wifiMode active \
    --wifiBars 3 --cellularMode active --cellularBars 4 --operatorName '' \
    --batteryState discharging --batteryLevel 100
}

android_demo() {
  local a=(adb -s "$ANDROID" shell)
  "${a[@]}" settings put global sysui_demo_allowed 1
  demo() { "${a[@]}" am broadcast -a com.android.systemui.demo -e command "$@" >/dev/null; }
  demo enter
  demo clock -e hhmm 0941
  demo battery -e level 100 -e plugged false
  demo network -e mobile hide
  demo network -e wifi show -e level 4 -e fully true
  demo notifications -e visible false
}

ios_shot() { # udid platform scene appearance
  xcrun simctl ui "$1" appearance "$4"
  xcrun simctl terminate "$1" "$BUNDLE" 2>/dev/null || true
  xcrun simctl launch "$1" "$BUNDLE" >/dev/null
  sleep 7
  axe tap --id "showcase-$3" --udid "$1" >/dev/null
  sleep 4 # the dialog's entry animation, and the Unsplash photos loading
  # A fresh simulator shows a one-time keyboard tip over the prompt's keyboard.
  if axe describe-ui --udid "$1" 2>/dev/null | grep -q '"Continue"'; then
    axe tap --label Continue --udid "$1" >/dev/null
    sleep 2
  fi
  xcrun simctl io "$1" screenshot --type=png "$OUT/$2-$3-$4.png" >/dev/null 2>&1
  echo "$OUT/$2-$3-$4.png"
}

android_shot() { # scene appearance
  local a=(adb -s "$ANDROID")
  "${a[@]}" shell cmd uimode night "$([ "$2" = dark ] && echo yes || echo no)" >/dev/null
  sleep 2 # night mode recreates running activities
  "${a[@]}" shell am force-stop "$BUNDLE"
  "${a[@]}" shell am start -n "$BUNDLE/.MainActivity" >/dev/null
  sleep 7
  local bounds='' try
  for try in 1 2 3; do # the dump fails while the activity is still settling
    "${a[@]}" shell uiautomator dump /sdcard/ui.xml >/dev/null 2>&1 || true
    bounds=$("${a[@]}" exec-out cat /sdcard/ui.xml | grep -o "resource-id=\"showcase-$1\"[^>]*bounds=\"[^\"]*\"" |
      sed -E 's/.*bounds="\[([0-9]+),([0-9]+)\]\[([0-9]+),([0-9]+)\]"/\1 \2 \3 \4/' || true)
    [ -n "$bounds" ] && break
    sleep 2
  done
  [ -n "$bounds" ] || { echo "showcase-$1 not found on Android" >&2; exit 1; }
  read -r x0 y0 x1 y1 <<<"$bounds"
  "${a[@]}" shell input tap $(((x0 + x1) / 2)) $(((y0 + y1) / 2))
  sleep 4
  "${a[@]}" exec-out screencap -p >"$OUT/android-$1-$2.png"
  echo "$OUT/android-$1-$2.png"
}

ios_status_bar "$IOS26"
ios_status_bar "$IOS18"
android_demo
for appearance in $APPEARANCES; do
  for scene in $SCENES; do
    if [[ " $PLATFORMS " == *" ios26 "* ]]; then ios_shot "$IOS26" ios26 "$scene" "$appearance"; fi
    if [[ " $PLATFORMS " == *" ios18 "* ]]; then ios_shot "$IOS18" ios18 "$scene" "$appearance"; fi
    if [[ " $PLATFORMS " == *" android "* ]]; then android_shot "$scene" "$appearance"; fi
  done
done
