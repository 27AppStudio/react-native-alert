package com.rnalert

import android.graphics.Color
import android.text.InputType
import android.view.ContextThemeWrapper
import android.widget.Button
import android.widget.EditText
import androidx.test.core.app.ActivityScenario
import androidx.test.core.app.ApplicationProvider
import androidx.test.espresso.Espresso.onView
import androidx.test.espresso.Espresso.pressBack
import androidx.test.espresso.NoMatchingRootException
import androidx.test.espresso.ViewAssertion
import androidx.test.espresso.action.ViewActions.click
import androidx.test.espresso.action.ViewActions.pressImeActionButton
import androidx.test.espresso.action.ViewActions.replaceText
import androidx.test.espresso.assertion.ViewAssertions.matches
import androidx.test.espresso.matcher.RootMatchers.isDialog
import androidx.test.espresso.matcher.ViewMatchers.isDisplayed
import androidx.test.espresso.matcher.ViewMatchers.isEnabled
import androidx.test.espresso.matcher.ViewMatchers.withId
import androidx.test.espresso.matcher.ViewMatchers.withTagValue
import androidx.test.espresso.matcher.ViewMatchers.withText
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import com.facebook.react.bridge.BridgeReactContext
import com.facebook.react.bridge.JavaOnlyArray
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.facebook.react.soloader.OpenSourceMergedSoMapping
import com.facebook.soloader.SoLoader
import com.google.android.material.color.MaterialColors
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import org.hamcrest.Matchers.`is`
import org.hamcrest.Matchers.not
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Assert.fail
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith

/**
 * The module against real Material 3 dialogs: a test activity stands in for the
 * React Native host, and Espresso presses the buttons a user would.
 */
@RunWith(AndroidJUnit4::class)
class RNAlertModuleTest {
  private lateinit var scenario: ActivityScenario<TestActivity>
  private lateinit var reactContext: BridgeReactContext
  private lateinit var module: RNAlertModule

  @Before
  fun setUp() {
    // The prompt resolves with a native map.
    SoLoader.init(ApplicationProvider.getApplicationContext(), OpenSourceMergedSoMapping)
    scenario = ActivityScenario.launch(TestActivity::class.java)
    scenario.onActivity { activity ->
      reactContext = BridgeReactContext(activity.applicationContext)
      module = RNAlertModule(reactContext)
      reactContext.onHostResume(activity)
    }
  }

  @After
  fun tearDown() {
    scenario.onActivity { module.invalidate() }
    idle()
    scenario.close()
  }

  // Alert

  @Test
  fun lastButtonIsPositiveThenNegativeThenNeutral() {
    module.alert(alertOptions("Cancel" to "cancel", "Later" to "default", "Delete" to "destructive"), TestPromise())
    button(POSITIVE).check(matches(withText("Delete")))
    button(NEGATIVE).check(matches(withText("Later")))
    button(NEUTRAL).check(matches(withText("Cancel")))
  }

  @Test
  fun pressedButtonResolvesWithItsIndex() {
    for ((index, text) in listOf("Cancel", "Later", "Delete").withIndex()) {
      val promise = TestPromise()
      module.alert(alertOptions("Cancel" to "cancel", "Later" to "default", "Delete" to "destructive"), promise)
      onView(withText(text)).inRoot(isDialog()).perform(click())
      assertEquals(index, promise.await())
    }
  }

  @Test
  fun onlyTheLastThreeButtonsAreShown() {
    val promise = TestPromise()
    module.alert(
      alertOptions("One" to "default", "Two" to "default", "Three" to "default", "Four" to "default"),
      promise,
    )
    assertNoDialogWith("One")
    onView(withText("Two")).inRoot(isDialog()).perform(click())
    assertEquals(1, promise.await())
  }

  @Test
  fun backOnCancelableAlertResolvesMinusOne() {
    val promise = TestPromise()
    module.alert(alertOptions("OK" to "default"), promise)
    title().check(matches(isDisplayed()))
    pressBack()
    assertEquals(-1, promise.await())
  }

  @Test
  fun backOnNonCancelableAlertKeepsItOpen() {
    val promise = TestPromise()
    module.alert(alertOptions("OK" to "default", cancelable = false), promise)
    title().check(matches(isDisplayed()))
    pressBack()
    title().check(matches(isDisplayed()))
    assertFalse(promise.isSettled)
  }

