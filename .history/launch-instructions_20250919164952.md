# 🚀 VIDAVA AI Extension Launch Instructions

## Quick Start Guide

### 1. Install the Extension

1. **Open Chrome** and navigate to `chrome://extensions/`
2. **Enable Developer Mode** (toggle switch in top-right corner)
3. **Click "Load unpacked"**
4. **Select the `client` folder** from your VIDAVA_AI directory
5. **Pin the extension** to your toolbar (click the puzzle piece icon, then pin VIDAVA AI)

### 2. Test the Extension

1. **Open the test page**: Open `test-extension.html` in Chrome
2. **Check extension status**: Click "Check Extension Status" button
3. **Test popup**: Click the VIDAVA AI icon in your toolbar
4. **Try recommendations**: Use the test page to simulate different website types

### 3. Extension Features to Test

#### Popup Interface
- Click the VIDAVA AI icon in your toolbar
- Try the quick recommendation feature
- Add demo credit cards
- Test the dashboard

#### Website Detection
- Use the test page to simulate different website types
- Check if the extension detects the simulated categories
- Test the floating recommendation button (if visible)

#### Local Storage
- Add cards and check if they persist after closing/reopening
- Test the ML model with synthetic data

### 4. Troubleshooting

#### Extension Not Loading
- Make sure you selected the `client` folder (not the root folder)
- Check that Developer Mode is enabled
- Try refreshing the extensions page

#### Popup Not Working
- Check browser console for errors (F12 → Console)
- Make sure all files are in the correct locations
- Verify manifest.json is valid

#### ML Model Issues
- Check if TensorFlow.js is loading (should see network requests)
- Verify the ml/tensorflow-model.js file is accessible
- Check console for TensorFlow-related errors

### 5. File Structure Check

Make sure your `client` folder contains:
```
client/
├── manifest.json
├── popup.html
├── popup.js
├── popup.css
├── background.js
├── content-script.js
├── logo.png
├── ml/
│   └── tensorflow-model.js
├── storage/
│   └── localStorage.js
└── dashboard.html (optional)
```

### 6. Testing Checklist

- [ ] Extension loads without errors
- [ ] Popup opens when clicking extension icon
- [ ] Can add demo credit cards
- [ ] Quick recommendation feature works
- [ ] Local storage persists data
- [ ] ML model initializes (check console)
- [ ] Test page detects extension
- [ ] No console errors

### 7. Demo Data

The extension comes with:
- Sample credit cards (Chase Sapphire Preferred, Freedom Unlimited, etc.)
- Synthetic training data for the ML model
- Demo user profile
- Sample transaction categories

### 8. Next Steps

Once everything is working:
1. Try adding different credit cards
2. Test recommendations with various amounts and categories
3. Check the spending analysis features
4. Explore the full dashboard (if implemented)

## Support

If you encounter issues:
1. Check the browser console for errors
2. Verify all files are in the correct locations
3. Make sure you're using Chrome (other browsers may have different extension APIs)
4. Try reloading the extension in chrome://extensions/

Happy testing! 🎉
