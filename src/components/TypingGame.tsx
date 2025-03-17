import React, { useState, useEffect, useRef } from 'react';

const TypingGame = () => {
  // State declarations
  const [phrase, setPhrase] = useState("the quick brown fox jumps over the lazy dog");
  const [userInput, setUserInput] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [customPhrase, setCustomPhrase] = useState("");
  const [showKeyboard, setShowKeyboard] = useState(true);
  
  // Refs with proper typing
  const inputRef = useRef<HTMLInputElement>(null);
  const keyboardRef = useRef<HTMLDivElement>(null);

  // Keyboard layout configuration
  const keyboardLayout = [
    ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
    ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
    ["z", "x", "c", "v", "b", "n", "m"],
    [" "] // Space key
  ];

  // Effect hooks
  useEffect(() => {
    // Focus the input field when component mounts
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    // Scroll to make sure the keyboard is visible
    if (keyboardRef.current) {
      keyboardRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [currentIndex]);

  // Event handlers
  const handleContainerClick = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    const char = event.key.toLowerCase();
    
    // Only process if the character matches the expected one
    if (char === phrase[currentIndex]) {
      // Play sound for the correct key
      speakLetter(char);
      
      // Update user input
      const newUserInput = userInput + char;
      setUserInput(newUserInput);
      
      // Update current index
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      
      // Check if typing is complete
      if (newIndex === phrase.length) {
        speakPhrase("Great job! You finished the phrase!");
        setTimeout(() => {
          setUserInput("");
          setCurrentIndex(0);
        }, 3000);
      }
    }
  };

  const handlePhraseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customPhrase.trim()) {
      setPhrase(customPhrase.trim().toLowerCase());
      setUserInput("");
      setCurrentIndex(0);
      setCustomPhrase("");
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
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
    for (let rowIndex = 0; rowIndex < keyboardLayout.length; rowIndex++) {
      const keyIndex = keyboardLayout[rowIndex].indexOf(char);
      if (keyIndex !== -1) {
        return { rowIndex, keyIndex };
      }
    }
    return null;
  };

  // Get the next character to type
  const nextChar = currentIndex < phrase.length ? phrase[currentIndex] : null;
  const keyPosition = nextChar ? findKeyPosition(nextChar) : null;

  // Render the keyboard with proper key offsets
  const renderKeyboard = () => {
    // Adjust the unit size for proper proportions
    // Key width (48px) + horizontal gap (4px total = 2px on each side)
    const keyUnit = 52; // 1u = 52px
    
    return (
      <div className="mx-auto" style={{ width: 'fit-content' }}>
        {/* First row: QWERTYUIOP - 0u offset */}
        <div className="flex mb-1" style={{ marginLeft: '0px' }}>
          {keyboardLayout[0].map((key, keyIndex) => (
            <div
              key={keyIndex}
              className={`
                w-12
                h-12
                flex
                items-center
                justify-center
                mx-0.5
                rounded-lg
                text-xl
                font-bold
                border-2
                relative
                ${keyPosition && keyPosition.rowIndex === 0 && keyPosition.keyIndex === keyIndex
                  ? "bg-blue-400 text-white border-blue-600 animate-pulse shadow-lg"
                  : "bg-white text-gray-700 border-gray-300"}
              `}
            >
              {key.toUpperCase()}
              
              {/* Ripple effect on target key */}
              {keyPosition && keyPosition.rowIndex === 0 && keyPosition.keyIndex === keyIndex && (
                <div className="absolute inset-0 rounded-lg animate-ping opacity-30 bg-blue-300"></div>
              )}
            </div>
          ))}
        </div>
        
        {/* Second row: ASDFGHJKL - 0.25u offset */}
        <div className="flex mb-1" style={{ marginLeft: `${keyUnit * 0.25}px` }}>
          {keyboardLayout[1].map((key, keyIndex) => (
            <div
              key={keyIndex}
              className={`
                w-12
                h-12
                flex
                items-center
                justify-center
                mx-0.5
                rounded-lg
                text-xl
                font-bold
                border-2
                relative
                ${keyPosition && keyPosition.rowIndex === 1 && keyPosition.keyIndex === keyIndex
                  ? "bg-blue-400 text-white border-blue-600 animate-pulse shadow-lg"
                  : "bg-white text-gray-700 border-gray-300"}
              `}
            >
              {key.toUpperCase()}
              
              {/* Ripple effect on target key */}
              {keyPosition && keyPosition.rowIndex === 1 && keyPosition.keyIndex === keyIndex && (
                <div className="absolute inset-0 rounded-lg animate-ping opacity-30 bg-blue-300"></div>
              )}
            </div>
          ))}
        </div>
        
        {/* Third row: ZXCVBNM - 0.75u offset */}
        <div className="flex mb-1" style={{ marginLeft: `${keyUnit * 0.75}px` }}>
          {keyboardLayout[2].map((key, keyIndex) => (
            <div
              key={keyIndex}
              className={`
                w-12
                h-12
                flex
                items-center
                justify-center
                mx-0.5
                rounded-lg
                text-xl
                font-bold
                border-2
                relative
                ${keyPosition && keyPosition.rowIndex === 2 && keyPosition.keyIndex === keyIndex
                  ? "bg-blue-400 text-white border-blue-600 animate-pulse shadow-lg"
                  : "bg-white text-gray-700 border-gray-300"}
              `}
            >
              {key.toUpperCase()}
              
              {/* Ripple effect on target key */}
              {keyPosition && keyPosition.rowIndex === 2 && keyPosition.keyIndex === keyIndex && (
                <div className="absolute inset-0 rounded-lg animate-ping opacity-30 bg-blue-300"></div>
              )}
            </div>
          ))}
        </div>
        
        {/* Space bar - 2.9u offset */}
        <div className="flex" style={{ marginLeft: `${keyUnit * 2.9}px` }}>
          <div
            className={`
              w-64
              h-12
              flex
              items-center
              justify-center
              mx-0.5
              rounded-lg
              text-sm
              font-bold
              border-2
              relative
              ${keyPosition && keyPosition.rowIndex === 3 && keyPosition.keyIndex === 0
                ? "bg-blue-400 text-white border-blue-600 animate-pulse shadow-lg"
                : "bg-white text-gray-700 border-gray-300"}
            `}
          >
            Space Bar
            
            {/* Ripple effect on target key */}
            {keyPosition && keyPosition.rowIndex === 3 && keyPosition.keyIndex === 0 && (
              <div className="absolute inset-0 rounded-lg animate-ping opacity-30 bg-blue-300"></div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render component
  return (
    <div className="flex flex-col items-center bg-blue-50 min-h-screen w-full h-full absolute top-0 left-0" onClick={handleContainerClick}>
      <h1 className="text-3xl font-bold text-blue-600 mb-6 mt-4">Typing Fun!</h1>
      
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
        <div className="mb-4">
          <div className="p-3 bg-yellow-50 rounded text-xl font-medium tracking-wide">
            {phrase.split('').map((char, index) => (
              <span 
                key={index} 
                className={`
                  ${index === currentIndex ? 'bg-blue-200 text-blue-700 rounded inline-block' : 'inline-block'}
                  ${index < currentIndex ? 'text-green-600' : 'text-gray-800'}
                `}
              >
                {char === " " ? "⎵" : char}
              </span>
            ))}
          </div>
        </div>
        
        {/* Progress indicator */}
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div 
            className="bg-green-500 h-4 rounded-full transition-all duration-300"
            style={{ width: `${(currentIndex / phrase.length) * 100}%` }}
          ></div>
        </div>
      </div>
      
      {/* Keyboard toggle button */}
      <div className="w-full max-w-3xl flex justify-end mb-2">
        <button 
          onClick={() => setShowKeyboard(!showKeyboard)}
          className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300 mb-2"
        >
          {showKeyboard ? "Hide Keyboard" : "Show Keyboard"}
        </button>
      </div>

      {/* Keyboard display */}
      {showKeyboard && (
        <div 
          ref={keyboardRef}
          className="mb-8 bg-gray-100 p-4 rounded-lg shadow-lg w-full max-w-3xl"
        >
          {renderKeyboard()}
        </div>
      )}
      
      {/* Custom phrase input */}
      <div className="w-full max-w-3xl p-4 bg-white rounded-lg shadow-md">
        <form onSubmit={handlePhraseSubmit} className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={customPhrase}
            onChange={(e) => setCustomPhrase(e.target.value)}
            placeholder="Enter a new phrase for practice"
            className="p-2 flex-grow border-2 border-gray-300 rounded"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Update Phrase
          </button>
        </form>
      </div>
    </div>
  );
};

export default TypingGame;
