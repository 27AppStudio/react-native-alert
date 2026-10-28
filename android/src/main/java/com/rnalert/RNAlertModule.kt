package com.rnalert

import android.app.Activity
import android.content.Context
import android.content.DialogInterface
import android.content.res.ColorStateList
import android.text.InputType
import android.view.ContextThemeWrapper
import android.view.LayoutInflater
import android.view.WindowManager
import android.view.inputmethod.EditorInfo
import androidx.appcompat.app.AlertDialog
import androidx.core.graphics.ColorUtils
import androidx.core.widget.doAfterTextChanged
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.UiThreadUtil
import com.google.android.material.button.MaterialButton
import com.google.android.material.color.MaterialColors
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.google.android.material.textfield.TextInputEditText
import com.google.android.material.textfield.TextInputLayout

/**
 * Material 3 alert dialogs in place of RN's AppCompat `Alert.alert`. Surface and
 * text colors come from Theme.RNAlert (apps can redefine it); button colors from JS.
 *
 * Buttons map like RN's own Android Alert: the last one is the positive button,
 * the one before it the negative, the one before that the neutral. Promises
 * resolve with the pressed button's index, or -1 when the dialog is dismissed
 * without a button (back, outside tap, activity torn down).
 */
class RNAlertModule(reactContext: ReactApplicationContext) :
  NativeRNAlertSpec(reactContext), LifecycleEventListener {

  private var dialog: AlertDialog? = null

  init {
    reactContext.addLifecycleEventListener(this)
  }

  override fun alert(options: ReadableMap, promise: Promise) {
    val activity = currentActivityOrReject(promise) ?: return
    val buttonsArray = options.getArray("buttons")!!
    val buttons = (0 until buttonsArray.size()).map { index ->
      val button = buttonsArray.getMap(index)!!
      Button(index, button.getString("text")!!, button.getString("style")!!)
    }

    UiThreadUtil.runOnUiThread {
      var settled = false
      fun settle(result: Int) {
        if (!settled) {
          settled = true
          promise.resolve(result)
        }
      }

      val builder = dialogBuilder(activity, options) { settle(-1) }
      val slots = setButtons(builder, buttons) { index -> settle(index) }
      present(builder.create(), slots, Colors(builder.context, options))
    }
  }

  override fun prompt(options: ReadableMap, promise: Promise) {
    val activity = currentActivityOrReject(promise) ?: return
    val buttons = listOf(
      Button(0, options.getString("cancelText")!!, "cancel"),
      Button(1, options.getString("confirmText")!!, "default"),
    )
    val defaultValue = options.getString("defaultValue") ?: ""

    UiThreadUtil.runOnUiThread {
      var settled = false
      lateinit var input: TextInputEditText
      fun settle(button: Int) {
        if (!settled) {
          settled = true
          promise.resolve(
            Arguments.createMap().apply {
              putBoolean("confirmed", button == 1)
              putString("text", input.text?.toString() ?: "")
            }
          )
        }
      }

      val builder = dialogBuilder(activity, options) { settle(-1) }
      val colors = Colors(builder.context, options)
      val view = LayoutInflater.from(builder.context).inflate(R.layout.rnalert_prompt, null)
      val field = view.findViewById<TextInputLayout>(R.id.rnalert_prompt_layout)
      input = view.findViewById(R.id.rnalert_prompt_input)
      field.hint = options.getString("label")
      colors.tint?.let { tint ->
        field.boxStrokeColor = tint
        field.hintTextColor = ColorStateList.valueOf(tint)
        field.cursorColor = ColorStateList.valueOf(tint)
      }
      input.inputType = InputType.TYPE_CLASS_TEXT or capitalization(options.getString("autoCapitalize"))
      input.setText(defaultValue)
      input.setSelection(defaultValue.length)
      builder.setView(view)

      val slots = setButtons(builder, buttons) { index -> settle(index) }
      val created = builder.create()
      created.window?.setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_STATE_ALWAYS_VISIBLE)
      present(created, slots, colors)

      // Nothing to confirm while the field is blank.
      val positive = created.getButton(DialogInterface.BUTTON_POSITIVE)
      fun updatePositive() {
        positive?.isEnabled = !input.text.isNullOrBlank()
      }
      updatePositive()
      input.doAfterTextChanged { updatePositive() }
      input.setOnEditorActionListener { _, actionId, _ ->
        if (actionId == EditorInfo.IME_ACTION_DONE && positive?.isEnabled == true) {
          positive.performClick()
        }
        true
      }
      input.requestFocus()
    }
  }

  private fun currentActivityOrReject(promise: Promise): Activity? {
    val activity = reactApplicationContext.currentActivity
    if (activity == null || activity.isFinishing) {
      promise.reject(E_NO_ACTIVITY, "No activity to show the alert on")
      return null
    }
    return activity
  }

  private fun capitalization(value: String?) = when (value) {
    "none" -> 0
    "words" -> InputType.TYPE_TEXT_FLAG_CAP_WORDS
    "characters" -> InputType.TYPE_TEXT_FLAG_CAP_CHARACTERS
    else -> InputType.TYPE_TEXT_FLAG_CAP_SENTENCES
  }

  private fun dialogBuilder(
    activity: Activity,
    options: ReadableMap,
    onDismiss: () -> Unit,
  ): MaterialAlertDialogBuilder =
    MaterialAlertDialogBuilder(ContextThemeWrapper(activity, R.style.Theme_RNAlert))
      .setTitle(options.getString("title"))
      .setMessage(options.getString("message"))
      .setCancelable(options.getBoolean("cancelable"))
      .setOnDismissListener {
        dialog = null
        onDismiss()
      }

  /** Last button is positive, then negative, then neutral (RN's mapping). */
  private fun setButtons(
    builder: MaterialAlertDialogBuilder,
    buttons: List<Button>,
    onPress: (Int) -> Unit,
  ): List<Pair<Button, Int>> {
    val slots =
      buttons.takeLast(3).reversed().zip(
        listOf(
          DialogInterface.BUTTON_POSITIVE,
          DialogInterface.BUTTON_NEGATIVE,
          DialogInterface.BUTTON_NEUTRAL,
        )
      )
    slots.forEach { (button, slot) ->
      val onClick = DialogInterface.OnClickListener { _, _ -> onPress(button.index) }
      when (slot) {
        DialogInterface.BUTTON_POSITIVE -> builder.setPositiveButton(button.text, onClick)
        DialogInterface.BUTTON_NEGATIVE -> builder.setNegativeButton(button.text, onClick)
        DialogInterface.BUTTON_NEUTRAL -> builder.setNeutralButton(button.text, onClick)
      }
    }
    return slots
  }

  /** Shows the dialog in place of any other, each button in its style's color. */
  private fun present(created: AlertDialog, slots: List<Pair<Button, Int>>, colors: Colors) {
    dialog?.dismiss()
    created.show()
    dialog = created
    slots.forEach { (button, slot) ->
      val color = colors.forStyle(button.style) ?: return@forEach
      val view = created.getButton(slot) ?: return@forEach
      // M3's disabled state: the same color at 38% opacity.
      val disabled = ColorUtils.setAlphaComponent(color, (0.38f * 255).toInt())
      view.setTextColor(
        ColorStateList(
          arrayOf(intArrayOf(-android.R.attr.state_enabled), intArrayOf()),
          intArrayOf(disabled, color),
        )
      )
      // M3's pressed state layer: the same color at 10% opacity.
      (view as? MaterialButton)?.rippleColor =
        ColorStateList.valueOf(ColorUtils.setAlphaComponent(color, (0.1f * 255).toInt()))
    }
  }

  override fun onHostResume() = Unit

  override fun onHostPause() = Unit

  override fun onHostDestroy() {
    if (dialog != null) {
      UiThreadUtil.runOnUiThread { dialog?.dismiss() }
    }
  }

  override fun invalidate() {
    reactApplicationContext.removeLifecycleEventListener(this)
    onHostDestroy()
    super.invalidate()
  }

  private data class Button(val index: Int, val text: String, val style: String)

  /** The JS colors; missing ones keep the theme's, except destructive (colorError). */
  private class Colors(context: Context, options: ReadableMap) {
    val tint = options.color("tintColor")
    private val label = options.color("labelColor")
    private val destructive = options.color("destructiveColor")
      ?: MaterialColors.getColor(context, androidx.appcompat.R.attr.colorError, 0)

    fun forStyle(style: String) = when (style) {
      "cancel" -> label
      "destructive" -> destructive
      else -> tint
    }

    private fun ReadableMap.color(key: String): Int? =
      if (hasKey(key) && !isNull(key)) getDouble(key).toLong().toInt() else null
  }

  companion object {
    const val NAME = NativeRNAlertSpec.NAME
    private const val E_NO_ACTIVITY = "E_NO_ACTIVITY"
  }
}
