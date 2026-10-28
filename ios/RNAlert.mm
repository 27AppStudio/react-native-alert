#import "RNAlert.h"

#import <React/RCTConvert.h>
#import <React/RCTLog.h>
#import <React/RCTUtils.h>
#import <UIKit/UIKit.h>
#import <objc/runtime.h>

/** Return in the prompt's field: runs `onReturn` instead of what the alert would do. */
@interface RNAlertFieldDelegate : NSObject <UITextFieldDelegate>
@property (nonatomic, copy) void (^onReturn)(void);
@end

@implementation RNAlertFieldDelegate

- (BOOL)textFieldShouldReturn:(UITextField *)textField
{
  self.onReturn();
  return NO;
}

@end

@implementation RNAlert

+ (NSString *)moduleName
{
  return @"RNAlert";
}

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

static BOOL IsBlank(NSString *text)
{
  return [text stringByTrimmingCharactersInSet:NSCharacterSet.whitespaceAndNewlineCharacterSet]
             .length == 0;
}

static UIUserInterfaceStyle InterfaceStyle(NSString *style)
{
  if ([style isEqualToString:@"light"]) {
    return UIUserInterfaceStyleLight;
  }
  if ([style isEqualToString:@"dark"]) {
    return UIUserInterfaceStyleDark;
  }
  return UIUserInterfaceStyleUnspecified;
}

static UITextAutocapitalizationType Autocapitalization(NSString *value)
{
  if ([value isEqualToString:@"none"]) {
    return UITextAutocapitalizationTypeNone;
  }
  if ([value isEqualToString:@"words"]) {
    return UITextAutocapitalizationTypeWords;
  }
  if ([value isEqualToString:@"characters"]) {
    return UITextAutocapitalizationTypeAllCharacters;
  }
  return UITextAutocapitalizationTypeSentences;
}

/** An alert in the given tint and style, or nil (rejected) when nothing can present it. */
static UIAlertController *MakeAlert(
    NSString *title,
    NSString *message,
    std::optional<double> tintColor,
    NSString *userInterfaceStyle,
    RCTPromiseRejectBlock reject)
{
  if (RCTPresentedViewController() == nil) {
    reject(@"E_NO_PRESENTER", @"No view controller to present the alert on", nil);
    return nil;
  }
  UIAlertController *alert =
      [UIAlertController alertControllerWithTitle:title
                                          message:message
                                   preferredStyle:UIAlertControllerStyleAlert];
  if (tintColor.has_value()) {
    alert.view.tintColor = [RCTConvert UIColor:@(tintColor.value())];
  }
  alert.overrideUserInterfaceStyle = InterfaceStyle(userInterfaceStyle);
  return alert;
}

/**
 * iOS 26 fills the preferred action with the tint under a white label, unreadable on a
 * light tint (typically in dark mode). There the label turns black while the action is
 * enabled. No public API sets it; without the private key it stays white.
 */
static BOOL NeedsDarkPreferredLabel(UIAlertController *alert)
{
  if (@available(iOS 26, *)) {
    UITraitCollection *traits = alert.overrideUserInterfaceStyle == UIUserInterfaceStyleUnspecified
        ? RCTPresentedViewController().traitCollection
        : [UITraitCollection traitCollectionWithUserInterfaceStyle:alert.overrideUserInterfaceStyle];
    UIColor *tint = [alert.view.tintColor resolvedColorWithTraitCollection:traits];
    CGFloat red = 0, green = 0, blue = 0, alpha = 0;
    if (![tint getRed:&red green:&green blue:&blue alpha:&alpha]) {
      return NO;
    }
    return 0.299 * red + 0.587 * green + 0.114 * blue > 0.6;
  }
  return NO;
}

static void UpdatePreferredLabel(UIAlertAction *action)
{
  @try {
    // Disabled, no override: iOS's own dimmed label over the unfilled button.
    [action setValue:(action.enabled ? UIColor.blackColor : nil) forKey:@"titleTextColor"];
  } @catch (NSException *exception) {
    RCTLogWarn(@"[RNAlert] No titleTextColor on UIAlertAction: %@", exception.reason);
  }
}

static UIAlertActionStyle ActionStyle(NSString *style)
{
  if ([style isEqualToString:@"cancel"]) {
    return UIAlertActionStyleCancel;
  }
  if ([style isEqualToString:@"destructive"]) {
    return UIAlertActionStyleDestructive;
  }
  return UIAlertActionStyleDefault;
}

