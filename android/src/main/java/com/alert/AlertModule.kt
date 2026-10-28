package com.alert

import com.facebook.react.bridge.ReactApplicationContext

class AlertModule(reactContext: ReactApplicationContext) :
  NativeAlertSpec(reactContext) {

  override fun multiply(a: Double, b: Double): Double {
    return a * b
  }

  companion object {
    const val NAME = NativeAlertSpec.NAME
  }
}
