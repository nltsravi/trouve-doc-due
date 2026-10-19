const fs = require('fs');
const path = require('path');

function patchTopicSubscription() {
  const file = path.join(__dirname, '..', 'node_modules', 'expo-notifications', 'build', 'TopicSubscriptionModule.android.js');
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes("export default requireNativeModule('ExpoTopicSubscriptionModule');")) {
      content = content.replace(
        "import { requireNativeModule } from 'expo';\nexport default requireNativeModule('ExpoTopicSubscriptionModule');",
        "import { requireOptionalNativeModule } from 'expo';\nconst nativeModule = requireOptionalNativeModule('ExpoTopicSubscriptionModule');\nexport default nativeModule ?? {\n  addListener: () => {},\n  removeListeners: () => {},\n  subscribeToTopicAsync: () => Promise.resolve(null),\n  unsubscribeFromTopicAsync: () => Promise.resolve(null),\n};"
      );
      fs.writeFileSync(file, content, 'utf8');
      console.log('✓ Patched expo-notifications TopicSubscriptionModule.android.js for Expo Go compatibility.');
    }
  }
}

function patchMLKitRecognition() {
  const file = path.join(__dirname, '..', 'node_modules', '@infinitered', 'react-native-mlkit-text-recognition', 'build', 'RNMLKitTextRecognitionModule.js');
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes('const textRecognitionModule = (0, expo_1.requireNativeModule)("RNMLKitTextRecognition");')) {
      content = content.replace(
        'const textRecognitionModule = (0, expo_1.requireNativeModule)("RNMLKitTextRecognition");\nasync function recognizeText(imagePath) {\n    return await textRecognitionModule.recognizeText(imagePath);\n}',
        'let textRecognitionModule = null;\nasync function recognizeText(imagePath) {\n    if (!textRecognitionModule) {\n        textRecognitionModule = (0, expo_1.requireOptionalNativeModule)("RNMLKitTextRecognition");\n    }\n    if (!textRecognitionModule) {\n        throw new Error("RNMLKitTextRecognition native module is not available in Expo Go. Please use a development build (npx expo run:android or npx expo run:ios) to scan photos.");\n    }\n    return await textRecognitionModule.recognizeText(imagePath);\n}'
      );
      fs.writeFileSync(file, content, 'utf8');
      console.log('✓ Patched @infinitered/react-native-mlkit-text-recognition for Expo Go lazy loading.');
    }
  }
}

patchTopicSubscription();
patchMLKitRecognition();
