import React, { useState, useEffect, useRef } from 'react';
import phraseSets from '../data/phraseSets.json';

interface PhraseSet {
  name: string;
  phrases: string[];
}

// Map special characters to their typing equivalents
const specialCharMap: Record<string, string> = {
  '₂': '2',  // Map subscript 2 to regular 2
  '₃': '3',  // Subscript 3 to regular 3
  '₄': '4',  // Subscript 4 to regular 4
  '₁': '1',  // Subscript 1 to regular 1
  '–': '-',  // En dash to hyphen
  '—': '-',  // Em dash to hyphen
  '°': 'o',  // Degree symbol to 'o'
  '≥': '>',  // Greater than or equal to '>'
  '≤': '<',  // Less than or equal to '<'
  '±': '+',  // Plus-minus to plus
  '×': 'x',  // Multiplication symbol to 'x'
  'μ': 'u',  // Micro symbol to 'u'
  '™': '',   // Trademark to empty (ignore when typing)
  '®': '',   // Registered trademark to empty
  '©': '',   // Copyright to empty
  // We can't have duplicate keys for different quote styles, 
  // so we'll leave just the basic ones that we need
};

const TypingGame = () => {
  // State declarations
  const [availableSets, setAvailableSets] = useState<Record<string, PhraseSet>>(phraseSets);
  const [currentSetKey, setCurrentSetKey] = useState<string>("familySet");
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState<number>(0);
  const [displayPhrase, setDisplayPhrase] = useState<string>("");
  const [typingPhrase, setTypingPhrase] = useState<string>("");
  const [userInput, setUserInput] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [customPhrase, setCustomPhrase] = useState("");
  const [showKeyboard, setShowKeyboard] = useState<boolean>(() => {
    const saved = localStorage.getItem('typing-game-showKeyboard');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [previousTime, setPreviousTime] = useState<number | null>(null);
  const [showSpaceCharacter, setShowSpaceCharacter] = useState<boolean>(() => {
    const saved = localStorage.getItem('typing-game-showSpaceCharacter');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [enableKeyTTS, setEnableKeyTTS] = useState<boolean>(() => {
    const saved = localStorage.getItem('typing-game-enableKeyTTS');
    return saved !== null ? JSON.parse(saved) : true;
  });
  
  // Refs with proper typing
  const inputRef = useRef<HTMLInputElement>(null);
  const keyboardRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);

  // Setup typing phrase by mapping special characters to their typing equivalents
  const setupPhrase = (originalPhrase: string): { display: string, typing: string } => {
    let typingVersion = originalPhrase;
    
    // Replace special characters with their typing equivalents
    Object.entries(specialCharMap).forEach(([display, typing]) => {
      typingVersion = typingVersion.replace(new RegExp(display, 'g'), typing);
    });
    
    return { 
      display: originalPhrase,
      typing: typingVersion
    };
  };

  // Initialize with the first phrase from the selected set
  useEffect(() => {
    if (availableSets && currentSetKey && availableSets[currentSetKey]) {
      const currentSet = availableSets[currentSetKey];
      if (currentSet.phrases.length > 0) {
        const phraseData = setupPhrase(currentSet.phrases[currentPhraseIndex]);
        setDisplayPhrase(phraseData.display);
        setTypingPhrase(phraseData.typing);
      }
    }
  }, [availableSets, currentSetKey, currentPhraseIndex]);

  // Enhanced keyboard layout configuration with symbols
  const keyboardLayout = [
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "="],
    ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "[", "]"],
    ["a", "s", "d", "f", "g", "h", "j", "k", "l", ";", "'"],
    ["z", "x", "c", "v", "b", "n", "m", ",", ".", "/"],
    [" "] // Space key
  ];

  // Additional shift symbols for reference (not shown in keyboard layout)
  const shiftSymbols: Record<string, string> = {
    "1": "!", "2": "@", "3": "#", "4": "$", "5": "%",
    "6": "^", "7": "&", "8": "*", "9": "(", "0": ")",
    "-": "_", "=": "+", ";": ":", "'": "\"", ",": "<",
    ".": ">", "/": "?", "[": "{", "]": "}"
  };

  // Helper function to get the current word and its remaining letters
  const getCurrentWordInfo = () => {
    // If we're at the end of the phrase, return empty arrays
    if (currentIndex >= typingPhrase.length) return { currentWord: "", remainingLetters: [] };
    
    // Find word boundaries
    let wordStart = currentIndex;
    let wordEnd = currentIndex;
    
    // Find the start of the current word (going backwards)
    while (wordStart > 0 && typingPhrase[wordStart - 1] !== " ") {
      wordStart--;
    }
    
    // Find the end of the current word (going forwards)
    while (wordEnd < typingPhrase.length && typingPhrase[wordEnd] !== " ") {
      wordEnd++;
    }
    
    // Extract the current word and remaining letters (case preserved)
    const currentWord = typingPhrase.substring(wordStart, wordEnd);
    const remainingLetters = currentIndex < wordEnd 
      ? typingPhrase.substring(currentIndex + 1, wordEnd).split("") 
      : [];
    
    return { currentWord, remainingLetters };
  };

  // Move to the next phrase in the current set
  const goToNextPhrase = () => {
    const currentSet = availableSets[currentSetKey];
    if (currentSet) {
      const nextPhraseIndex = (currentPhraseIndex + 1) % currentSet.phrases.length;
      setCurrentPhraseIndex(nextPhraseIndex);
      setUserInput("");
      setCurrentIndex(0);
      setStartTime(null);
      setElapsedTime(0);
      setIsTimerRunning(false);
      setPreviousTime(null);
    }
  };

  // Move to the previous phrase in the current set
  const goToPrevPhrase = () => {
    const currentSet = availableSets[currentSetKey];
    if (currentSet) {
      // Calculate previous index with wraparound
      const prevPhraseIndex = (currentPhraseIndex - 1 + currentSet.phrases.length) % currentSet.phrases.length;
      setCurrentPhraseIndex(prevPhraseIndex);
      setUserInput("");
      setCurrentIndex(0);
      setStartTime(null);
      setElapsedTime(0);
      setIsTimerRunning(false);
      setPreviousTime(null);
    }
  };

  // Effect hooks
  useEffect(() => {
    // Focus the input field when component mounts
    if (inputRef.current) {
      inputRef.current.focus();
    }
    
    // Load previous time from localStorage
    const savedTime = localStorage.getItem(`typingTime-${typingPhrase}`);
    if (savedTime) {
      setPreviousTime(parseInt(savedTime, 10));
    } else {
      setPreviousTime(null);
    }
  }, [typingPhrase]);

  // Event handlers to prevent propagation when clicking form elements
  const handleFormElementClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  useEffect(() => {
    // Scroll to make sure the keyboard is visible
    if (keyboardRef.current) {
      keyboardRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [currentIndex]);

  // Timer effect
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = window.setInterval(() => {
        if (startTime) {
          const current = Date.now();
          const elapsed = Math.floor((current - startTime) / 1000);
          setElapsedTime(elapsed);
        }
      }, 100);
    } else if (timerRef.current) {
      window.clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
    };
  }, [isTimerRunning, startTime]);

  // Event handlers
  const handleContainerClick = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    const char = event.key;
    
    // Start timer on first key press
    if (currentIndex === 0 && !startTime) {
      setStartTime(Date.now());
      setIsTimerRunning(true);
    }
    
    // Case-insensitive character comparison
    const expectedChar = typingPhrase[currentIndex];
    const isMatch = char.toLowerCase() === expectedChar.toLowerCase();
    
    // Only process if the character matches the expected one (case-insensitive)
    if (isMatch) {
      // Play sound for the correct key if TTS is enabled for keypresses
      if (enableKeyTTS) {
        speakLetter(char);
      }
      
      // Update user input with the original character from the phrase (preserves case)
      const newUserInput = userInput + expectedChar;
      setUserInput(newUserInput);
      
      // Update current index
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      
      // Check if typing is complete
      if (newIndex === typingPhrase.length) {
        // Stop timer
        setIsTimerRunning(false);
        
        // Calculate final time
        const finalTime = elapsedTime;
        
        // Check if there was a previous attempt
        let timeDifference: number | null = null;
        if (previousTime !== null) {
          timeDifference = previousTime - finalTime;
        }
        
        // Save current time to localStorage
        localStorage.setItem(`typingTime-${typingPhrase}`, finalTime.toString());
        
        // Announce completion with time information
        if (timeDifference !== null) {
          const improvementText = timeDifference > 0 
            ? `You were ${Math.abs(timeDifference)} seconds faster!` 
            : timeDifference < 0 
              ? `You were ${Math.abs(timeDifference)} seconds slower.` 
              : `You matched your previous time exactly!`;
              
          speakPhrase(`Great job! You finished in ${finalTime} seconds. ${improvementText}`);
        } else {
          speakPhrase(`Great job! You finished in ${finalTime} seconds. That's your first attempt with this phrase.`);
        }
        
        // Automatically move to the next phrase after a delay
        setTimeout(() => {
          goToNextPhrase();
        }, 3000);
      }
    }
  };

  const handlePhraseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customPhrase.trim()) {
      const phraseData = setupPhrase(customPhrase.trim());
      setDisplayPhrase(phraseData.display);
      setTypingPhrase(phraseData.typing);
      setUserInput("");
      setCurrentIndex(0);
      setCustomPhrase("");
      setStartTime(null);
      setElapsedTime(0);
      setIsTimerRunning(false);
      
      // Load previous time for the new phrase
      const savedTime = localStorage.getItem(`typingTime-${phraseData.typing}`);
      if (savedTime) {
        setPreviousTime(parseInt(savedTime, 10));
      } else {
        setPreviousTime(null);
      }
      
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const handleSetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSetKey = e.target.value;
    setCurrentSetKey(newSetKey);
    setCurrentPhraseIndex(0);
    setUserInput("");
    setCurrentIndex(0);
    setStartTime(null);
    setElapsedTime(0);
    setIsTimerRunning(false);
  };

  // Helper functions
  const speakLetter = (letter: string) => {
    // Use browser TTS to speak the letter after it's pressed
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Clear any previous speech
      
      const utterance = new SpeechSynthesisUtterance(letter === " " ? "space" : letter);
      utterance.rate = 1.0;
      utterance.pitch = 1.2;
      utterance.volume = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const speakPhrase = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.volume = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const findKeyPosition = (char: string) => {
    // Convert to lowercase for keyboard lookup, since keyboard is all lowercase
    const lowerChar = char.toLowerCase();
    
    // First try to find the character directly in the keyboard layout
    for (let rowIndex = 0; rowIndex < keyboardLayout.length; rowIndex++) {
      const keyIndex = keyboardLayout[rowIndex].indexOf(lowerChar);
      if (keyIndex !== -1) {
        return { rowIndex, keyIndex };
      }
    }
    
    // If not found, check if it's a shift symbol and find its base key
    const shiftSymbolEntries = Object.entries(shiftSymbols);
    for (const [baseKey, shiftSymbol] of shiftSymbolEntries) {
      if (shiftSymbol === char) {
        // If this is a shift symbol, find the position of its base key
        for (let rowIndex = 0; rowIndex < keyboardLayout.length; rowIndex++) {
          const keyIndex = keyboardLayout[rowIndex].indexOf(baseKey);
          if (keyIndex !== -1) {
            return { rowIndex, keyIndex };
          }
        }
      }
    }
    
    return null;
  };

  // Get the next character to type
  const nextChar = currentIndex < typingPhrase.length ? typingPhrase[currentIndex] : null;
  const keyPosition = nextChar ? findKeyPosition(nextChar) : null;

  // Get information about the current word being typed
  const { remainingLetters } = getCurrentWordInfo();

  // Format time as mm:ss
  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Display current set and phrase information
  const currentSet = availableSets[currentSetKey];
  const phraseInfo = currentSet ? 
    `${currentSet.name} (${currentPhraseIndex + 1}/${currentSet.phrases.length})` : 
    "Custom Phrase";

  // Render the keyboard with proper key offsets
  const renderKeyboard = () => {
    // Adjust the unit size for proper proportions
    // Key width (48px) + horizontal gap (4px total = 2px on each side)
    const keyUnit = 52; // 1u = 52px
    
    // Function to render a single key
    const renderKey = (key: string, rowIndex: number, keyIndex: number) => {
      const isActive = keyPosition && keyPosition.rowIndex === rowIndex && keyPosition.keyIndex === keyIndex;
      const isUpcoming = remainingLetters.includes(key);
      
      // Check if shift version is active or upcoming
      const shiftVersion = shiftSymbols[key];
      const isShiftActive = nextChar === shiftVersion;
      const isShiftUpcoming = remainingLetters.includes(shiftVersion);
      
      const getKeyWidth = () => {
        // Make space bar wider
        if (key === " ") return "w-64"; 
        return "w-12"; // Standard key width
      };
      
      // For key display - show uppercase for letters
      const keyDisplay = key.match(/[a-z]/) ? key.toUpperCase() : key;
      
      return (
        <div
          key={keyIndex}
          className={`
            ${getKeyWidth()}
            h-12
            flex
            items-center
            justify-center
            mx-0.5
            rounded-lg
            text-xl
            font-bold
            border
            relative
            ${isActive || isShiftActive
              ? "bg-blue-400 text-white border-blue-500" 
              : isUpcoming || isShiftUpcoming
                ? "bg-blue-50 text-gray-700 border-gray-200"
                : "bg-white text-gray-700 border-gray-200"}
            transition-all
            duration-100
          `}
          style={{ 
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1)',
            borderRadius: '6px',
            height: '48px',
            backgroundImage: isActive || isShiftActive
              ? 'linear-gradient(to bottom, #60a5fa, #3b82f6)'
              : isUpcoming || isShiftUpcoming
                ? 'linear-gradient(to bottom, #eff6ff, #dbeafe)'
                : 'linear-gradient(to bottom, #ffffff, #f8fafc)'
          }}
        >
          {/* For number keys and symbol keys, show both characters */}
          {shiftVersion ? (
            <div className="flex flex-col items-center justify-center w-full h-full">
              <div className={`text-xs ${isShiftActive ? "text-white font-bold" : "text-gray-500"}`}>
                {shiftVersion}
              </div>
              <div className={`text-base ${isActive ? "text-white font-bold" : ""}`}>
                {keyDisplay}
              </div>
            </div>
          ) : (
            // For letter keys, just show the letter
            <div>{keyDisplay}</div>
          )}
          
          {/* Nubs for F and J keys */}
          {(key === 'f' || key === 'j') && (
            <div 
              className="absolute bottom-1.5 w-2 h-1 bg-gray-500 rounded-sm" 
              style={{ width: '8px', height: '2px' }}
            ></div>
          )}
        </div>
      );
    };
    
    return (
      <div className="mx-auto" style={{ width: 'fit-content' }}>
        {/* Number row - Row 0 */}
        <div className="flex mb-1">
          {keyboardLayout[0].map((key, keyIndex) => renderKey(key, 0, keyIndex))}
        </div>
        
        {/* QWERTY row - Row 1 */}
        <div className="flex mb-1" style={{ marginLeft: `${keyUnit * 0.5}px` }}>
          {keyboardLayout[1].map((key, keyIndex) => renderKey(key, 1, keyIndex))}
        </div>
        
        {/* ASDF row - Row 2 */}
        <div className="flex mb-1" style={{ marginLeft: `${keyUnit * 0.75}px` }}>
          {keyboardLayout[2].map((key, keyIndex) => renderKey(key, 2, keyIndex))}
        </div>
        
        {/* ZXCV row - Row 3 */}
        <div className="flex mb-1" style={{ marginLeft: `${keyUnit * 1.25}px` }}>
          {keyboardLayout[3].map((key, keyIndex) => renderKey(key, 3, keyIndex))}
        </div>
        
        {/* Space bar row - Row 4 - Aligned with C key (index 2) in row 3 */}
        <div className="flex">
          <div className="mx-auto" style={{ marginLeft: `${keyUnit * 3.25}px` }}>
            {renderKey(" ", 4, 0)}
          </div>
        </div>
      </div>
    );
  };

  // Save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem('typing-game-showSpaceCharacter', JSON.stringify(showSpaceCharacter));
  }, [showSpaceCharacter]);

  useEffect(() => {
    localStorage.setItem('typing-game-enableKeyTTS', JSON.stringify(enableKeyTTS));
  }, [enableKeyTTS]);

  useEffect(() => {
    localStorage.setItem('typing-game-showKeyboard', JSON.stringify(showKeyboard));
  }, [showKeyboard]);

  // Render component
  return (
    <div className="flex flex-col items-center bg-blue-50 min-h-screen w-full h-full absolute top-0 left-0 p-4" onClick={handleContainerClick}>
      
      {/* Parent input to capture keypresses */}
      <input
        ref={inputRef}
        type="text"
        className="opacity-0 absolute"
        onKeyDown={handleKeyPress}
        autoFocus
      />
      
      {/* Display area */}
      <div className="w-full max-w-3xl p-6 bg-white rounded-lg shadow-md mb-4">
        <div className="flex justify-between items-center mb-2">
          <div className="text-gray-700 font-bold">
            Time: <span className="text-blue-600">{formatTime(elapsedTime)}</span>
          </div>
          {previousTime !== null && (
            <div className="text-gray-700 font-bold">
              Previous: <span className="text-green-600">{formatTime(previousTime)}</span>
            </div>
          )}
        </div>
        
        <div className="mb-4">
          <div className="text-sm text-gray-600 mb-1">{phraseInfo}</div>
          <div className="p-3 bg-yellow-50 rounded text-xl font-medium tracking-wide" style={{ wordBreak: 'keep-all', overflowWrap: 'break-word' }}>
            {(() => {
              // Group the phrase into words to control space wrapping behavior
              const words = displayPhrase.split(' ');
              let charIndex = 0;
              
              return words.map((word, wordIndex) => {
                // Create an array of character elements for this word
                const wordCharElements = word.split('').map((char, i) => {
                  const index = charIndex + i;
                  return (
                    <span
                      key={`char-${index}`}
                      className={`
                        ${index === currentIndex ? 'bg-blue-200 text-blue-700 rounded inline-block' : 'inline-block'}
                        ${index < currentIndex ? 'text-green-600' : 'text-gray-800'}
                      `}
                      style={{
                        display: 'inline-block',
                        whiteSpace: 'pre',
                      }}
                    >
                      {char}
                    </span>
                  );
                });
                
                // Add space after word (except for the last word)
                const hasSpace = wordIndex < words.length - 1;
                const spaceIndex = charIndex + word.length;
                
                // Update charIndex for next word
                charIndex += word.length + (hasSpace ? 1 : 0);
                
                // Return word plus space as a group
                return (
                  <span key={`word-${wordIndex}`} className="inline-flex flex-wrap" style={{ hyphens: 'none' }}>
                    {/* The word characters */}
                    {wordCharElements}
                    
                    {/* The space after the word (if not the last word) */}
                    {hasSpace && (
                      <span
                        key={`space-${spaceIndex}`}
                        className={`
                          ${spaceIndex === currentIndex ? 'bg-blue-200 text-blue-700 rounded inline-block' : 'inline-block'}
                          ${spaceIndex < currentIndex ? 'text-green-600' : 'text-gray-800'}
                        `}
                        style={{
                          display: 'inline-block',
                          ...(showSpaceCharacter ? {} : { marginRight: '0.25em' })
                        }}
                      >
                        {showSpaceCharacter ? "⎵" : ""}
                      </span>
                    )}
                  </span>
                );
              });
            })()}
          </div>
        </div>
        
        {/* Progress indicator */}
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div 
            className="bg-green-500 h-4 rounded-full transition-all duration-300"
            style={{ width: `${(currentIndex / typingPhrase.length) * 100}%` }}
          ></div>
        </div>
      </div>
      
      {/* Set selector with prev/next navigation */}
      <div className="w-full max-w-3xl p-4 bg-white rounded-lg shadow-md mb-4">
        <div className="flex flex-col sm:flex-row items-center gap-2" onClick={handleFormElementClick}>
          <label htmlFor="set-selector" className="text-gray-700 font-medium">
            Select Phrase Set:
          </label>
          <select
            id="set-selector"
            value={currentSetKey}
            onChange={handleSetChange}
            className="p-2 flex-grow border-2 border-gray-300 rounded"
            onClick={handleFormElementClick}
          >
            {Object.entries(availableSets).map(([key, set]) => (
              <option key={key} value={key}>
                {set.name}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={goToPrevPhrase}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={goToNextPhrase}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Keyboard display */}
      {showKeyboard && (
        <div 
          ref={keyboardRef}
          className="mb-4 bg-gray-100 p-4 rounded-lg shadow-lg w-full max-w-3xl overflow-x-auto"
        >
          {renderKeyboard()}
        </div>
      )}
      
      {/* Settings panel - moved below keyboard */}
      <div className="w-full max-w-3xl p-4 bg-white rounded-lg shadow-md mb-4">
        <h3 className="text-lg font-medium text-gray-700 mb-3">Settings</h3>
        <div className="flex flex-wrap gap-4 justify-start">
          <div className="flex items-center">
            <label htmlFor="toggle-space" className="mr-2 text-sm text-gray-700">
              Show Space Character:
            </label>
            <div 
              className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer ${
                showSpaceCharacter ? 'bg-blue-500 justify-end' : 'bg-gray-300 justify-start'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                setShowSpaceCharacter(!showSpaceCharacter);
              }}
              id="toggle-space"
            >
              <div className="bg-white w-4 h-4 rounded-full shadow-md"></div>
            </div>
          </div>
          
          <div className="flex items-center">
            <label htmlFor="toggle-tts" className="mr-2 text-sm text-gray-700">
              Letter Sound:
            </label>
            <div 
              className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer ${
                enableKeyTTS ? 'bg-blue-500 justify-end' : 'bg-gray-300 justify-start'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                setEnableKeyTTS(!enableKeyTTS);
              }}
              id="toggle-tts"
            >
              <div className="bg-white w-4 h-4 rounded-full shadow-md"></div>
            </div>
          </div>
          
          <div className="flex items-center">
            <label htmlFor="toggle-keyboard" className="mr-2 text-sm text-gray-700">
              Show Keyboard:
            </label>
            <div 
              className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer ${
                showKeyboard ? 'bg-blue-500 justify-end' : 'bg-gray-300 justify-start'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                setShowKeyboard(!showKeyboard);
              }}
              id="toggle-keyboard"
            >
              <div className="bg-white w-4 h-4 rounded-full shadow-md"></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Custom phrase input */}
      <div className="w-full max-w-3xl p-4 bg-white rounded-lg shadow-md">
        <form onSubmit={handlePhraseSubmit} className="flex flex-col sm:flex-row gap-2" onClick={handleFormElementClick}>
          <input
            type="text"
            value={customPhrase}
            onChange={(e) => setCustomPhrase(e.target.value)}
            placeholder="Enter a new phrase for practice"
            className="p-2 flex-grow border-2 border-gray-300 rounded"
            onClick={handleFormElementClick}
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={handleFormElementClick}
          >
            Update Phrase
          </button>
        </form>
      </div>
    </div>
  );
};

export default TypingGame;
