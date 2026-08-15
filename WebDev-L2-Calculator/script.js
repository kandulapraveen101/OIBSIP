/**
 * CalcNova - Modern Browser-Based Calculator Logic
 * Tech Stack: Vanilla JavaScript (ES6+)
 * Strictly NO eval() - Uses custom tokenizing & mathematical evaluation.
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const expressionDisplay = document.getElementById('expressionDisplay');
  const mainDisplay = document.getElementById('mainDisplay');
  const errorMessage = document.getElementById('errorMessage');
  const errorText = document.getElementById('errorText');
  const keypad = document.getElementById('keypad');
  
  const themeToggle = document.getElementById('themeToggle');
  const soundToggle = document.getElementById('soundToggle');
  const historyToggle = document.getElementById('historyToggle');
  const historyPanel = document.getElementById('historyPanel');
  const historyList = document.getElementById('historyList');
  const clearHistoryBtn = document.getElementById('clearHistoryBtn');

  // Calculator Engine State
  let currentInput = '0';
  let expressionTokens = []; // Array of numbers & string operators e.g. [5, '+', 3]
  let isEvaluated = false;
  let isError = false;
  let isSoundEnabled = true;
  let history = JSON.parse(localStorage.getItem('calc_history') || '[]');

  // Sound Synthesizer (Web Audio API)
  let audioCtx = null;
  function playClickSound(type = 'default') {
    if (!isSoundEnabled) return;
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      const freqs = { default: 440, operator: 660, equals: 880, clear: 330 };
      osc.frequency.setValueAtTime(freqs[type] || 440, audioCtx.currentTime);
      osc.type = 'sine';

      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.05);
    } catch (e) {
      // Audio context fallbacks silently if unsupported
    }
  }

  // Helper: Format floating point arithmetic quirks (e.g. 0.1 + 0.2 = 0.3)
  function formatNumber(num) {
    if (isNaN(num) || !isFinite(num)) return null;
    // Limit decimal precision to 10 decimal places to prevent floating point inaccuracies
    const precision = 1e10;
    const rounded = Math.round(num * precision) / precision;
    return rounded.toString();
  }

  // Update Display Screens
  function updateDisplay() {
    if (isError) return;

    // Display current typed input or result
    mainDisplay.textContent = currentInput;

    // Adjust font size dynamically if main display number is very long
    if (currentInput.length > 12) {
      mainDisplay.style.fontSize = '1.4rem';
    } else if (currentInput.length > 8) {
      mainDisplay.style.fontSize = '1.8rem';
    } else {
      mainDisplay.style.fontSize = '2.25rem';
    }

    // Display upper expression line
    let exprText = expressionTokens.map(token => {
      if (typeof token === 'string') {
        return ` ${token} `;
      }
      return token;
    }).join('');

    if (isEvaluated) {
      exprText += ' =';
    }

    expressionDisplay.textContent = exprText;
    
    // Clear active highlight on operator buttons
    document.querySelectorAll('.btn-operator').forEach(btn => btn.classList.remove('active-operator'));

    // Highlight last operator if waiting for next input digit
    if (expressionTokens.length > 0 && typeof expressionTokens[expressionTokens.length - 1] === 'string' && currentInput === '0' && !isEvaluated) {
      const lastOp = expressionTokens[expressionTokens.length - 1];
      const activeBtn = document.querySelector(`.btn-operator[data-operator="${lastOp}"]`);
      if (activeBtn) activeBtn.classList.add('active-operator');
    }
  }

  // Show Error Banner Callout
  function showError(message = 'Cannot divide by zero') {
    isError = true;
    errorText.textContent = message;
    errorMessage.classList.remove('hidden');
    playClickSound('clear');
  }

  // Hide Error Banner
  function clearError() {
    isError = false;
    errorMessage.classList.add('hidden');
  }

  // Handle Digit Inputs (0-9)
  function handleNumberInput(digit) {
    if (isError) clearError();

    if (isEvaluated) {
      // Start fresh calculation after previous result
      currentInput = digit;
      expressionTokens = [];
      isEvaluated = false;
    } else {
      if (currentInput === '0') {
        currentInput = digit;
      } else {
        // Prevent exceeding 16 digits
        if (currentInput.replace('-', '').replace('.', '').length >= 16) return;
        currentInput += digit;
      }
    }
    playClickSound('default');
    updateDisplay();
  }

  // Handle Decimal Point (.)
  function handleDecimal() {
    if (isError) clearError();

    if (isEvaluated) {
      currentInput = '0.';
      expressionTokens = [];
      isEvaluated = false;
    } else {
      if (!currentInput.includes('.')) {
        currentInput += '.';
      }
    }
    playClickSound('default');
    updateDisplay();
  }

  // Handle Operator (+, −, ×, ÷)
  function handleOperator(nextOperator) {
    if (isError) clearError();

    playClickSound('operator');

    const numVal = parseFloat(currentInput);

    if (isEvaluated) {
      // Chain using the previous evaluated result
      expressionTokens = [numVal, nextOperator];
      isEvaluated = false;
      currentInput = '0';
    } else {
      // Check if last item was already an operator (allows changing operator)
      if (currentInput === '0' && expressionTokens.length > 0 && typeof expressionTokens[expressionTokens.length - 1] === 'string') {
        expressionTokens[expressionTokens.length - 1] = nextOperator;
      } else {
        expressionTokens.push(numVal);
        expressionTokens.push(nextOperator);
        currentInput = '0';
      }
    }

    updateDisplay();
  }

  /**
   * Custom Expression Evaluator (No eval!)
   * Evaluates array of tokens e.g. [5, '+', 3, '×', 2] using standard operator precedence.
   */
  function evaluateExpressionTokens(tokens) {
    if (tokens.length === 0) return null;

    // Clone tokens array for evaluation
    let list = [...tokens];

    // Standardize Operators: '÷' -> '/', '×' -> '*', '−' -> '-'
    list = list.map(item => {
      if (item === '÷') return '/';
      if (item === '×') return '*';
      if (item === '−') return '-';
      return item;
    });

    // Pass 1: High Precedence (* and /)
    let i = 0;
    while (i < list.length) {
      const op = list[i];
      if (op === '*' || op === '/') {
        const left = list[i - 1];
        const right = list[i + 1];

        if (right === undefined || isNaN(right)) {
          return null; // Incomplete expression
        }

        let res = 0;
        if (op === '*') {
          res = left * right;
        } else if (op === '/') {
          if (right === 0) {
            return 'DIV_ZERO'; // Division by zero error code
          }
          res = left / right;
        }

        // Replace left, op, right with the result
        list.splice(i - 1, 3, res);
        i = i - 1;
      } else {
        i++;
      }
    }

    // Pass 2: Low Precedence (+ and -)
    i = 0;
    while (i < list.length) {
      const op = list[i];
      if (op === '+' || op === '-') {
        const left = list[i - 1];
        const right = list[i + 1];

        if (right === undefined || isNaN(right)) {
          return null;
        }

        let res = 0;
        if (op === '+') {
          res = left + right;
        } else if (op === '-') {
          res = left - right;
        }

        list.splice(i - 1, 3, res);
        i = i - 1;
      } else {
        i++;
      }
    }

    return list[0];
  }

  // Handle Equals (=)
  function handleEquals() {
    if (isError) clearError();
    playClickSound('equals');

    if (expressionTokens.length === 0 && !isEvaluated) return;

    // If current typed input is available, push it to expression
    if (currentInput !== '0' || (expressionTokens.length > 0 && typeof expressionTokens[expressionTokens.length - 1] === 'string')) {
      expressionTokens.push(parseFloat(currentInput));
    }

    // If expression ends with trailing operator, remove it
    if (typeof expressionTokens[expressionTokens.length - 1] === 'string') {
      expressionTokens.pop();
    }

    if (expressionTokens.length === 0) return;

    // Evaluate the expression
    const rawResult = evaluateExpressionTokens(expressionTokens);

    if (rawResult === 'DIV_ZERO') {
      showError('Cannot divide by zero');
      return;
    }

    if (rawResult === null || isNaN(rawResult)) {
      showError('Invalid Expression');
      return;
    }

    const formattedRes = formatNumber(rawResult);
    if (!formattedRes) {
      showError('Result Out of Range');
      return;
    }

    // Save to calculation history
    const exprText = expressionTokens.join(' ') + ' =';
    saveHistory(exprText, formattedRes);

    currentInput = formattedRes;
    isEvaluated = true;
    updateDisplay();
  }

  // Handle Clear (AC)
  function handleClear() {
    playClickSound('clear');
    currentInput = '0';
    expressionTokens = [];
    isEvaluated = false;
    clearError();
    updateDisplay();
  }

  // Handle Backspace (DEL)
  function handleBackspace() {
    if (isError) {
      clearError();
      return;
    }
    if (isEvaluated) {
      handleClear();
      return;
    }

    playClickSound('default');
    if (currentInput.length > 1) {
      currentInput = currentInput.slice(0, -1);
      if (currentInput === '-' || currentInput === '') {
        currentInput = '0';
      }
    } else {
      currentInput = '0';
    }
    updateDisplay();
  }

  // Handle Plus/Minus Toggle (±)
  function handleNegate() {
    if (isError) clearError();
    playClickSound('default');
    if (currentInput !== '0') {
      if (currentInput.startsWith('-')) {
        currentInput = currentInput.substring(1);
      } else {
        currentInput = '-' + currentInput;
      }
    }
    updateDisplay();
  }

  // Handle Percentage (%)
  function handlePercent() {
    if (isError) clearError();
    playClickSound('operator');
    const val = parseFloat(currentInput);
    if (!isNaN(val)) {
      const res = val / 100;
      currentInput = formatNumber(res) || '0';
      updateDisplay();
    }
  }

  // Keypad Click Delegation (No inline onclick attributes)
  keypad.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;

    // Visual button press animation
    btn.classList.add('pressed');
    setTimeout(() => btn.classList.remove('pressed'), 150);

    const number = btn.dataset.number;
    const operator = btn.dataset.operator;
    const action = btn.dataset.action;

    if (number !== undefined) {
      handleNumberInput(number);
    } else if (operator !== undefined) {
      handleOperator(operator);
    } else if (action !== undefined) {
      switch (action) {
        case 'decimal': handleDecimal(); break;
        case 'clear': handleClear(); break;
        case 'backspace': handleBackspace(); break;
        case 'equals': handleEquals(); break;
        case 'negate': handleNegate(); break;
        case 'percent': handlePercent(); break;
      }
    }
  });

  // Global Keyboard Event Binding
  document.addEventListener('keydown', (e) => {
    // Avoid triggering when user focuses an input or textarea if present
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    const key = e.key;

    if (key >= '0' && key <= '9') {
      handleNumberInput(key);
      highlightKeypadButton(`[data-number="${key}"]`);
    } else if (key === '.') {
      handleDecimal();
      highlightKeypadButton('[data-action="decimal"]');
    } else if (key === '+' || key === '-') {
      const opMap = { '+': '+', '-': '−' };
      handleOperator(opMap[key]);
      highlightKeypadButton(`[data-operator="${opMap[key]}"]`);
    } else if (key === '*') {
      handleOperator('×');
      highlightKeypadButton('[data-operator="×"]');
    } else if (key === '/') {
      e.preventDefault(); // Prevent browser quick search shortcut
      handleOperator('÷');
      highlightKeypadButton('[data-operator="÷"]');
    } else if (key === 'Enter' || key === '=') {
      e.preventDefault();
      handleEquals();
      highlightKeypadButton('[data-action="equals"]');
    } else if (key === 'Backspace') {
      handleBackspace();
      highlightKeypadButton('[data-action="backspace"]');
    } else if (key === 'Escape' || key.toLowerCase() === 'c') {
      handleClear();
      highlightKeypadButton('[data-action="clear"]');
    } else if (key === '%') {
      handlePercent();
      highlightKeypadButton('[data-action="percent"]');
    }
  });

  // Helper to show visual press feedback for physical keyboard presses
  function highlightKeypadButton(selector) {
    const btn = document.querySelector(selector);
    if (btn) {
      btn.classList.add('pressed');
      setTimeout(() => btn.classList.remove('pressed'), 150);
    }
  }

  // Theme Switcher (Dark / Light Glass)
  themeToggle.addEventListener('click', () => {
    playClickSound('default');
    document.body.classList.toggle('light-theme');
    document.body.classList.toggle('dark-theme');
  });

  // Sound Toggle Switch
  soundToggle.addEventListener('click', () => {
    isSoundEnabled = !isSoundEnabled;
    soundToggle.classList.toggle('active', isSoundEnabled);
    if (isSoundEnabled) playClickSound('default');
  });

  // History Drawer Toggle
  historyToggle.addEventListener('click', () => {
    playClickSound('default');
    historyPanel.classList.toggle('hidden');
    renderHistory();
  });

  // Clear History Action
  clearHistoryBtn.addEventListener('click', () => {
    playClickSound('clear');
    history = [];
    localStorage.removeItem('calc_history');
    renderHistory();
  });

  // Save Completed Calculation to History
  function saveHistory(expr, result) {
    history.unshift({ expr, result, timestamp: Date.now() });
    if (history.length > 20) history.pop(); // Keep last 20 entries
    localStorage.setItem('calc_history', JSON.stringify(history));
    renderHistory();
  }

  // Render Calculation History Panel
  function renderHistory() {
    if (history.length === 0) {
      historyList.innerHTML = '<li class="empty-history">No past calculations</li>';
      return;
    }

    historyList.innerHTML = history.map(item => `
      <li class="history-item" data-result="${item.result}">
        <span class="history-expr">${item.expr}</span>
        <span class="history-res">${item.result}</span>
      </li>
    `).join('');

    // Add click event to recall result back to calculator
    document.querySelectorAll('.history-item').forEach(item => {
      item.addEventListener('click', () => {
        const recalledResult = item.dataset.result;
        currentInput = recalledResult;
        isEvaluated = false;
        expressionTokens = [];
        historyPanel.classList.add('hidden');
        playClickSound('default');
        updateDisplay();
      });
    });
  }

  // Initial render
  updateDisplay();
  renderHistory();
});