  @Test
  fun newAlertReplacesTheOpenOne() {
    val first = TestPromise()
    module.alert(alertOptions("First" to "default"), first)
    title().check(matches(isDisplayed()))
    val second = TestPromise()
    module.alert(alertOptions("Second" to "default"), second)
    assertEquals(-1, first.await())
    assertNoDialogWith("First")
    onView(withText("Second")).inRoot(isDialog()).perform(click())
    assertEquals(0, second.await())
  }

  @Test
  fun hostDestroyDismissesTheReplacingAlert() {
    module.alert(alertOptions("First" to "default"), TestPromise())
    title().check(matches(isDisplayed()))
    val second = TestPromise()
    module.alert(alertOptions("Second" to "default"), second)
    onView(withText("Second")).inRoot(isDialog()).check(matches(isDisplayed()))
    scenario.onActivity { reactContext.onHostDestroy() }
    assertEquals(-1, second.await())
  }

  @Test
  fun hostDestroyDismissesTheAlert() {
    val promise = TestPromise()
    module.alert(alertOptions("OK" to "default"), promise)
    title().check(matches(isDisplayed()))
    scenario.onActivity { reactContext.onHostDestroy() }
    assertEquals(-1, promise.await())
    assertNoDialogWith("OK")
  }

  @Test
  fun rejectsWithoutAnActivity() {
    val promise = TestPromise()
    val detached = RNAlertModule(BridgeReactContext(ApplicationProvider.getApplicationContext()))
    detached.alert(alertOptions("OK" to "default"), promise)
    promise.await()
    assertEquals("E_NO_ACTIVITY", promise.rejectCode)
  }

  @Test
  fun buttonsTakeTheirStyleColor() {
    val tint = Color.parseColor("#1E88E5")
    val label = Color.parseColor("#616161")
    module.alert(
      alertOptions(
        "Cancel" to "cancel", "Later" to "default", "Delete" to "destructive",
        colors = mapOf("tintColor" to tint, "labelColor" to label),
      ),
      TestPromise(),
    )
    button(NEUTRAL).check(textColor(label))
    button(NEGATIVE).check(textColor(tint))
    var error = 0
    scenario.onActivity { activity ->
      error = MaterialColors.getColor(
        ContextThemeWrapper(activity, R.style.Theme_RNAlert), androidx.appcompat.R.attr.colorError, 0,
      )
    }
    // No destructiveColor from JS: the theme's colorError.
    button(POSITIVE).check(textColor(error))
  }

  // Prompt

  @Test
  fun confirmIsDisabledWhileTheFieldIsBlank() {
    module.prompt(promptOptions(), TestPromise())
    button(POSITIVE).check(matches(not(isEnabled())))
    field().perform(replaceText("   "))
    button(POSITIVE).check(matches(not(isEnabled())))
    field().perform(replaceText("Groceries"))
    button(POSITIVE).check(matches(isEnabled()))
  }

  @Test
  fun confirmResolvesWithTheText() {
    val promise = TestPromise()
    module.prompt(promptOptions(defaultValue = "Lunch"), promise)
    field().check(matches(withText("Lunch")))
    field().perform(replaceText("Dinner"))
    button(POSITIVE).perform(click())
    val result = promise.await() as ReadableMap
    assertTrue(result.getBoolean("confirmed"))
    assertEquals("Dinner", result.getString("text"))
  }

  @Test
  fun cancelResolvesUnconfirmed() {
    val promise = TestPromise()
    module.prompt(promptOptions(defaultValue = "Lunch"), promise)
    button(NEGATIVE).perform(click())
    val result = promise.await() as ReadableMap
    assertFalse(result.getBoolean("confirmed"))
    assertEquals("Lunch", result.getString("text"))
  }

  @Test
  fun keyboardDoneConfirmsOnlyWithText() {
    val promise = TestPromise()
    module.prompt(promptOptions(), promise)
    field().perform(pressImeActionButton())
    field().check(matches(isDisplayed()))
    assertFalse(promise.isSettled)
    field().perform(replaceText("Taxi"), pressImeActionButton())
    val result = promise.await() as ReadableMap
    assertTrue(result.getBoolean("confirmed"))
    assertEquals("Taxi", result.getString("text"))
  }

