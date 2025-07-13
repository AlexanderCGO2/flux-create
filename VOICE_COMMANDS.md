# Voice Commands & Automatic Speech Detection

## 🎤 New Voice Experience

**FluxCreate now features automatic Voice Activity Detection (VAD)!**

### How It Works

1. **Click the microphone button once** - This activates "listening mode"
2. **Speak naturally** - The system automatically detects when you start speaking and begins recording
3. **Stop talking** - When you finish speaking, the system automatically stops recording and processes your command
4. **Get feedback** - The system responds with confirmation and executes your command

### Visual Indicators

- **🔇 Gray microphone** - Voice control ready, click to start
- **🔊 Green pulsing speaker** - Listening for speech (waiting for you to speak)
- **🔴 Red microphone with ping** - Recording your speech
- **⏳ Blue spinner** - Processing your command

## 🎯 Voice Commands

### Mode Switching (3 commands)
- "Switch to create mode" - Switch to image creation mode
- "Switch to edit mode" - Switch to image editing mode  
- "Switch to filter mode" - Switch to filter application mode

### App Controls (2 commands)
- "Set transparency to [1-100]" - Adjust app background transparency
- "Set background to [color]" - Change app background color

### Image Generation (5 commands)
- "Generate [description]" - Create new image with AI
- "Upload image" - Open file dialog to upload image
- "Start webcam" / "Open camera" - Activate webcam for capture
- "Save project" - Save current work
- "Export as [format]" - Export image (PNG, JPG, etc.)

### Filter Operations (12 commands)
- "Apply blur [slight/moderate/strong]" - Apply blur effect
- "Set brightness to [0-100]" - Adjust image brightness
- "Increase/decrease brightness" - Relative brightness adjustment
- "Set contrast to [0-100]" - Adjust image contrast
- "Increase/decrease contrast" - Relative contrast adjustment
- "Set saturation to [0-100]" - Adjust color saturation
- "Increase/decrease saturation" - Relative saturation adjustment
- "Apply vintage filter" - Apply vintage effect
- "Apply sepia filter" - Apply sepia tone
- "Make it grayscale" - Convert to black and white
- "Invert colors" - Invert image colors
- "Apply noir filter" - Apply noir effect

### Transform Operations (8 commands)
- "Zoom in/out" - Adjust zoom level
- "Rotate left/right [degrees]" - Rotate image by specified degrees
- "Flip horizontal" - Mirror image horizontally
- "Flip vertical" - Mirror image vertically
- "Resize to [width] by [height]" - Resize image dimensions
- "Reset zoom" - Return to original size
- "Reset rotation" - Return to original orientation
- "Fit to screen" - Adjust size to fit viewport

### Edit/Canvas Operations (7 commands)
- "Edit [description]" - AI-powered image editing
- "Remove background" - Automatically remove image background
- "Clear canvas" - Clear the current canvas
- "Undo" - Undo last action
- "Redo" - Redo last undone action
- "Reset image" - Return to original state
- "New project" - Start fresh canvas

## 🎵 Natural Language Examples

The system understands natural speech patterns:

### Command Mode Examples
- "Make it brighter" → Increases brightness
- "Can you blur this a bit?" → Applies moderate blur
- "I want vintage look" → Applies vintage filter
- "Turn left 45 degrees" → Rotates left 45°
- "Remove the background please" → Removes background
- "Make the app more transparent" → Increases transparency

### Conversation Mode Examples
- "How do I make this photo look vintage?"
- "What filters would work well for this sunset?"
- "Can you help me adjust the colors?"
- "Explain what blur does to an image"

## ⚙️ Settings & Tips

### Voice Settings
- **Microphone Sensitivity**: Automatically calibrated
- **Speech Detection**: 300ms minimum speech duration
- **Silence Detection**: 1.5 seconds of silence ends recording
- **Timeout**: 5 minutes maximum listening session

### Best Practices
1. **Speak clearly** - Enunciate your words
2. **Wait for visual feedback** - Look for the green listening indicator
3. **Use natural language** - "Make it brighter" works as well as "Increase brightness"
4. **Be specific with numbers** - "Set brightness to 75" vs "Make it brighter"
5. **Wait between commands** - Let one command finish before the next

### Troubleshooting

#### "Not listening"
- Check microphone permissions in browser
- Click the microphone button to start listening
- Look for green pulsing speaker icon

#### "Recording but not processing"
- Speak for at least 300ms
- Wait 1.5 seconds of silence for auto-stop
- Ensure clear speech without background noise

#### "Command not recognized"
- Try rephrasing the command
- Use examples from this guide
- Check if command is supported in current mode

#### "Voice service error"
- Check internet connection
- Verify OpenAI API key is configured
- Try the "Test API" button for diagnostics

## 🔧 Technical Notes

### Voice Activity Detection (VAD)
- Uses Web Audio API for real-time audio analysis
- Configurable threshold for speech detection
- Automatic noise suppression and echo cancellation
- 50ms audio level monitoring intervals

### Audio Processing
- 16kHz sample rate for optimal quality
- Echo cancellation enabled
- Noise suppression active
- Auto gain control

### Privacy & Security
- Audio processed locally until command execution
- No audio stored permanently
- OpenAI API used only for speech-to-text conversion
- Microphone access controlled by browser permissions

## 🚀 Quick Start

1. **Allow microphone access** when prompted
2. **Click the microphone button** - you'll see a green pulsing speaker
3. **Say a command** like "Make it brighter" - you'll see the red recording indicator
4. **Stop talking** - the system automatically processes your command
5. **See the result** - command is executed and confirmed

The new voice system makes FluxCreate much more intuitive - just click once and speak naturally! 