- (void)alert:(JS::NativeRNAlert::AlertOptions &)options
      resolve:(RCTPromiseResolveBlock)resolve
       reject:(RCTPromiseRejectBlock)reject
{
  UIAlertController *alert = MakeAlert(
      options.title(), options.message(), options.tintColor(), options.userInterfaceStyle(), reject);
  if (alert == nil) {
    return;
  }

  // UIAlertController allows one cancel action: like RN, later ones become default.
  BOOL hasCancel = NO;
  NSInteger index = 0;
  for (const auto &button : options.buttons()) {
    UIAlertActionStyle style = ActionStyle(button.style());
    if (style == UIAlertActionStyleCancel) {
      if (hasCancel) {
        style = UIAlertActionStyleDefault;
      }
      hasCancel = YES;
    }
    NSInteger pressed = index++;
    UIAlertAction *action = [UIAlertAction actionWithTitle:button.text()
                                                     style:style
                                                   handler:^(UIAlertAction *a) {
                                                     resolve(@(pressed));
                                                   }];
    [alert addAction:action];
    if (button.isPreferred()) {
      alert.preferredAction = action;
    }
  }

  if (alert.preferredAction != nil && NeedsDarkPreferredLabel(alert)) {
    UpdatePreferredLabel(alert.preferredAction);
  }
  [RCTPresentedViewController() presentViewController:alert animated:YES completion:nil];
}

- (void)prompt:(JS::NativeRNAlert::PromptOptions &)options
       resolve:(RCTPromiseResolveBlock)resolve
        reject:(RCTPromiseRejectBlock)reject
{
  UIAlertController *alert = MakeAlert(
      options.title(), options.message(), options.tintColor(), options.userInterfaceStyle(), reject);
  if (alert == nil) {
    return;
  }

  NSString *defaultValue = options.defaultValue();
  UITextAutocapitalizationType autocapitalization = Autocapitalization(options.autoCapitalize());
  [alert addTextFieldWithConfigurationHandler:^(UITextField *field) {
    field.text = defaultValue;
    field.autocapitalizationType = autocapitalization;
    field.clearButtonMode = UITextFieldViewModeWhileEditing;
    field.returnKeyType = UIReturnKeyDone;
  }];
  UITextField *field = alert.textFields.firstObject;
  __weak UITextField *weakField = field;

  __block BOOL settled = NO;
  void (^settle)(BOOL) = ^(BOOL confirmed) {
    if (!settled) {
      settled = YES;
      resolve(@{@"confirmed" : @(confirmed), @"text" : weakField.text ?: @""});
    }
  };
  [alert addAction:[UIAlertAction actionWithTitle:options.cancelText()
                                            style:UIAlertActionStyleCancel
                                          handler:^(UIAlertAction *action) {
                                            settle(NO);
                                          }]];
  UIAlertAction *confirm = [UIAlertAction actionWithTitle:options.confirmText()
                                                    style:UIAlertActionStyleDefault
                                                  handler:^(UIAlertAction *action) {
                                                    settle(YES);
                                                  }];
  [alert addAction:confirm];
  alert.preferredAction = confirm;
  BOOL darkLabel = NeedsDarkPreferredLabel(alert);

  // Nothing to confirm while the field is blank.
  __weak UIAlertAction *weakConfirm = confirm;
  void (^updateConfirm)(NSString *) = ^(NSString *text) {
    UIAlertAction *action = weakConfirm;
    action.enabled = !IsBlank(text);
    if (darkLabel) {
      UpdatePreferredLabel(action);
    }
  };
  updateConfirm(defaultValue);
  [field addAction:[UIAction actionWithHandler:^(UIAction *action) {
           updateConfirm(weakField.text);
         }]
      forControlEvents:UIControlEventEditingChanged];

  // Left to the alert, Return on a blank field (confirm disabled) dismisses it without
  // running either action, and the prompt would never settle: Return confirms or does nothing.
  RNAlertFieldDelegate *fieldDelegate = [RNAlertFieldDelegate new];
  __weak UIAlertController *weakAlert = alert;
  fieldDelegate.onReturn = ^{
    if (weakConfirm.enabled) {
      [weakAlert dismissViewControllerAnimated:YES completion:nil];
      settle(YES);
    }
  };
  field.delegate = fieldDelegate;
  // The field holds its delegate weakly: the alert keeps it alive.
  objc_setAssociatedObject(
      alert, @selector(textFieldShouldReturn:), fieldDelegate, OBJC_ASSOCIATION_RETAIN_NONATOMIC);

  [RCTPresentedViewController() presentViewController:alert animated:YES completion:nil];
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeRNAlertSpecJSI>(params);
}

@end