  @Test
  fun autoCapitalizeMapsToTheInputType() {
    val expected = mapOf(
      "none" to 0,
      "sentences" to InputType.TYPE_TEXT_FLAG_CAP_SENTENCES,
      "words" to InputType.TYPE_TEXT_FLAG_CAP_WORDS,
      "characters" to InputType.TYPE_TEXT_FLAG_CAP_CHARACTERS,
    )
    for ((value, flag) in expected) {
      val promise = TestPromise()
      module.prompt(promptOptions(autoCapitalize = value), promise)
      field().check { view, noView ->
        if (view == null) throw noView
        assertEquals(value, InputType.TYPE_CLASS_TEXT or flag, (view as EditText).inputType)
      }
      button(NEGATIVE).perform(click())
      promise.await()
    }
  }

  // Helpers

  private fun title() = onView(withText(TITLE)).inRoot(isDialog())

  private fun button(slot: Int) = onView(withId(slot)).inRoot(isDialog())

  private fun field() = onView(withTagValue(`is`("rn-alert-prompt-input"))).inRoot(isDialog())

  private fun textColor(color: Int) = ViewAssertion { view, noView ->
    if (view == null) throw noView
    assertEquals(Integer.toHexString(color), Integer.toHexString((view as Button).currentTextColor))
  }

  private fun assertNoDialogWith(text: String) {
    idle()
    try {
      onView(withText(text)).inRoot(isDialog()).check(matches(isDisplayed()))
      fail("\"$text\" is still on screen")
    } catch (_: NoMatchingRootException) {
    } catch (_: androidx.test.espresso.NoMatchingViewException) {
    }
  }

  private fun idle() = InstrumentationRegistry.getInstrumentation().waitForIdleSync()

  private fun alertOptions(
    vararg buttons: Pair<String, String>,
    cancelable: Boolean = true,
    colors: Map<String, Int> = emptyMap(),
  ) = JavaOnlyMap().apply {
    putString("title", TITLE)
    putString("message", "Message")
    putBoolean("cancelable", cancelable)
    putString("userInterfaceStyle", "unspecified")
    putArray(
      "buttons",
      JavaOnlyArray().apply {
        buttons.forEach { (text, style) ->
          pushMap(JavaOnlyMap.of("text", text, "style", style, "isPreferred", false))
        }
      },
    )
    colors.forEach { (key, color) -> putDouble(key, color.toDouble()) }
  }

  private fun promptOptions(defaultValue: String = "", autoCapitalize: String = "sentences") =
    JavaOnlyMap().apply {
      putString("title", TITLE)
      putString("label", "Name")
      putString("cancelText", "Cancel")
      putString("confirmText", "Save")
      putString("defaultValue", defaultValue)
      putString("autoCapitalize", autoCapitalize)
      putBoolean("cancelable", true)
      putString("userInterfaceStyle", "unspecified")
    }

  /** Settled from the UI thread; the test thread waits for it. */
  private class TestPromise : Promise {
    private val latch = CountDownLatch(1)
    @Volatile private var value: Any? = null
    @Volatile var rejectCode: String? = null
      private set

    val isSettled get() = latch.count == 0L

    fun await(): Any? {
      assertTrue("promise not settled in time", latch.await(5, TimeUnit.SECONDS))
      return value
    }

    override fun resolve(value: Any?) {
      this.value = value
      latch.countDown()
    }

    private fun settleRejected(code: String?) {
      rejectCode = code ?: "unknown"
      latch.countDown()
    }

    override fun reject(code: String?, message: String?) = settleRejected(code)
    override fun reject(code: String?, throwable: Throwable?) = settleRejected(code)
    override fun reject(code: String?, message: String?, throwable: Throwable?) = settleRejected(code)
    override fun reject(throwable: Throwable) = settleRejected(null)
    override fun reject(throwable: Throwable, userInfo: WritableMap) = settleRejected(null)
    override fun reject(code: String?, userInfo: WritableMap) = settleRejected(code)
    override fun reject(code: String?, throwable: Throwable?, userInfo: WritableMap) = settleRejected(code)
    override fun reject(code: String?, message: String?, userInfo: WritableMap) = settleRejected(code)
    override fun reject(code: String?, message: String?, throwable: Throwable?, userInfo: WritableMap?) =
      settleRejected(code)
    override fun reject(message: String) = settleRejected(null)
  }

  private companion object {
    const val TITLE = "Title"
    const val POSITIVE = android.R.id.button1
    const val NEGATIVE = android.R.id.button2
    const val NEUTRAL = android.R.id.button3
  }
}
